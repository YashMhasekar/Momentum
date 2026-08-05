import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Backend API endpoint
const STRESS_ANALYSIS_API = 'http://127.0.0.1:8000/analyze-stress';

// ═══════════════════════════════════════════════════════════════════════════
// LLM-POWERED STRESS ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze stress using LLM (Groq API with llama-3.3-70b-versatile)
 * @param {string} message - The message to analyze
 * @param {string} userId - User ID
 * @param {Array} conversationHistory - Recent conversation history
 * @returns {Object} - Comprehensive stress analysis
 */
export async function analyzeStressWithLLM(message, userId = null, conversationHistory = []) {
  try {
    const response = await fetch(STRESS_ANALYSIS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.analysis) {
      return {
        success: true,
        ...data.analysis
      };
    } else {
      // Fallback to basic analysis
      return await analyzeStressBasic(message);
    }
  } catch (error) {
    console.error('Error calling LLM stress analysis:', error);
    // Fallback to basic keyword-based analysis
    return await analyzeStressBasic(message);
  }
}

/**
 * Basic fallback stress analysis (keyword-based)
 * Used when LLM is unavailable
 */
async function analyzeStressBasic(message) {
  const keywords = extractKeywords(message);
  const stressScore = calculateStressScore(keywords, []);
  const stressLevel = getStressLevel(stressScore);
  const sentiment = analyzeSentiment(message);
  
  return {
    success: true,
    stressScore,
    stressLevel,
    moodScore: sentiment === 'positive' ? 75 : sentiment === 'negative' ? 25 : 50,
    sentiment,
    keywords: keywords.stress.map(k => k.keyword).concat(keywords.positive).slice(0, 10),
    topics: keywords.topics,
    behavioralIndicators: keywords.behavioral.map(b => b.keyword),
    recommendations: getWellnessRecommendations(stressScore, keywords),
    detailedAnalysis: `Basic analysis detected ${stressLevel} stress level based on keyword patterns.`,
    urgencyLevel: stressScore >= 80 ? 'critical' : stressScore >= 60 ? 'high' : stressScore >= 30 ? 'medium' : 'low',
    supportiveMessage: getSupportiveMessage(stressLevel),
    originalMessage: message,
    fallbackMode: true
  };
}

function getSupportiveMessage(stressLevel) {
  const messages = {
    healthy: "You're doing great! Keep up the positive momentum.",
    mild_stress: "I notice some stress. Remember to take breaks and stay balanced.",
    high_stress: "You seem to be under significant stress. Please prioritize self-care.",
    burnout_risk: "I'm concerned about your stress levels. Consider reaching out for support."
  };
  return messages[stressLevel] || messages.mild_stress;
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD DICTIONARIES
// ═══════════════════════════════════════════════════════════════════════════

// Stress-related keywords (weighted by severity)
const STRESS_KEYWORDS = {
  critical: ['burnout', 'exhausted', 'overwhelmed', 'breaking down', 'cant take it', 'giving up', 'too much'],
  high: ['stressed', 'anxious', 'worried', 'panic', 'pressure', 'deadline', 'struggling', 'difficult'],
  medium: ['tired', 'busy', 'hectic', 'challenging', 'tough', 'hard', 'confused'],
  low: ['concerned', 'unsure', 'uncertain', 'wondering']
};

// Positive keywords (reduce stress score)
const POSITIVE_KEYWORDS = [
  'happy', 'excited', 'confident', 'motivated', 'energized', 'focused',
  'productive', 'accomplished', 'successful', 'good', 'great', 'excellent',
  'enjoying', 'love', 'fun', 'easy', 'clear', 'understood'
];

// Academic topic keywords
const ACADEMIC_TOPICS = {
  coding: ['code', 'coding', 'programming', 'algorithm', 'dsa', 'leetcode', 'java', 'python', 'javascript'],
  database: ['database', 'sql', 'dbms', 'query', 'normalization', 'joins'],
  systems: ['operating system', 'os', 'cpu', 'scheduling', 'memory', 'process'],
  networks: ['network', 'tcp', 'ip', 'http', 'dns', 'routing', 'protocol'],
  exams: ['exam', 'test', 'quiz', 'midterm', 'final', 'assessment'],
  assignments: ['assignment', 'homework', 'project', 'submission', 'deadline'],
  placements: ['placement', 'interview', 'job', 'company', 'aptitude', 'resume'],
  general: ['study', 'learn', 'revision', 'practice', 'preparation']
};

// Behavioral keywords
const BEHAVIORAL_KEYWORDS = {
  focus: ['focus', 'concentrate', 'attention', 'distracted', 'procrastinate'],
  sleep: ['sleep', 'tired', 'sleepy', 'rest', 'exhausted', 'awake'],
  motivation: ['motivated', 'motivation', 'inspired', 'demotivated', 'lazy'],
  time: ['time', 'schedule', 'deadline', 'late', 'rush', 'hurry']
};

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract keywords from text using regex and dictionary matching
 * @param {string} text - The text to analyze
 * @returns {Object} - Extracted keywords by category
 */
export function extractKeywords(text) {
  if (!text) return { stress: [], positive: [], topics: [], behavioral: [] };

  const lowerText = text.toLowerCase();
  const extracted = {
    stress: [],
    positive: [],
    topics: [],
    behavioral: [],
    stressLevel: 'low'
  };

  // Extract stress keywords
  let maxStressLevel = 'low';
  Object.entries(STRESS_KEYWORDS).forEach(([level, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        extracted.stress.push({ keyword, level });
        if (level === 'critical') maxStressLevel = 'critical';
        else if (level === 'high' && maxStressLevel !== 'critical') maxStressLevel = 'high';
        else if (level === 'medium' && maxStressLevel === 'low') maxStressLevel = 'medium';
      }
    });
  });
  extracted.stressLevel = maxStressLevel;

  // Extract positive keywords
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      extracted.positive.push(keyword);
    }
  });

  // Extract academic topics
  Object.entries(ACADEMIC_TOPICS).forEach(([topic, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        if (!extracted.topics.includes(topic)) {
          extracted.topics.push(topic);
        }
      }
    });
  });

  // Extract behavioral keywords
  Object.entries(BEHAVIORAL_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        extracted.behavioral.push({ keyword, category });
      }
    });
  });

  return extracted;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRESS SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate stress score (0-100) based on keywords and patterns
 * @param {Object} keywords - Extracted keywords
 * @param {Array} recentHistory - Recent chat history for pattern analysis
 * @returns {number} - Stress score (0-100)
 */
