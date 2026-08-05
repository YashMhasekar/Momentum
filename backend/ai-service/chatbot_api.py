import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.vectorstores import Chroma

from langchain_classic.chains.retrieval_qa.base import RetrievalQA

from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_groq import ChatGroq

# Emotion Detection Imports
import cv2
from deepface import DeepFace
import base64
import numpy as np
from collections import Counter
import time

# ================= LOAD ENV =================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ================= FASTAPI =================

app = FastAPI()

# ================= CORS MIDDLEWARE =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# ================= INITIALIZE LLM =================

llm = ChatGroq(
    temperature=0,
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile"
)

# ================= EMBEDDINGS =================

embeddings = HuggingFaceBgeEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

DB_PATH = "./chroma_db"

# ================= CREATE VECTOR DB =================

def create_vector_db():

    loader = DirectoryLoader(
        "./data/",
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )

    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    texts = text_splitter.split_documents(documents)

    vector_db = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=DB_PATH
    )

    vector_db.persist()

    print("✅ ChromaDB created successfully")

    return vector_db

# ================= LOAD VECTOR DB =================

if not os.path.exists(DB_PATH):

    vector_db = create_vector_db()

else:

    vector_db = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embeddings
    )

    print("✅ Existing ChromaDB loaded")

# ================= PROMPT TEMPLATE =================

prompt_template = """
You are an AI Study Mentor.

You help students with:
- Study planning
- Motivation
- Focus
- Productivity
- Revision techniques
- Weak subject guidance

Use the provided context carefully.

Context:
{context}

Student:
{question}

AI Mentor:
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# ================= QA CHAIN =================

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_db.as_retriever(search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT}
)

# ================= REQUEST MODELS =================

class ChatRequest(BaseModel):
    message: str

class StressAnalysisRequest(BaseModel):
    message: str
    userId: str = None
    conversationHistory: list = []

class EmotionDetectionRequest(BaseModel):
    userId: str
    imageData: str  # Base64 encoded image
    sessionType: str = "study"  # study, focus, general
    duration: int = 6  # seconds

class EmotionAnalysisRequest(BaseModel):
    userId: str
    emotions: list  # List of detected emotions
    sessionType: str = "study"

# ================= API ROUTE =================

@app.post("/chat")
def chat(request: ChatRequest):
    """
    AI Mentor chat endpoint.
    Receives a message and returns an AI-generated response.
    """
    try:
        result = qa_chain.invoke({
            "query": request.message
        })
        
        return {
            "response": result["result"]
        }
    except Exception as e:
        print(f"❌ Error processing message: {str(e)}")
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again."
        }

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "AI Mentor Backend is running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected" if vector_db else "disconnected",
        "llm": "connected"
    }

# ================= STRESS DETECTION ENDPOINT =================

@app.post("/analyze-stress")
def analyze_stress(request: StressAnalysisRequest):
    """
    Advanced stress detection using LLM.
    Analyzes student messages for stress indicators, mood, and provides insights.
    """
    try:
        # Create a specialized prompt for stress analysis
        stress_analysis_prompt = f"""
You are an expert psychological wellness analyzer for students. Analyze the following student message and provide a detailed JSON response.

Student Message: "{request.message}"

Analyze and provide:
1. **Stress Level**: Rate from 0-100 (0=no stress, 100=extreme burnout)
2. **Stress Category**: Choose one: "healthy", "mild_stress", "high_stress", "burnout_risk"
3. **Mood Score**: Rate from 0-100 (0=very negative, 100=very positive)
4. **Sentiment**: Choose one: "positive", "neutral", "negative"
5. **Keywords**: Extract 5-10 important keywords related to stress, emotions, or topics
6. **Topics**: Identify main topics (e.g., exams, coding, assignments, sleep, focus, motivation)
7. **Behavioral Indicators**: Identify any concerning patterns (e.g., sleep issues, focus problems, burnout signs)
8. **Wellness Recommendations**: Provide 2-3 specific, actionable recommendations
9. **Detailed Analysis**: A brief paragraph explaining your assessment
10. **Urgency Level**: Choose one: "low", "medium", "high", "critical"

