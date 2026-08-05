// ═══════════════════════════════════════════════════════════════════════════
// MOMENTUM SCORE ENGINE - Centralized Intelligent Scoring System
// ═══════════════════════════════════════════════════════════════════════════

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserTasks } from './taskService';
import { getAssignedTasks } from './collaborativeTaskService';
import { getTodayAnalytics, getWeeklyAnalytics } from './extensionService';
import { getRecentStressAnalytics } from './stressDetectionService';
import { getMoodHistory } from './moodService';
import { getUserHabits } from './habitService';
import {
  computeMomentumScore,
  validateTodayAnalytics,
  validateDayAnalytics,
} from '../utils/productivityCalculator';

// ═══════════════════════════════════════════════════════════════════════════
// SCORING WEIGHTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SCORING_WEIGHTS = {
  // Task Completion (30% of total score)
  TASK_COMPLETION: {
    SELF_TASKS: 0.10,           // 10% - Personal tasks
    TEACHER_TASKS: 0.12,        // 12% - Teacher assignments (higher weight)
    PEER_TASKS: 0.08,           // 8% - Peer challenges
    COMPLETION_RATE_BONUS: 0.05 // 5% - High completion rate bonus
  },

  // Study Hours & Focus (25% of total score)
  STUDY_HOURS: {
    DAILY_HOURS: 0.12,          // 12% - Daily study time
    PRODUCTIVE_SITES: 0.08,     // 8% - Quality of study (productive sites)
    FOCUS_SESSIONS: 0.05        // 5% - Completed focus sessions
  },

  // Consistency & Streak (20% of total score)
  CONSISTENCY: {
    DAILY_STREAK: 0.10,         // 10% - Consecutive days
    WEEKLY_CONSISTENCY: 0.06,   // 6% - Days active per week
    HABIT_CONSISTENCY: 0.04     // 4% - Habit completion rate
  },

  // Productivity Quality (15% of total score)
  PRODUCTIVITY: {
    FOCUS_SCORE: 0.08,          // 8% - Study vs distraction ratio
    ON_TIME_COMPLETION: 0.04,   // 4% - Meeting deadlines
    PLANNER_USAGE: 0.03         // 3% - Using planner effectively
  },

  // Engagement & Growth (10% of total score)
  ENGAGEMENT: {
    AI_MENTOR_USAGE: 0.03,      // 3% - Learning engagement
    MOOD_TRACKING: 0.02,        // 2% - Wellness awareness
    PRODUCTIVITY_GROWTH: 0.05   // 5% - Week-over-week improvement
  },

  // Penalties (can reduce score)
  PENALTIES: {
    DISTRACTION_TIME: -0.08,    // -8% - Excessive distractions
    OVERDUE_TASKS: -0.05,       // -5% - Late submissions
    STRESS_BALANCE: -0.02       // -2% - Burnout indicator (small penalty)
  }
};

// Maximum possible score
const MAX_SCORE = 100;

