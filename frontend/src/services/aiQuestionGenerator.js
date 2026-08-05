// ═══════════════════════════════════════════════════════════════════════════
// AI QUESTION GENERATOR SERVICE
// Uses GROQ LLM to generate educational questions based on study topics
// ═══════════════════════════════════════════════════════════════════════════

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize and correct study topic using AI
 * @param {string} rawTopic - Raw topic entered by user
 * @returns {Promise<Object>} - { normalizedTopic, category, difficulty }
 */
export async function normalizeStudyTopic(rawTopic) {
  try {
    console.log('🔍 Normalizing topic:', rawTopic);

    const prompt = `You are an educational topic normalizer. Convert the following user input into a proper educational topic.

User input: "${rawTopic}"

Common abbreviations:
- dsa → Data Structures and Algorithms
- os → Operating Systems
- dbms → Database Management Systems
- cn → Computer Networks
- oop/oops → Object Oriented Programming
- ml → Machine Learning
- ai → Artificial Intelligence
- webdev → Web Development

Instructions:
1. Correct spelling mistakes
2. Expand abbreviations
3. Use proper capitalization
4. Return a clear educational topic name
5. Identify the category (Programming, CS Fundamentals, Mathematics, etc.)
6. Estimate difficulty level (Beginner, Intermediate, Advanced)

Respond in JSON format:
{
  "normalizedTopic": "proper topic name",
  "category": "category name",
  "difficulty": "difficulty level"
}`;

    // Try GROQ first
    if (GROQ_API_KEY) {
      const result = await normalizeWithGroq(prompt);
      if (result) return result;
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY) {
      const result = await normalizeWithGemini(prompt);
      if (result) return result;
    }

    // Fallback to OpenRouter
    if (OPENROUTER_API_KEY) {
      const result = await normalizeWithOpenRouter(prompt);
      if (result) return result;
    }

    // Final fallback - basic normalization
    return fallbackNormalization(rawTopic);

  } catch (error) {
    console.error('❌ Error normalizing topic:', error);
    return fallbackNormalization(rawTopic);
  }
}

/**
 * Normalize with GROQ
 */
async function normalizeWithGroq(prompt) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an educational topic normalizer. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ GROQ normalized:', parsed);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ GROQ normalization error:', error);
    return null;
  }
}

/**
 * Normalize with Gemini
 */
async function normalizeWithGemini(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini normalized:', parsed);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ Gemini normalization error:', error);
    return null;
  }
}

/**
 * Normalize with OpenRouter
 */
async function normalizeWithOpenRouter(prompt) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an educational topic normalizer. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ OpenRouter normalized:', parsed);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ OpenRouter normalization error:', error);
    return null;
  }
}

/**
 * Fallback normalization (keyword-based)
 */
function fallbackNormalization(rawTopic) {
  const topic = rawTopic.toLowerCase().trim();
  
  const abbreviations = {
    'dsa': 'Data Structures and Algorithms',
    'os': 'Operating Systems',
    'dbms': 'Database Management Systems',
    'cn': 'Computer Networks',
    'oop': 'Object Oriented Programming',
    'oops': 'Object Oriented Programming',
    'ml': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'webdev': 'Web Development',
    'webdevlopment': 'Web Development',
    'js': 'JavaScript',
    'py': 'Python',
    'java': 'Java Programming',
    'react': 'React JS',
    'node': 'Node.js'
  };

  let normalized = abbreviations[topic] || rawTopic;
  
  // Capitalize first letter of each word
  normalized = normalized.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');

  return {
    normalizedTopic: normalized,
    category: 'General',
    difficulty: 'Intermediate'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate quiz questions for a topic
 * @param {string} topic - Normalized topic
 * @param {number} questionCount - Number of questions (default: 5)
 * @returns {Promise<Array>} - Array of questions
 */
export async function generateQuizQuestions(topic, questionCount = 5) {
  try {
    console.log('📝 Generating questions for:', topic);

    const prompt = `You are an educational quiz generator. Generate ${questionCount} quiz questions about "${topic}".

Requirements:
1. Mix of question types: MCQ, True/False, Short Answer
2. Beginner to intermediate difficulty
3. Focus on core concepts and practical understanding
4. Include clear, concise questions
5. For MCQs, provide 4 options with one correct answer
6. For True/False, provide the statement
7. For Short Answer, ask conceptual questions

Respond in JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "brief explanation"
    },
    {
      "id": 2,
      "type": "truefalse",
      "question": "statement",
      "correctAnswer": true,
      "explanation": "brief explanation"
    },
    {
      "id": 3,
      "type": "short",
      "question": "question text",
      "correctAnswer": "expected answer",
      "explanation": "brief explanation"
    }
  ]
}

Generate exactly ${questionCount} questions.`;

    // Try GROQ first
    if (GROQ_API_KEY) {
      const result = await generateWithGroq(prompt);
      if (result) return result;
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY) {
      const result = await generateWithGemini(prompt);
      if (result) return result;
    }

    // Fallback to OpenRouter
    if (OPENROUTER_API_KEY) {
      const result = await generateWithOpenRouter(prompt);
      if (result) return result;
    }

    // Final fallback - generic questions
    return generateFallbackQuestions(topic, questionCount);

  } catch (error) {
    console.error('❌ Error generating questions:', error);
    return generateFallbackQuestions(topic, questionCount);
  }
}

/**
 * Generate with GROQ
 */
async function generateWithGroq(prompt) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an educational quiz generator. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ GROQ generated questions:', parsed.questions?.length);
      return parsed.questions || [];
    }

    return null;
  } catch (error) {
    console.error('❌ GROQ generation error:', error);
    return null;
  }
}

/**
 * Generate with Gemini
 */
async function generateWithGemini(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Gemini generated questions:', parsed.questions?.length);
      return parsed.questions || [];
    }

    return null;
  } catch (error) {
    console.error('❌ Gemini generation error:', error);
    return null;
  }
}

/**
 * Generate with OpenRouter
 */
async function generateWithOpenRouter(prompt) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an educational quiz generator. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ OpenRouter generated questions:', parsed.questions?.length);
      return parsed.questions || [];
    }

    return null;
  } catch (error) {
    console.error('❌ OpenRouter generation error:', error);
    return null;
  }
}

/**
 * Generate fallback questions
 */
function generateFallbackQuestions(topic, count) {
  const questions = [];
  
  for (let i = 1; i <= count; i++) {
    if (i % 3 === 1) {
      questions.push({
        id: i,
        type: 'mcq',
        question: `What is a key concept in ${topic}?`,
        options: [
          'Fundamental principle',
          'Advanced technique',
          'Basic operation',
          'Complex algorithm'
        ],
        correctAnswer: 'Fundamental principle',
        explanation: `Understanding fundamental principles is crucial in ${topic}.`
      });
    } else if (i % 3 === 2) {
      questions.push({
        id: i,
        type: 'truefalse',
        question: `${topic} requires practical understanding.`,
        correctAnswer: true,
        explanation: `Practical understanding is essential for mastering ${topic}.`
      });
    } else {
      questions.push({
        id: i,
        type: 'short',
        question: `Explain a basic concept in ${topic}.`,
        correctAnswer: 'A fundamental concept that forms the foundation',
        explanation: `Understanding basic concepts helps build strong foundation in ${topic}.`
      });
    }
  }

  return questions;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  normalizeStudyTopic,
  generateQuizQuestions
};