IMPORTANT GUIDELINES:
- Be empathetic and supportive
- Use safe, non-clinical language
- Focus on wellness, not medical diagnosis
- Identify both positive and negative indicators
- Consider context from conversation history if provided

Respond ONLY with valid JSON in this exact format:
{{
    "stressScore": <number 0-100>,
    "stressLevel": "<healthy|mild_stress|high_stress|burnout_risk>",
    "moodScore": <number 0-100>,
    "sentiment": "<positive|neutral|negative>",
    "keywords": ["keyword1", "keyword2", ...],
    "topics": ["topic1", "topic2", ...],
    "behavioralIndicators": ["indicator1", "indicator2", ...],
    "recommendations": [
        {{"title": "Recommendation 1", "description": "Details...", "icon": "🧘"}},
        {{"title": "Recommendation 2", "description": "Details...", "icon": "💪"}}
    ],
    "detailedAnalysis": "Your analysis here...",
    "urgencyLevel": "<low|medium|high|critical>",
    "supportiveMessage": "A brief supportive message for the student"
}}
"""

        # Add conversation history context if provided
        if request.conversationHistory and len(request.conversationHistory) > 0:
            history_context = "\n\nRecent Conversation History:\n"
            for i, msg in enumerate(request.conversationHistory[-5:]):  # Last 5 messages
                history_context += f"{i+1}. {msg}\n"
            stress_analysis_prompt += history_context

        # Call LLM for analysis
        response = llm.invoke(stress_analysis_prompt)
        
        # Extract the response content
        analysis_text = response.content if hasattr(response, 'content') else str(response)
        
        # Try to parse JSON from response
        import json
        import re
        
        # Extract JSON from markdown code blocks if present
        json_match = re.search(r'```json\s*(.*?)\s*```', analysis_text, re.DOTALL)
        if json_match:
            analysis_text = json_match.group(1)
        else:
            # Try to find JSON object in the text
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                analysis_text = json_match.group(0)
        
        # Parse JSON
        try:
            analysis_data = json.loads(analysis_text)
        except json.JSONDecodeError:
            # Fallback: Create structured response from text
            analysis_data = {
                "stressScore": 50,
                "stressLevel": "mild_stress",
                "moodScore": 50,
                "sentiment": "neutral",
                "keywords": extract_keywords_fallback(request.message),
                "topics": ["general"],
                "behavioralIndicators": [],
                "recommendations": [
                    {
                        "title": "Take a Break",
                        "description": "Consider taking a short break to recharge.",
                        "icon": "🧘"
                    }
                ],
                "detailedAnalysis": analysis_text[:500],
                "urgencyLevel": "low",
                "supportiveMessage": "I'm here to help you manage your studies effectively."
            }
        
        # Add metadata
        analysis_data["originalMessage"] = request.message
        analysis_data["timestamp"] = None  # Will be set by frontend
        analysis_data["userId"] = request.userId
        
        return {
            "success": True,
            "analysis": analysis_data
        }
        
    except Exception as e:
        print(f"❌ Error in stress analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return fallback analysis
        return {
            "success": False,
            "error": str(e),
            "analysis": {
                "stressScore": 50,
                "stressLevel": "mild_stress",
                "moodScore": 50,
                "sentiment": "neutral",
                "keywords": extract_keywords_fallback(request.message),
                "topics": ["general"],
                "behavioralIndicators": [],
                "recommendations": [
                    {
                        "title": "Stay Positive",
                        "description": "Keep working on your goals steadily.",
                        "icon": "💪"
                    }
                ],
                "detailedAnalysis": "Unable to perform detailed analysis at this time.",
                "urgencyLevel": "low",
                "supportiveMessage": "I'm here to support you in your learning journey.",
                "originalMessage": request.message,
                "userId": request.userId
            }
        }

def extract_keywords_fallback(text):
    """Fallback keyword extraction using simple word frequency"""
    import re
    from collections import Counter
    
    # Remove common words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'}
    
    # Extract words
    words = re.findall(r'\b[a-z]+\b', text.lower())
    
    # Filter and count
    filtered_words = [w for w in words if w not in stop_words and len(w) > 3]
    word_counts = Counter(filtered_words)
    
    # Return top keywords
    return [word for word, count in word_counts.most_common(10)]

# ================= EMOTION DETECTION ENDPOINT =================

@app.post("/detect-emotion")
def detect_emotion(request: EmotionDetectionRequest):
    """
    Real-time emotion detection from webcam image.
    Analyzes facial expressions and returns dominant emotion.
    """
    try:
        # Decode base64 image
        image_data = request.imageData.split(',')[1] if ',' in request.imageData else request.imageData
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {
                "success": False,
                "error": "Invalid image data"
            }
        
        # Detect emotion using DeepFace
        try:
            results = DeepFace.analyze(
                frame,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )
            
            # Extract emotion data
            if isinstance(results, list):
                result = results[0]
            else:
                result = results
            
            dominant_emotion = result.get('dominant_emotion', 'neutral')
            emotion_scores_raw = result.get('emotion', {})
            
            # Convert numpy types to native Python types for JSON serialization
            emotion_scores = {
                emotion: float(score) if isinstance(score, (np.floating, np.integer)) else score
                for emotion, score in emotion_scores_raw.items()
            }
            
            return {
                "success": True,
                "emotion": str(dominant_emotion),
                "scores": emotion_scores,
                "timestamp": float(time.time()),
                "userId": str(request.userId),
                "sessionType": str(request.sessionType)
            }
            
        except Exception as e:
            print(f"⚠️ DeepFace analysis error: {str(e)}")
            return {
                "success": False,
                "error": "No face detected or analysis failed",
                "emotion": "neutral",
                "scores": {}
            }
    
    except Exception as e:
        print(f"❌ Error in emotion detection: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/analyze-emotion-session")
def analyze_emotion_session(request: EmotionAnalysisRequest):
    """
    Analyze a complete emotion detection session.
    Provides insights based on collected emotions.
    """
    try:
        if not request.emotions or len(request.emotions) == 0:
            return {
                "success": False,
                "error": "No emotions provided"
            }
        
        # Count emotion frequencies
        emotion_counts = Counter(request.emotions)
        total_detections = len(request.emotions)
        
        # Calculate dominant emotion
        dominant_emotion = emotion_counts.most_common(1)[0][0]
        dominant_percentage = (emotion_counts[dominant_emotion] / total_detections) * 100
        
        # Calculate emotion distribution
        emotion_distribution = {
            emotion: {
                "count": count,
                "percentage": round((count / total_detections) * 100, 2)
            }
            for emotion, count in emotion_counts.items()
        }
        
        # Emotion to wellness mapping
        positive_emotions = ['happy', 'neutral']
        negative_emotions = ['sad', 'angry', 'fear', 'disgust']
        
        positive_count = sum(emotion_counts.get(e, 0) for e in positive_emotions)
        negative_count = sum(emotion_counts.get(e, 0) for e in negative_emotions)
        
        wellness_score = round((positive_count / total_detections) * 100, 2)
        
        # Generate insights using LLM
        emotion_summary = ", ".join([f"{emotion}: {data['percentage']}%" 
                                     for emotion, data in emotion_distribution.items()])
        
        insight_prompt = f"""
