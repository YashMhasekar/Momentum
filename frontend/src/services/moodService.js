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
import { triggerMomentumUpdate } from './momentumScoreEngine';

// ═══════════════════════════════════════════════════════════════════════════
// MOOD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const MOOD_LEVELS = {
  5: {
    id: 5,
    label: 'Focused & Energized',
    emoji: '😊',
    color: '#10b981',
    bgColor: '#d1fae5',
    description: 'Feeling great and highly productive',
    score: 100
  },
  4: {
    id: 4,
    label: 'Good & Productive',
    emoji: '🙂',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Feeling good and getting things done',
    score: 75
  },
  3: {
    id: 3,
    label: 'Neutral',
    emoji: '😐',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    description: 'Feeling okay, neither good nor bad',
    score: 50
  },
  2: {
    id: 2,
    label: 'Stressed & Tired',
    emoji: '😞',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Feeling stressed and low energy',
    score: 25
  },
  1: {
    id: 1,
    label: 'Burned Out',
    emoji: '😣',
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Feeling exhausted and overwhelmed',
    score: 0
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MOOD TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save mood entry to Firestore
 * @param {string} userId - User ID
 * @param {number} mood - Mood level (1-5)
 * @param {string} notes - Optional notes
 * @param {string} context - Context (e.g., 'morning', 'after_study', 'before_exam')
 * @returns {Object} - Created mood entry
 */
export async function saveMood(userId, mood, notes = '', context = '') {
  try {
    const moodRef = collection(db, 'moodTracking');
    const moodData = {
      userId,
      mood,
      moodLabel: MOOD_LEVELS[mood]?.label || 'Unknown',
      moodScore: MOOD_LEVELS[mood]?.score || 50,
      notes,
      context,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };

    const docRef = await addDoc(moodRef, moodData);
    
    // Trigger momentum score recalculation
    await triggerMomentumUpdate(userId);
    
    return { id: docRef.id, ...moodData };
  } catch (error) {
    console.error('Error saving mood:', error);
    throw error;
  }
}

/**
 * Get mood history for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default: 30)
 * @returns {Array} - Array of mood entries
 */
export async function getMoodHistory(userId, days = 30) {
  try {
    const moodRef = collection(db, 'moodTracking');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      moodRef,
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const moods = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      moods.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
        createdAt: data.createdAt?.toDate()
      });
    });

    return moods;
  } catch (error) {
    console.error('Error fetching mood history:', error);
    return [];
  }
}

/**
 * Get today's mood entry
 * @param {string} userId - User ID
 * @returns {Object|null} - Today's mood entry or null
 */
