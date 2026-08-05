// ═══════════════════════════════════════════════════════════════════════════
// FOCUS EVALUATION SERVICE
// Evaluates student answers and calculates learning quality scores
// ═══════════════════════════════════════════════════════════════════════════

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ═══════════════════════════════════════════════════════════════════════════
// ANSWER EVALUATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evaluate student answers using AI
 * @param {Array} questions - Array of questions
 * @param {Object} userAnswers - User's answers { questionId: answer }
 * @param {string} topic - Study topic
 * @returns {Promise<Object>} - Evaluation results
 */
export async function evaluateAnswers(questions, userAnswers, topic) {
  try {
    console.log('🎯 Evaluating answers for:', topic);

    let correctCount = 0;
    let totalScore = 0;
    const evaluations = [];

    // Evaluate each question
    for (const question of questions) {
      const userAnswer = userAnswers[question.id];

      if (!userAnswer) {
        evaluations.push({
          questionId: question.id,
          correct: false,
          score: 0,
          feedback: 'No answer provided'
        });
        continue;
      }

      let evaluation;

      if (question.type === 'mcq') {
        // MCQ evaluation (exact match)
        const correct = userAnswer === question.correctAnswer;
        correctCount += correct ? 1 : 0;
        totalScore += correct ? 20 : 0;

        evaluation = {
          questionId: question.id,
          correct,
          score: correct ? 20 : 0,
          feedback: correct ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`,
          explanation: question.explanation
        };
      } else if (question.type === 'truefalse') {
        // True/False evaluation (exact match)
        const correct = userAnswer === question.correctAnswer;
        correctCount += correct ? 1 : 0;
        totalScore += correct ? 20 : 0;

        evaluation = {
          questionId: question.id,
          correct,
          score: correct ? 20 : 0,
          feedback: correct ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`,
          explanation: question.explanation
        };
      } else if (question.type === 'short') {
        // Short answer evaluation (AI-powered)
        const aiEval = await evaluateShortAnswer(
          question.question,
          question.correctAnswer,
          userAnswer,
          topic
        );

        correctCount += aiEval.score >= 15 ? 1 : 0;
        totalScore += aiEval.score;

        evaluation = {
          questionId: question.id,
          correct: aiEval.score >= 15,
          score: aiEval.score,
          feedback: aiEval.feedback,
          explanation: question.explanation
        };
      }

      evaluations.push(evaluation);
    }

    // Calculate overall metrics
    const percentage = Math.round((totalScore / (questions.length * 20)) * 100);
    const confidence = calculateConfidence(percentage);
    const learningQuality = calculateLearningQuality(evaluations);

    const result = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      totalScore: percentage,
      confidence,
      learningQuality,
      evaluations,
      feedback: generateOverallFeedback(percentage, topic),
      passed: percentage >= 60
    };

    console.log('✅ Evaluation complete:', result);
    return result;

  } catch (error) {
    console.error('❌ Error evaluating answers:', error);
    return fallbackEvaluation(questions, userAnswers);
  }
}

/**
 * Evaluate short answer using AI
 */
async function evaluateShortAnswer(question, correctAnswer, userAnswer, topic) {
  try {
    const prompt = `You are an educational evaluator. Evaluate the student's answer.

Topic: ${topic}
Question: ${question}
Expected Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Evaluate based on:
1. Correctness of concepts
2. Relevance to the question
3. Understanding demonstrated

Respond in JSON format:
{
  "score": 0-20,
  "feedback": "brief feedback"
}

Score guide:
- 20: Perfect answer
- 15-19: Good understanding
- 10-14: Partial understanding
- 5-9: Minimal understanding
- 0-4: Incorrect or irrelevant`;

    // Try GROQ first
    if (GROQ_API_KEY) {
      const result = await evaluateWithGroq(prompt);
      if (result) return result;
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY) {
      const result = await evaluateWithGemini(prompt);
      if (result) return result;
    }

    // Final fallback - keyword matching
    return fallbackShortAnswerEval(correctAnswer, userAnswer);

  } catch (error) {
    console.error('❌ Error evaluating short answer:', error);
    return fallbackShortAnswerEval(correctAnswer, userAnswer);
  }
}