You are a student wellness AI analyzing emotion detection results.

Session Type: {request.sessionType}
Dominant Emotion: {dominant_emotion} ({dominant_percentage:.1f}%)
Emotion Distribution: {emotion_summary}
Wellness Score: {wellness_score}%

Provide a brief, supportive analysis (2-3 sentences) about the student's emotional state during this session.
Focus on:
1. What the emotions indicate about their study state
2. Positive reinforcement
3. One actionable suggestion if needed

Keep it encouraging and constructive.
"""
        
        try:
            llm_response = llm.invoke(insight_prompt)
            ai_insight = llm_response.content if hasattr(llm_response, 'content') else str(llm_response)
        except:
            ai_insight = f"Your dominant emotion was {dominant_emotion}. Keep maintaining a positive study environment!"
        
        # Generate recommendations based on emotions
        recommendations = generate_emotion_recommendations(
            dominant_emotion,
            emotion_distribution,
            wellness_score
        )
        
        return {
            "success": True,
            "analysis": {
                "dominantEmotion": str(dominant_emotion),
                "dominantPercentage": float(round(dominant_percentage, 2)),
                "emotionDistribution": emotion_distribution,
                "wellnessScore": float(wellness_score),
                "totalDetections": int(total_detections),
                "aiInsight": str(ai_insight),
                "recommendations": recommendations,
                "sessionType": str(request.sessionType),
                "userId": str(request.userId),
                "timestamp": float(time.time())
            }
        }
        
    except Exception as e:
        print(f"❌ Error in emotion session analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e)
        }

def generate_emotion_recommendations(dominant_emotion, distribution, wellness_score):
    """Generate personalized recommendations based on emotion analysis"""
    recommendations = []
    
    # Emotion-specific recommendations
    emotion_advice = {
        'happy': {
            'icon': '😊',
            'title': 'Great Energy!',
            'description': 'Your positive mood is perfect for learning. Tackle challenging topics now!'
        },
        'neutral': {
            'icon': '😐',
            'title': 'Steady Focus',
            'description': 'Neutral emotions indicate good concentration. Keep your momentum going!'
        },
        'sad': {
            'icon': '😢',
            'title': 'Take a Break',
            'description': 'Consider a short walk or talking to someone. Your wellbeing matters!'
        },
        'angry': {
            'icon': '😠',
            'title': 'Manage Frustration',
            'description': 'Try deep breathing exercises or switch to a different subject for now.'
        },
        'fear': {
            'icon': '😰',
            'title': 'Reduce Anxiety',
            'description': 'Break tasks into smaller steps. Remember, you\'ve got this!'
        },
        'surprise': {
            'icon': '😲',
            'title': 'Stay Engaged',
            'description': 'Your curiosity is active! Great time for exploring new concepts.'
        },
        'disgust': {
            'icon': '😖',
            'title': 'Change Approach',
            'description': 'Try a different learning method or take a refreshing break.'
        }
    }
    
    # Add dominant emotion recommendation
    if dominant_emotion in emotion_advice:
        recommendations.append(emotion_advice[dominant_emotion])
    
    # Wellness-based recommendations
    if wellness_score < 50:
        recommendations.append({
            'icon': '🧘',
            'title': 'Wellness Check',
            'description': 'Your emotional state suggests you need self-care. Take breaks regularly.'
        })
    elif wellness_score >= 80:
        recommendations.append({
            'icon': '🚀',
            'title': 'Peak Performance',
            'description': 'You\'re in an optimal state for learning! Make the most of it.'
        })
    
    # Add general wellness tip
    recommendations.append({
        'icon': '💡',
        'title': 'Study Tip',
        'description': 'Regular emotion check-ins help maintain optimal learning conditions.'
    })
    
    return recommendations[:3]  # Return top 3 recommendations

# ================= STARTUP =================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*50)
    print("🤖 AI Mentor Backend Starting...")
    print("="*50)
    print(f"📍 Server: http://127.0.0.1:8000")
    print(f"📚 Docs: http://127.0.0.1:8000/docs")
    print(f"🔥 Status: Ready to help students!")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="127.0.0.1", port=8000)