export async function getTodayMood(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const moodRef = collection(db, 'moodTracking');

    const q = query(
      moodRef,
      where('userId', '==', userId),
      where('date', '==', today),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate(),
      createdAt: data.createdAt?.toDate()
    };
  } catch (error) {
    console.error('Error fetching today mood:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOOD ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate mood trends over time
 * @param {Array} moodHistory - Array of mood entries
 * @returns {Object} - Mood trend analysis
 */
export function calculateMoodTrends(moodHistory) {
  if (moodHistory.length === 0) {
    return {
      averageMood: 0,
      averageScore: 0,
      trend: 'insufficient_data',
      moodDistribution: {},
      bestDay: null,
      worstDay: null
    };
  }

  // Calculate average mood
  const totalMood = moodHistory.reduce((sum, entry) => sum + entry.mood, 0);
  const averageMood = totalMood / moodHistory.length;

  // Calculate average score
  const totalScore = moodHistory.reduce((sum, entry) => sum + (entry.moodScore || 50), 0);
  const averageScore = totalScore / moodHistory.length;

  // Mood distribution
  const moodDistribution = {};
  moodHistory.forEach(entry => {
    const mood = entry.mood;
    moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
  });

  // Find best and worst days
  const sortedByMood = [...moodHistory].sort((a, b) => b.mood - a.mood);
  const bestDay = sortedByMood[0];
  const worstDay = sortedByMood[sortedByMood.length - 1];

  // Calculate trend
  let trend = 'stable';
  if (moodHistory.length >= 7) {
    const recentWeek = moodHistory.slice(0, 7);
    const olderWeek = moodHistory.slice(7, 14);

    if (olderWeek.length > 0) {
      const recentAvg = recentWeek.reduce((sum, e) => sum + e.mood, 0) / recentWeek.length;
      const olderAvg = olderWeek.reduce((sum, e) => sum + e.mood, 0) / olderWeek.length;

      if (recentAvg > olderAvg + 0.5) trend = 'improving';
      else if (recentAvg < olderAvg - 0.5) trend = 'declining';
    }
  }

  return {
    averageMood: Math.round(averageMood * 10) / 10,
    averageScore: Math.round(averageScore),
    trend,
    moodDistribution,
    bestDay,
    worstDay,
    totalEntries: moodHistory.length
  };
}

/**
 * Get mood trend display info
 * @param {string} trend - Trend direction
 * @returns {Object} - Display information
 */
export function getMoodTrendInfo(trend) {
  const info = {
    improving: {
      label: 'Improving',
      color: '#10b981',
      icon: '📈',
      description: 'Your mood has been improving recently'
    },
    stable: {
      label: 'Stable',
      color: '#3b82f6',
      icon: '➡️',
      description: 'Your mood has been consistent'
    },
    declining: {
      label: 'Declining',
      color: '#ef4444',
      icon: '📉',
      description: 'Your mood has been declining recently'
    },
    insufficient_data: {
      label: 'Insufficient Data',
      color: '#6b7280',
      icon: '❓',
      description: 'Not enough data to determine trend'
    }
  };

  return info[trend] || info.insufficient_data;
}

/**
 * Get weekly mood summary
 * @param {Array} moodHistory - Array of mood entries
 * @returns {Array} - Array of daily mood averages for the week
 */
export function getWeeklyMoodSummary(moodHistory) {
  const weekData = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayMoods = moodHistory.filter(entry => entry.date === dateStr);
    
    if (dayMoods.length > 0) {
      const avgMood = dayMoods.reduce((sum, e) => sum + e.mood, 0) / dayMoods.length;
      const avgScore = dayMoods.reduce((sum, e) => sum + (e.moodScore || 50), 0) / dayMoods.length;
      
      weekData.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        mood: Math.round(avgMood * 10) / 10,
        score: Math.round(avgScore),
        count: dayMoods.length
      });
    } else {
      weekData.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        mood: null,
        score: null,
        count: 0
      });
    }
  }

  return weekData;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOOD-PRODUCTIVITY CORRELATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Correlate mood with productivity metrics
 * @param {string} userId - User ID
 * @param {Array} moodHistory - Mood history
 * @param {Array} productivityData - Productivity metrics
 * @returns {Object} - Correlation analysis
 */
export async function correlateMoodProductivity(userId, moodHistory, productivityData) {
  try {
    const correlations = [];

    // Group by date
    const moodByDate = {};
    moodHistory.forEach(entry => {
      if (!moodByDate[entry.date]) {
        moodByDate[entry.date] = [];
      }
      moodByDate[entry.date].push(entry);
    });

    const productivityByDate = {};
    productivityData.forEach(entry => {
      const date = entry.date || entry.timestamp?.toISOString().split('T')[0];
      if (!productivityByDate[date]) {
        productivityByDate[date] = [];
      }
      productivityByDate[date].push(entry);
    });

    // Calculate correlations
    Object.keys(moodByDate).forEach(date => {
      if (productivityByDate[date]) {
        const avgMood = moodByDate[date].reduce((sum, e) => sum + e.mood, 0) / moodByDate[date].length;
        const productivity = productivityByDate[date];

        correlations.push({
          date,
          mood: avgMood,
          tasksCompleted: productivity.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0),
          studyHours: productivity.reduce((sum, p) => sum + (p.studyHours || 0), 0),
          focusScore: productivity.reduce((sum, p) => sum + (p.focusScore || 0), 0) / productivity.length
        });
      }
    });

    // Calculate correlation coefficient (simplified)
    let correlation = 'neutral';
    if (correlations.length >= 5) {
      const avgMood = correlations.reduce((sum, c) => sum + c.mood, 0) / correlations.length;
      const avgTasks = correlations.reduce((sum, c) => sum + c.tasksCompleted, 0) / correlations.length;

      const highMoodDays = correlations.filter(c => c.mood > avgMood);
      const highMoodAvgTasks = highMoodDays.reduce((sum, c) => sum + c.tasksCompleted, 0) / highMoodDays.length;

      if (highMoodAvgTasks > avgTasks * 1.2) correlation = 'positive';
      else if (highMoodAvgTasks < avgTasks * 0.8) correlation = 'negative';
    }

    return {
      correlation,
      dataPoints: correlations,
      insight: getCorrelationInsight(correlation)
    };
  } catch (error) {
    console.error('Error correlating mood and productivity:', error);
    return { correlation: 'unknown', dataPoints: [], insight: '' };
  }
}