// Productive website patterns
const PRODUCTIVE_SITES = [
  'leetcode', 'github', 'stackoverflow', 'geeksforgeeks', 'chatgpt', 'openai',
  'coursera', 'udemy', 'edx', 'khan', 'w3schools', 'mdn', 'docs', 'documentation',
  'tutorial', 'learn', 'education', 'study', 'academic'
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MOMENTUM CALCULATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate comprehensive momentum score for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Momentum score and breakdown
 */
export async function calculateMomentumScore(userId) {
  try {
    // Fetch all required data in parallel
    const [
      userDoc,
      selfTasks,
      assignedTasks,
      todayAnalytics,
      weeklyAnalytics,
      stressData,
      moodData,
      habits
    ] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getUserTasks(userId),
      getAssignedTasks(userId),
      getTodayAnalytics(userId),
      getWeeklyAnalytics(userId),
      getRecentStressAnalytics(userId, 7).catch(() => []),
      getMoodHistory(userId, 7).catch(() => []),
      getUserHabits(userId).catch(() => [])
    ]);

    const userData = userDoc.exists() ? userDoc.data() : {};

    // Calculate individual components
    const taskScore = calculateTaskScore(selfTasks, assignedTasks);
    const studyScore = calculateStudyScore(todayAnalytics, weeklyAnalytics);
    const consistencyScore = calculateConsistencyScore(weeklyAnalytics, habits, userData);
    const productivityScore = calculateProductivityQuality(todayAnalytics, weeklyAnalytics, selfTasks, assignedTasks, userData);
    const engagementScore = calculateEngagementScore(userData, moodData, weeklyAnalytics);
    const penalties = calculatePenalties(todayAnalytics, weeklyAnalytics, selfTasks, assignedTasks, stressData);

    // Calculate total score
    const totalScore = Math.max(0, Math.min(MAX_SCORE,
      taskScore +
      studyScore +
      consistencyScore +
      productivityScore +
      engagementScore +
      penalties
    ));

    // Create detailed breakdown
    const breakdown = {
      total: Math.round(totalScore),
      components: {
        tasks: Math.round(taskScore),
        study: Math.round(studyScore),
        consistency: Math.round(consistencyScore),
        productivity: Math.round(productivityScore),
        engagement: Math.round(engagementScore),
        penalties: Math.round(penalties)
      },
      details: {
        selfTasksCompleted: selfTasks.filter(t => t.completed).length,
        teacherTasksCompleted: assignedTasks.filter(t => t.completed && t.taskType === 'teacher_assigned').length,
        peerTasksCompleted: assignedTasks.filter(t => t.completed && t.taskType === 'peer_challenge').length,
        totalStudyHours: weeklyAnalytics.reduce((sum, day) => sum + (day.studyTime || 0), 0),
        currentStreak: userData.streak || 0,
        focusScore: calculateFocusScoreFromAnalytics(todayAnalytics),
        distractionTime: todayAnalytics?.totalDistractionTime || 0,
        overdueTasksCount: [...selfTasks, ...assignedTasks].filter(t => !t.completed && isOverdue(t)).length
      },
      lastCalculated: new Date().toISOString()
    };

    return breakdown;
  } catch (error) {
    console.error('Error calculating momentum score:', error);
    return {
      total: 0,
      components: {},
      details: {},
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate task completion score (30% of total)
 */
function calculateTaskScore(selfTasks, assignedTasks) {
  let score = 0;

  // Self tasks (10%)
  const selfCompleted = selfTasks.filter(t => t.completed).length;
  const selfTotal = selfTasks.length;
  if (selfTotal > 0) {
    score += (selfCompleted / selfTotal) * SCORING_WEIGHTS.TASK_COMPLETION.SELF_TASKS * MAX_SCORE;
  }

  // Teacher tasks (12%)
  const teacherTasks = assignedTasks.filter(t => t.taskType === 'teacher_assigned');
  const teacherCompleted = teacherTasks.filter(t => t.completed).length;
  if (teacherTasks.length > 0) {
    score += (teacherCompleted / teacherTasks.length) * SCORING_WEIGHTS.TASK_COMPLETION.TEACHER_TASKS * MAX_SCORE;
  }

  // Peer tasks (8%)
  const peerTasks = assignedTasks.filter(t => t.taskType === 'peer_challenge');
  const peerCompleted = peerTasks.filter(t => t.completed).length;
  if (peerTasks.length > 0) {
    score += (peerCompleted / peerTasks.length) * SCORING_WEIGHTS.TASK_COMPLETION.PEER_TASKS * MAX_SCORE;
  }

  // Completion rate bonus (5%)
  const allTasks = [...selfTasks, ...assignedTasks];
  const allCompleted = allTasks.filter(t => t.completed).length;
  const completionRate = allTasks.length > 0 ? allCompleted / allTasks.length : 0;
  if (completionRate >= 0.8) { // 80%+ completion rate
    score += SCORING_WEIGHTS.TASK_COMPLETION.COMPLETION_RATE_BONUS * MAX_SCORE;
  }

  return score;
}

/**
 * Calculate study hours & focus score (25% of total)
 */
function calculateStudyScore(todayAnalytics, weeklyAnalytics) {
  let score = 0;

  // Daily study hours (12%)
  const weeklyHours = weeklyAnalytics.reduce((sum, day) => sum + (day.studyTime || 0), 0);
  const avgDailyHours = weeklyHours / 7;
  const hoursScore = Math.min(1, avgDailyHours / 6); // 6 hours = 100%
  score += hoursScore * SCORING_WEIGHTS.STUDY_HOURS.DAILY_HOURS * MAX_SCORE;

  // Productive sites usage (8%)
  const productiveSiteScore = calculateProductiveSiteScore(weeklyAnalytics);
  score += productiveSiteScore * SCORING_WEIGHTS.STUDY_HOURS.PRODUCTIVE_SITES * MAX_SCORE;

  // Focus sessions (5%)
  // This would come from focus room data - for now use study consistency
  const focusSessionScore = weeklyAnalytics.filter(d => d.studyTime > 0).length / 7;
  score += focusSessionScore * SCORING_WEIGHTS.STUDY_HOURS.FOCUS_SESSIONS * MAX_SCORE;

  return score;
}

/**
 * Calculate consistency & streak score (20% of total)
 */
function calculateConsistencyScore(weeklyAnalytics, habits, userData) {
  let score = 0;

  // Daily streak (10%)
  const streak = userData.streak || 0;
  const streakScore = Math.min(1, streak / 30); // 30 days = 100%
  score += streakScore * SCORING_WEIGHTS.CONSISTENCY.DAILY_STREAK * MAX_SCORE;

  // Weekly consistency (6%)
  const daysActive = weeklyAnalytics.filter(d => d.studyTime > 0).length;
  const weeklyConsistency = daysActive / 7;
  score += weeklyConsistency * SCORING_WEIGHTS.CONSISTENCY.WEEKLY_CONSISTENCY * MAX_SCORE;

  // Habit consistency (4%)
  if (habits.length > 0) {
    const habitCompletionRate = habits.reduce((sum, h) => {
      const completedDays = h.completedDates?.length || 0;
      const totalDays = Math.max(1, Math.floor((new Date() - new Date(h.createdAt)) / (1000 * 60 * 60 * 24)));
      return sum + (completedDays / totalDays);
    }, 0) / habits.length;
    score += habitCompletionRate * SCORING_WEIGHTS.CONSISTENCY.HABIT_CONSISTENCY * MAX_SCORE;
  }

  return score;
}

/**
 * Calculate productivity quality score (15% of total)
 */
function calculateProductivityQuality(todayAnalytics, weeklyAnalytics, selfTasks, assignedTasks, userData = {}) {
  let score = 0;

  // Focus score (8%)
  const focusScore = calculateFocusScoreFromAnalytics(todayAnalytics);
  score += (focusScore / 100) * SCORING_WEIGHTS.PRODUCTIVITY.FOCUS_SCORE * MAX_SCORE;

  // On-time completion (4%)
  const allTasks = [...selfTasks, ...assignedTasks].filter(t => t.completed);
  const onTimeTasks = allTasks.filter(t => !isCompletedLate(t));
  const onTimeRate = allTasks.length > 0 ? onTimeTasks.length / allTasks.length : 0;
  score += onTimeRate * SCORING_WEIGHTS.PRODUCTIVITY.ON_TIME_COMPLETION * MAX_SCORE;

  // Planner usage (3%) — only award if user has recent planner activity
  const lastPlannerUse = userData?.lastPlannerUse
    ? new Date(userData.lastPlannerUse)
    : null;
  const hasRecentPlanning = lastPlannerUse
    ? (Date.now() - lastPlannerUse.getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;
  if (hasRecentPlanning) {
    score += SCORING_WEIGHTS.PRODUCTIVITY.PLANNER_USAGE * MAX_SCORE;
  }

  return score;
}

/**
 * Calculate engagement & growth score (10% of total)
 */
function calculateEngagementScore(userData, moodData, weeklyAnalytics) {
  let score = 0;

  // AI Mentor usage (3%)
  // Would check AI mentor conversation count
  const hasAIMentorActivity = userData.lastAIMentorUse ?
    (new Date() - new Date(userData.lastAIMentorUse)) < 7 * 24 * 60 * 60 * 1000 : false;
  if (hasAIMentorActivity) {
    score += SCORING_WEIGHTS.ENGAGEMENT.AI_MENTOR_USAGE * MAX_SCORE;
  }

  // Mood tracking (2%)
  if (moodData.length >= 3) { // Tracked mood at least 3 times this week
    score += SCORING_WEIGHTS.ENGAGEMENT.MOOD_TRACKING * MAX_SCORE;
  }

  // Productivity growth (5%)
  if (weeklyAnalytics.length >= 7) {
    const firstHalf = weeklyAnalytics.slice(0, 3).reduce((sum, d) => sum + (d.studyTime || 0), 0) / 3;
    const secondHalf = weeklyAnalytics.slice(4, 7).reduce((sum, d) => sum + (d.studyTime || 0), 0) / 3;
    if (secondHalf > firstHalf) {
      const growthRate = Math.min(1, (secondHalf - firstHalf) / Math.max(1, firstHalf));
      score += growthRate * SCORING_WEIGHTS.ENGAGEMENT.PRODUCTIVITY_GROWTH * MAX_SCORE;
    }
  }

  return score;
}

/**
 * Calculate penalties (can reduce score)
 */
function calculatePenalties(todayAnalytics, weeklyAnalytics, selfTasks, assignedTasks, stressData) {
  let penalty = 0;

  // Distraction time penalty (-8%)
  const totalStudyTime = weeklyAnalytics.reduce((sum, d) => sum + (d.studyTime || 0), 0) * 3600;
  const totalDistractionTime = weeklyAnalytics.reduce((sum, d) => sum + (d.distractionTime || 0), 0) * 3600;
  if (totalStudyTime > 0) {
    const distractionRatio = totalDistractionTime / (totalStudyTime + totalDistractionTime);
    if (distractionRatio > 0.3) { // More than 30% distraction
      penalty += (distractionRatio - 0.3) * SCORING_WEIGHTS.PENALTIES.DISTRACTION_TIME * MAX_SCORE;
    }
  }

  // Overdue tasks penalty (-5%)
  const allTasks = [...selfTasks, ...assignedTasks];
  const overdueTasks = allTasks.filter(t => !t.completed && isOverdue(t));
  if (allTasks.length > 0) {
    const overdueRate = overdueTasks.length / allTasks.length;
    penalty += overdueRate * SCORING_WEIGHTS.PENALTIES.OVERDUE_TASKS * MAX_SCORE;
  }

  // Stress balance penalty (-2%) - SMALL penalty only
  if (stressData.length > 0) {
    const avgStress = stressData.reduce((sum, s) => sum + (s.stressScore || 0), 0) / stressData.length;
    if (avgStress > 80) { // Only penalize very high stress
      const stressPenalty = ((avgStress - 80) / 20) * SCORING_WEIGHTS.PENALTIES.STRESS_BALANCE * MAX_SCORE;
      penalty += stressPenalty;
    }
  }

  return penalty;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate focus score from analytics
 */
function calculateFocusScoreFromAnalytics(analytics) {
  if (!analytics) return 0;
  const studyTime = analytics.totalStudyTime || 0;
  const distractionTime = analytics.totalDistractionTime || 0;
  const total = studyTime + distractionTime;
  if (total === 0) return 0;
  return Math.round((studyTime / total) * 100);
}

/**
 * Calculate productive site usage score from actual weekly analytics.
 * Uses the ratio of study time to total tracked time across the week.
 * Returns 0–1 (never hardcoded).
 */
function calculateProductiveSiteScore(weeklyAnalytics) {
  if (!Array.isArray(weeklyAnalytics) || weeklyAnalytics.length === 0) return 0;
  const totalStudy = weeklyAnalytics.reduce((s, d) => s + (d.studyTime || 0), 0);
  const totalDist = weeklyAnalytics.reduce((s, d) => s + (d.distractionTime || 0), 0);
  const total = totalStudy + totalDist;
  if (total === 0) return 0;
  return Math.min(1, totalStudy / total);
}

/**
 * Check if task is overdue
 */
function isOverdue(task) {
  if (!task.dueDate) return false;
  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  return dueDate < new Date();
}

/**
 * Check if task was completed late
 */
function isCompletedLate(task) {
  if (!task.dueDate || !task.completedAt) return false;
  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  const completedDate = task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt);
  return completedDate > dueDate;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE MOMENTUM SCORE IN FIRESTORE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update user's momentum score in Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated score breakdown
 */
export async function updateUserMomentumScore(userId) {
  try {
    const scoreBreakdown = await calculateMomentumScore(userId);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      momentumScore: scoreBreakdown.total,
      momentumBreakdown: scoreBreakdown.components,
      momentumDetails: scoreBreakdown.details,
      lastMomentumUpdate: serverTimestamp()
    });

    return scoreBreakdown;
  } catch (error) {
    console.error('Error updating momentum score:', error);
    throw error;
  }
}

/**
 * Get cached momentum score or calculate if stale
 * @param {string} userId - User ID
 * @param {number} maxAgeMinutes - Maximum age of cached score in minutes
 * @returns {Promise<Object>} - Momentum score breakdown
 */
export async function getMomentumScore(userId, maxAgeMinutes = 60) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return { total: 0, components: {}, details: {} };
    }

    const userData = userDoc.data();
    const lastUpdate = userData.lastMomentumUpdate?.toDate();

    // Check if cache is still valid
    if (lastUpdate) {
      const ageMinutes = (new Date() - lastUpdate) / (1000 * 60);
      if (ageMinutes < maxAgeMinutes) {
        // Return cached score
        return {
          total: userData.momentumScore || 0,
          components: userData.momentumBreakdown || {},
          details: userData.momentumDetails || {},
          cached: true
        };
      }
    }

    // Calculate fresh score
    return await updateUserMomentumScore(userId);
  } catch (error) {
    console.error('Error getting momentum score:', error);
    return { total: 0, components: {}, details: {}, error: error.message };
  }
}

/**
 * Trigger momentum score recalculation
 * Call this after significant events (task completion, study session, etc.)
 * @param {string} userId - User ID
 */
export async function triggerMomentumUpdate(userId) {
  try {
    // Update in background without waiting
    updateUserMomentumScore(userId).catch(err =>
      console.error('Background momentum update failed:', err)
    );
  } catch (error) {
    console.error('Error triggering momentum update:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  calculateMomentumScore,
  updateUserMomentumScore,
  getMomentumScore,
  triggerMomentumUpdate,
  SCORING_WEIGHTS,
  MAX_SCORE
};