export function calculateStressScore(keywords, recentHistory = []) {
  let score = 0;

  // Base score from stress keywords
  keywords.stress.forEach(({ level }) => {
    switch (level) {
      case 'critical': score += 25; break;
      case 'high': score += 15; break;
      case 'medium': score += 8; break;
      case 'low': score += 3; break;
    }
  });

  // Reduce score for positive keywords
  score -= keywords.positive.length * 5;

  // Analyze recent history for patterns
  if (recentHistory.length > 0) {
    const recentStressCount = recentHistory.filter(msg => 
      msg.stressLevel && ['high', 'critical'].includes(msg.stressLevel)
    ).length;

    // Increase score if consistent stress pattern
    if (recentStressCount > 3) {
      score += 15;
    } else if (recentStressCount > 1) {
      score += 8;
    }
  }

  // Behavioral factors
  const hasFocusIssues = keywords.behavioral.some(b => b.category === 'focus');
  const hasSleepIssues = keywords.behavioral.some(b => b.category === 'sleep');
  
  if (hasFocusIssues) score += 5;
  if (hasSleepIssues) score += 5;

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

/**
 * Get stress level category from score
 * @param {number} score - Stress score (0-100)
 * @returns {string} - Stress level category
 */
export function getStressLevel(score) {
  if (score >= 81) return 'critical';
  if (score >= 61) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

/**
 * Get stress level display info
 * @param {string} level - Stress level
 * @returns {Object} - Display information
 */
export function getStressLevelInfo(level) {
  const info = {
    low: {
      label: 'Healthy',
      color: '#10b981',
      bgColor: '#d1fae5',
      emoji: '😊',
      description: 'You\'re doing great! Keep up the good work.'
    },
    medium: {
      label: 'Mild Stress',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      emoji: '😐',
      description: 'Some stress detected. Consider taking breaks.'
    },
    high: {
      label: 'High Stress',
      color: '#ef4444',
      bgColor: '#fee2e2',
      emoji: '😞',
      description: 'High stress levels. Please prioritize self-care.'
    },
    critical: {
      label: 'Burnout Risk',
      color: '#dc2626',
      bgColor: '#fecaca',
      emoji: '😣',
      description: 'Critical stress levels. Consider reaching out for support.'
    }
  };

  return info[level] || info.low;
}

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze sentiment of text (positive, neutral, negative)
 * @param {string} text - Text to analyze
 * @returns {string} - Sentiment category
 */
export function analyzeSentiment(text) {
  if (!text) return 'neutral';

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  // Count positive keywords
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  // Count negative/stress keywords
  Object.values(STRESS_KEYWORDS).flat().forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC CATEGORIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Categorize the main topic of conversation
 * @param {Array} topics - Extracted topics
 * @param {Object} keywords - All extracted keywords
 * @returns {string} - Primary topic category
 */
export function categorizeTopics(topics, keywords) {
  if (topics.length === 0) {
    // Fallback categorization based on keywords
    if (keywords.stress.length > 0) return 'stress';
    if (keywords.behavioral.length > 0) return 'behavioral';
    return 'general';
  }

  // Return most relevant topic
  if (topics.includes('exams')) return 'exams';
  if (topics.includes('placements')) return 'placements';
  if (topics.includes('assignments')) return 'assignments';
  if (topics.includes('coding')) return 'coding';
  
  return topics[0] || 'general';
}

// ═══════════════════════════════════════════════════════════════════════════
// WELLNESS RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get wellness recommendations based on stress score
 * @param {number} stressScore - Stress score (0-100)
 * @param {Object} keywords - Extracted keywords
 * @returns {Array} - Array of recommendations
 */
export function getWellnessRecommendations(stressScore, keywords = {}) {
  const recommendations = [];

  if (stressScore >= 61) {
    recommendations.push({
      type: 'urgent',
      title: 'Take a Break',
      description: 'High stress detected. Take a 15-minute break to relax and recharge.',
      icon: '🧘'
    });
    recommendations.push({
      type: 'support',
      title: 'Reach Out',
      description: 'Consider talking to a friend, family member, or counselor.',
      icon: '💬'
    });
  }

  if (stressScore >= 31) {
    recommendations.push({
      type: 'activity',
      title: 'Physical Activity',
      description: 'A short walk or light exercise can help reduce stress.',
      icon: '🚶'
    });
    recommendations.push({
      type: 'organization',
      title: 'Organize Tasks',
      description: 'Break down large tasks into smaller, manageable steps.',
      icon: '📋'
    });
  }

  // Behavioral-specific recommendations
  const hasFocusIssues = keywords.behavioral?.some(b => b.category === 'focus');
  const hasSleepIssues = keywords.behavioral?.some(b => b.category === 'sleep');

  if (hasFocusIssues) {
    recommendations.push({
      type: 'focus',
      title: 'Focus Techniques',
      description: 'Try the Pomodoro technique: 25 minutes work, 5 minutes break.',
      icon: '⏱️'
    });
  }

  if (hasSleepIssues) {
    recommendations.push({
      type: 'sleep',
      title: 'Prioritize Sleep',
      description: 'Aim for 7-8 hours of sleep. Good rest improves focus and productivity.',
      icon: '😴'
    });
  }

  // Always include positive reinforcement
  if (stressScore < 31) {
    recommendations.push({
      type: 'positive',
      title: 'Keep It Up!',
      description: 'You\'re managing stress well. Maintain your healthy habits.',
      icon: '🌟'
    });
  }

  return recommendations;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save stress analytics to Firestore (Enhanced for LLM data)
 * @param {string} userId - User ID
 * @param {Object} analyticsData - Analytics data from LLM or basic analysis
 */
export async function saveStressAnalytics(userId, analyticsData) {
  try {
    const analyticsRef = collection(db, 'stressAnalytics');
    
    // Prepare data for Firestore
    const firestoreData = {
      userId,
      stressScore: analyticsData.stressScore || 50,
      stressLevel: analyticsData.stressLevel || 'mild_stress',
      moodScore: analyticsData.moodScore || 50,
      sentiment: analyticsData.sentiment || 'neutral',
      keywords: analyticsData.keywords || [],
      topics: analyticsData.topics || [],
      behavioralIndicators: analyticsData.behavioralIndicators || [],
      recommendations: analyticsData.recommendations || [],
      detailedAnalysis: analyticsData.detailedAnalysis || '',
      urgencyLevel: analyticsData.urgencyLevel || 'low',
      supportiveMessage: analyticsData.supportiveMessage || '',
      originalMessage: analyticsData.originalMessage || '',
      analysisMethod: analyticsData.fallbackMode ? 'keyword-based' : 'llm-powered',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(analyticsRef, firestoreData);
    
    return {
      id: docRef.id,
      ...firestoreData
    };
  } catch (error) {
    console.error('Error saving stress analytics:', error);
    throw error;
  }
}

/**
 * Get recent stress analytics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default: 7)
 * @returns {Array} - Array of stress analytics
 */
export async function getRecentStressAnalytics(userId, days = 7) {
  try {
    const analyticsRef = collection(db, 'stressAnalytics');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const analytics = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      analytics.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
        createdAt: data.createdAt?.toDate()
      });
    });

    return analytics;
  } catch (error) {
    console.error('Error fetching stress analytics:', error);
    return [];
  }
}

/**
 * Calculate average stress score over a period
 * @param {Array} analytics - Array of stress analytics
 * @returns {number} - Average stress score
 */
export function calculateAverageStressScore(analytics) {
  if (analytics.length === 0) return 0;
  
  const sum = analytics.reduce((acc, item) => acc + (item.stressScore || 0), 0);
  return Math.round(sum / analytics.length);
}

/**
 * Get stress trend (increasing, decreasing, stable)
 * @param {Array} analytics - Array of stress analytics (ordered by time)
 * @returns {string} - Trend direction
 */
export function getStressTrend(analytics) {
  if (analytics.length < 3) return 'insufficient_data';

  const recent = analytics.slice(0, 3);
  const older = analytics.slice(3, 6);

  if (older.length === 0) return 'insufficient_data';

  const recentAvg = recent.reduce((acc, item) => acc + item.stressScore, 0) / recent.length;
  const olderAvg = older.reduce((acc, item) => acc + item.stressScore, 0) / older.length;

  const difference = recentAvg - olderAvg;

  if (difference > 10) return 'increasing';
  if (difference < -10) return 'decreasing';
  return 'stable';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  analyzeStressWithLLM,
  extractKeywords,
  calculateStressScore,
  getStressLevel,
  getStressLevelInfo,
  analyzeSentiment,
  categorizeTopics,
  getWellnessRecommendations,
  saveStressAnalytics,
  getRecentStressAnalytics,
  calculateAverageStressScore,
  getStressTrend
};