/**
 * Get correlation insight message
 * @param {string} correlation - Correlation type
 * @returns {string} - Insight message
 */
function getCorrelationInsight(correlation) {
  const insights = {
    positive: 'Your productivity tends to be higher when your mood is better. Focus on maintaining positive mood!',
    negative: 'Interestingly, you seem productive even during low mood periods. Great resilience!',
    neutral: 'Your productivity appears independent of mood. You maintain consistency regardless of how you feel!',
    unknown: 'Not enough data to determine mood-productivity correlation yet.'
  };

  return insights[correlation] || insights.unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOOD INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate mood insights and recommendations
 * @param {Object} trends - Mood trends
 * @param {Array} moodHistory - Mood history
 * @returns {Array} - Array of insights
 */
export function generateMoodInsights(trends, moodHistory) {
  const insights = [];

  // Trend-based insights
  if (trends.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Mood Improving!',
      message: 'Your mood has been getting better. Keep up whatever you\'re doing!',
      icon: '🌟'
    });
  } else if (trends.trend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Mood Declining',
      message: 'Your mood has been declining. Consider taking breaks and practicing self-care.',
      icon: '⚠️'
    });
  }

  // Average mood insights
  if (trends.averageMood >= 4) {
    insights.push({
      type: 'success',
      title: 'Great Mood!',
      message: `Your average mood is ${trends.averageMood.toFixed(1)}/5. You're doing excellent!`,
      icon: '😊'
    });
  } else if (trends.averageMood <= 2) {
    insights.push({
      type: 'concern',
      title: 'Low Mood Average',
      message: `Your average mood is ${trends.averageMood.toFixed(1)}/5. Consider reaching out for support.`,
      icon: '💙'
    });
  }

  // Consistency insights
  if (moodHistory.length >= 7) {
    const recentWeek = moodHistory.slice(0, 7);
    const variance = calculateVariance(recentWeek.map(m => m.mood));

    if (variance < 0.5) {
      insights.push({
        type: 'info',
        title: 'Consistent Mood',
        message: 'Your mood has been very consistent this week.',
        icon: '📊'
      });
    } else if (variance > 2) {
      insights.push({
        type: 'info',
        title: 'Mood Fluctuations',
        message: 'Your mood has been fluctuating. Try to identify patterns and triggers.',
        icon: '🎢'
      });
    }
  }

  // Tracking consistency
  if (moodHistory.length >= 20) {
    insights.push({
      type: 'achievement',
      title: 'Tracking Streak!',
      message: `You've logged ${moodHistory.length} mood entries. Great self-awareness!`,
      icon: '🔥'
    });
  }

  return insights;
}

/**
 * Calculate variance of an array
 * @param {Array} values - Array of numbers
 * @returns {number} - Variance
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  MOOD_LEVELS,
  saveMood,
  getMoodHistory,
  getTodayMood,
  calculateMoodTrends,
  getMoodTrendInfo,
  getWeeklyMoodSummary,
  correlateMoodProductivity,
  generateMoodInsights
};
