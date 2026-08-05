"""
Alternative Emotion Detection API using FER (Facial Expression Recognition)
This version doesn't require TensorFlow and works on older CPUs
"""

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

# Emotion Detection Imports - Using FER instead of DeepFace
import cv2
import base64
import numpy as np
from collections import Counter
import time

# Try to import FER, fallback to simple detection if not available
try:
    from fer import FER
    emotion_detector = FER(mtcnn=False)  # Use faster Haar Cascade instead of MTCNN
    USE_FER = True
    print("✅ Using FER for emotion detection")
except ImportError:
    USE_FER = False
    print("⚠️ FER not installed. Install with: pip install fer")
    print("   Falling back to simple emotion detection")

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

class EmotionDetectionRequest(BaseModel):
    userId: str
    imageData: str  # Base64 encoded image
    sessionType: str = "study"  # study, focus, general
    duration: int = 6  # seconds

class EmotionAnalysisRequest(BaseModel):
    userId: str
    emotions: list  # List of detected emotions
    sessionType: str = "study"

# ================= SIMPLE EMOTION DETECTION =================

def detect_emotion_simple(frame):
    """
    Simple fallback emotion detection without ML
    Returns neutral emotion
    """
    return {
        'dominant_emotion': 'neutral',
        'emotion': {
            'angry': 0.0,
            'disgust': 0.0,
            'fear': 0.0,
            'happy': 0.0,
            'sad': 0.0,
            'surprise': 0.0,
            'neutral': 100.0
        }
    }

def detect_emotion_fer(frame):
    """
    Emotion detection using FER library
    """
    try:
        # Detect emotions
        result = emotion_detector.detect_emotions(frame)
        
        if result and len(result) > 0:
            # Get first face
            emotions = result[0]['emotions']
            
            # Find dominant emotion
            dominant_emotion = max(emotions, key=emotions.get)
            
            # Convert to percentages
            emotion_scores = {k: float(v * 100) for k, v in emotions.items()}
            
            return {
                'dominant_emotion': dominant_emotion,
                'emotion': emotion_scores
            }
        else:
            # No face detected
            return detect_emotion_simple(frame)
            
    except Exception as e:
        print(f"FER detection error: {str(e)}")
        return detect_emotion_simple(frame)

# ================= API ROUTES =================

@app.post("/chat")
def chat(request: ChatRequest):
    """AI Mentor chat endpoint"""
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
        "message": "AI Mentor Backend is running (Alternative Version)",
        "version": "1.0.0-alt",
        "emotion_detector": "FER" if USE_FER else "Simple"
    }

@app.get("/health")
def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected" if vector_db else "disconnected",
        "llm": "connected",
        "emotion_detector": "FER" if USE_FER else "Simple (fallback)"
    }

# ================= EMOTION DETECTION ENDPOINT =================

@app.post("/detect-emotion")
def detect_emotion(request: EmotionDetectionRequest):
    """
    Real-time emotion detection from webcam image.
    Uses FER library (lighter than DeepFace, no TensorFlow required)
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
        
        # Detect emotion
        try:
            if USE_FER:
                result = detect_emotion_fer(frame)
            else:
                result = detect_emotion_simple(frame)
            
            dominant_emotion = result['dominant_emotion']
            emotion_scores = result['emotion']
            
            # Ensure all values are native Python types
            emotion_scores_clean = {
                emotion: float(score)
                for emotion, score in emotion_scores.items()
            }
            
            return {
                "success": True,
                "emotion": str(dominant_emotion),
                "scores": emotion_scores_clean,
                "timestamp": float(time.time()),
                "userId": str(request.userId),
                "sessionType": str(request.sessionType)
            }
            
        except Exception as e:
            print(f"⚠️ Emotion detection error: {str(e)}")
            return {
                "success": False,
                "error": "Emotion detection failed",
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
                "count": int(count),
                "percentage": float(round((count / total_detections) * 100, 2))
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
        
        # Generate recommendations
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
    print("🤖 AI Mentor Backend Starting (Alternative Version)...")
    print("="*50)
    print(f"📍 Server: http://127.0.0.1:8000")
    print(f"📚 Docs: http://127.0.0.1:8000/docs")
    print(f"🔥 Emotion Detector: {'FER (Lightweight)' if USE_FER else 'Simple Fallback'}")
    print(f"🔥 Status: Ready to help students!")
    print("="*50 + "\n")
    
    if not USE_FER:
        print("⚠️ WARNING: FER library not installed")
        print("   Install with: pip install fer")
        print("   Using simple fallback (always returns 'neutral')")
        print()
    
    uvicorn.run(app, host="127.0.0.1", port=8000)