/**
 * Evaluate with GROQ
 */
async function evaluateWithGroq(prompt) {
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
          { role: 'system', content: 'You are an educational evaluator. Always respond with valid JSON.' },
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
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ GROQ evaluation error:', error);
    return null;
  }
}

/**
 * Evaluate with Gemini
 */
async function evaluateWithGemini(prompt) {
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
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ Gemini evaluation error:', error);
    return null;
  }
}

/**
 * Fallback short answer evaluation (keyword matching)
 */
function fallbackShortAnswerEval(correctAnswer, userAnswer) {
  const correctWords = correctAnswer.toLowerCase().split(/\s+/);
  const userWords = userAnswer.toLowerCase().split(/\s+/);

  let matchCount = 0;
  for (const word of correctWords) {
    if (word.length > 3 && userWords.some(uw => uw.includes(word) || word.includes(uw))) {
      matchCount++;
    }
  }

  const matchPercentage = (matchCount / correctWords.length) * 100;
  let score = 0;
  let feedback = '';

  if (matchPercentage >= 70) {
    score = 18;
    feedback = 'Good answer! Shows understanding of key concepts.';
  } else if (matchPercentage >= 50) {
    score = 14;
    feedback = 'Partial understanding. Some key concepts are correct.';
  } else if (matchPercentage >= 30) {
    score = 10;
    feedback = 'Basic understanding shown, but missing important details.';
  } else {
    score = 5;
    feedback = 'Answer needs improvement. Review the topic concepts.';
  }

  return { score, feedback };
}

/**
 * Fallback evaluation (when AI fails)
 */
function fallbackEvaluation(questions, userAnswers) {
  let correctCount = 0;
  let totalScore = 0;
  const evaluations = [];

  for (const question of questions) {
    const userAnswer = userAnswers[question.id];

    if (!userAnswer) {
      evaluations.push({
        questionId: question.id,
        correct: false,
        score: 0,
        feedback: 'No answer provided'
      });
      continue;
    }

    let correct = false;
    let score = 0;

    if (question.type === 'mcq' || question.type === 'truefalse') {
      correct = userAnswer === question.correctAnswer;
      score = correct ? 20 : 0;
    } else {
      const evaluation = fallbackShortAnswerEval(question.correctAnswer, userAnswer);
      correct = evaluation.score >= 15;
      score = evaluation.score;
    }

    correctCount += correct ? 1 : 0;
    totalScore += score;

    evaluations.push({
      questionId: question.id,
      correct,
      score,
      feedback: correct ? 'Correct!' : 'Incorrect',
      explanation: question.explanation
    });
  }

  const percentage = Math.round((totalScore / (questions.length * 20)) * 100);

  return {
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    totalScore: percentage,
    confidence: calculateConfidence(percentage),
    learningQuality: 'medium',
    evaluations,
    feedback: generateOverallFeedback(percentage, 'this topic'),
    passed: percentage >= 60
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate confidence level
 */
function calculateConfidence(percentage) {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'high';
  if (percentage >= 60) return 'medium';
  if (percentage >= 40) return 'low';
  return 'very-low';
}

/**
 * Calculate learning quality
 */
function calculateLearningQuality(evaluations) {
  const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;

  if (avgScore >= 18) return 'excellent';
  if (avgScore >= 15) return 'good';
  if (avgScore >= 12) return 'fair';
  return 'needs-improvement';
}

/**
 * Generate overall feedback
 */
function generateOverallFeedback(percentage, topic) {
  if (percentage >= 90) {
    return `🎉 Excellent! You have a strong understanding of ${topic}. Keep up the great work!`;
  } else if (percentage >= 75) {
    return `👍 Great job! You have a good grasp of ${topic}. Minor improvements will make you an expert!`;
  } else if (percentage >= 60) {
    return `✅ Good effort! You understand the basics of ${topic}. Review the concepts you missed.`;
  } else if (percentage >= 40) {
    return `📚 Keep learning! You have some understanding of ${topic}, but need more practice.`;
  } else {
    return `💪 Don't give up! ${topic} needs more study time. Review the fundamentals and try again.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  evaluateAnswers
};
