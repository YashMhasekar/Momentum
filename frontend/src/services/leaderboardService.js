// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD SERVICE - Real-time Rankings & Analytics
// ═══════════════════════════════════════════════════════════════════════════

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getMomentumScore } from './momentumScoreEngine';
import { getTodayAnalytics, getWeeklyAnalytics } from './extensionService';
import { getUserTasks } from './taskService';
import { getAssignedTasks } from './collaborativeTaskService';

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT BADGES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_BADGES = {
  FOCUS_MASTER: {
    id: 'focus_master',
    name: 'Focus Master',
    emoji: '🔥',
    color: '#ef4444',
    description: 'Completed 50+ focus sessions',
    requirement: (data) => data.focusSessions >= 50
  },
  STUDY_WARRIOR: {
    id: 'study_warrior',
    name: 'Study Warrior',
    emoji: '📚',
    color: '#3b82f6',
    description: 'Studied 100+ hours',
    requirement: (data) => data.totalStudyHours >= 100
  },
  PRODUCTIVITY_BEAST: {
    id: 'productivity_beast',
    name: 'Productivity Beast',
    emoji: '⚡',
    color: '#f59e0b',
    description: 'Momentum score above 80',
    requirement: (data) => data.momentumScore >= 80
  },
  CONSISTENCY_KING: {
    id: 'consistency_king',
    name: 'Consistency King',
    emoji: '🧠',
    color: '#8b5cf6',
    description: 'Maintained 30+ day streak',
    requirement: (data) => data.streak >= 30
  },
  MOMENTUM_RISING: {
    id: 'momentum_rising',
    name: 'Momentum Rising',
    emoji: '🚀',
    color: '#10b981',
    description: 'Improved momentum by 20+ points',
    requirement: (data) => data.momentumGrowth >= 20
  },
  TASK_FINISHER: {
    id: 'task_finisher',
    name: 'Task Finisher',
    emoji: '🎯',
    color: '#06b6d4',
    description: 'Completed 100+ tasks',
    requirement: (data) => data.completedTasks >= 100
  },
  DISTRACTION_FREE: {
    id: 'distraction_free',
    name: 'Distraction Free',
    emoji: '🎖️',
    color: '#14b8a6',
    description: 'Less than 10% distraction time',
    requirement: (data) => data.distractionRatio < 0.1
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    emoji: '🌅',
    color: '#f97316',
    description: 'Studies before 8 AM regularly',
    requirement: (data) => data.earlyStudySessions >= 20
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD TIME PERIODS
// ═══════════════════════════════════════════════════════════════════════════

export const TIME_PERIODS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time'
};

// ═══════════════════════════════════════════════════════════════════════════
// FETCH LEADERBOARD DATA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch complete leaderboard with rankings (OPTIMIZED VERSION)
 * @param {string} period - Time period (weekly, monthly, all_time)
 * @param {string} department - Optional department filter
 * @param {number} limitCount - Number of results to return
 * @returns {Promise<Array>} - Ranked students array
 */
export async function fetchLeaderboard(period = TIME_PERIODS.ALL_TIME, department = null, limitCount = 100) {
  try {
    console.time('fetchLeaderboard');

    // Fetch all users with optimized query
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('role', '==', 'student'));

    if (department) {
      q = query(q, where('department', '==', department));
    }

    const usersSnapshot = await getDocs(q);
    console.log(`Fetched ${usersSnapshot.docs.length} students from database`);

    // Helper function to safely convert to Date
    const toSafeDate = (value) => {
      if (!value) return new Date();
      if (value instanceof Date) return value;
      if (value.toDate && typeof value.toDate === 'function') return value.toDate();
      if (typeof value === 'string') return new Date(value);
      return new Date();
    };

    // Process all students in parallel with Promise.allSettled for fault tolerance
    const studentPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();

      try {
        // Use stored values from user document instead of recalculating everything
        // This assumes momentum scores and analytics are updated periodically
        const momentumScore = userData.momentumScore || 0;
        const totalStudyHours = userData.totalStudyHours || 0;
        const focusScore = userData.focusScore || 0;

        // Only fetch tasks count if not stored in user document
        let completedTasksCount = userData.completedTasks || 0;
        let totalTasksCount = userData.totalTasks || 0;

        // If task counts aren't stored, fetch them (but this should be avoided in production)
        if (!userData.completedTasks && !userData.totalTasks) {
          try {
            const [selfTasks, assignedTasks] = await Promise.all([
              getUserTasks(userDoc.id).catch(() => []),
              getAssignedTasks(userDoc.id).catch(() => [])
            ]);
            const allTasks = [...selfTasks, ...assignedTasks];
            completedTasksCount = allTasks.filter(t => t.completed).length;
            totalTasksCount = allTasks.length;
          } catch (taskError) {
            console.warn(`Could not fetch tasks for ${userDoc.id}:`, taskError);
          }
        }

        // Calculate metrics using stored data
        const studentData = {
          id: userDoc.id,
          name: userData.name || 'Unknown',
          email: userData.email || '',
          photoURL: userData.photoURL || null,
          department: userData.department || 'General',
          college: userData.college || 'Unknown',

          // Core metrics (use stored values)
          momentumScore: momentumScore,
          momentumBreakdown: userData.momentumBreakdown || {},

          // Study metrics (use stored values)
          totalStudyHours: totalStudyHours,
          focusScore: focusScore,
          distractionTime: userData.distractionTime || 0,
          distractionRatio: userData.distractionRatio || 0,

          // Task metrics
          totalTasks: totalTasksCount,
          completedTasks: completedTasksCount,
          completionRate: totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0,

          // Consistency metrics
          streak: userData.streak || 0,
          focusSessions: userData.focusSessions || 0,

          // Growth metrics
          momentumGrowth: userData.momentumGrowth || 0,
          weeklyGrowth: userData.weeklyGrowth || 0,

          // Additional data
          lastActive: toSafeDate(userData.lastActive),
          createdAt: toSafeDate(userData.createdAt),

          // Early bird tracking
          earlyStudySessions: userData.earlyStudySessions || 0
        };

        // Calculate badges (lightweight operation)
        studentData.badges = calculateBadges(studentData);

        return { status: 'fulfilled', value: studentData };
      } catch (error) {
        console.error(`Error processing student ${userDoc.id}:`, error);
        return { status: 'rejected', reason: error };
      }
    });

    // Wait for all students to be processed
    const results = await Promise.allSettled(studentPromises);

    // Extract successful results
    const students = results
      .filter(result => result.status === 'fulfilled' && result.value?.status !== 'rejected')
      .map(result => result.value?.value || result.value)
      .filter(Boolean);

    console.log(`Successfully processed ${students.length} students`);

    // Sort by momentum score (primary) and study hours (secondary)
    students.sort((a, b) => {
      if (b.momentumScore !== a.momentumScore) {
        return b.momentumScore - a.momentumScore;
      }
      return b.totalStudyHours - a.totalStudyHours;
    });

    // Assign ranks and calculate rank changes
    students.forEach((student, index) => {
      student.rank = index + 1;
      student.rankChange = calculateRankChange(student, period);
      student.isPodium = index < 3;
      student.podiumMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
    });

    console.timeEnd('fetchLeaderboard');
    return students.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get analytics for specific time period
 * @param {string} userId - User ID
 * @param {string} period - Time period
 * @returns {Promise<Object>} - Analytics data
 */
async function getAnalyticsForPeriod(userId, period) {
  try {
    const weeklyAnalytics = await getWeeklyAnalytics(userId);
    const todayAnalytics = await getTodayAnalytics(userId);

    let totalStudyHours = 0;
    let totalDistractionTime = 0;
    let focusSessions = 0;
    let earlyStudySessions = 0;

    if (period === TIME_PERIODS.WEEKLY) {
      // Last 7 days
      totalStudyHours = weeklyAnalytics.reduce((sum, day) => sum + (day.studyTime || 0), 0);
      totalDistractionTime = weeklyAnalytics.reduce((sum, day) => sum + (day.distractionTime || 0), 0);
      focusSessions = weeklyAnalytics.reduce((sum, day) => sum + (day.focusSessions || 0), 0);
    } else if (period === TIME_PERIODS.MONTHLY) {
      // Would need to fetch 30 days - for now use weekly * 4
      totalStudyHours = weeklyAnalytics.reduce((sum, day) => sum + (day.studyTime || 0), 0) * 4;
      totalDistractionTime = weeklyAnalytics.reduce((sum, day) => sum + (day.distractionTime || 0), 0) * 4;
      focusSessions = weeklyAnalytics.reduce((sum, day) => sum + (day.focusSessions || 0), 0) * 4;
    } else {
      // All time - use user profile data
      totalStudyHours = weeklyAnalytics.reduce((sum, day) => sum + (day.studyTime || 0), 0);
      totalDistractionTime = weeklyAnalytics.reduce((sum, day) => sum + (day.distractionTime || 0), 0);
      focusSessions = weeklyAnalytics.reduce((sum, day) => sum + (day.focusSessions || 0), 0);
    }

    const totalTime = totalStudyHours + totalDistractionTime;
    const focusScore = totalTime > 0 ? Math.round((totalStudyHours / totalTime) * 100) : 0;
    const distractionRatio = totalTime > 0 ? totalDistractionTime / totalTime : 0;

    // Calculate weekly growth
    const firstHalf = weeklyAnalytics.slice(0, 3).reduce((sum, d) => sum + (d.studyTime || 0), 0) / 3;
    const secondHalf = weeklyAnalytics.slice(4, 7).reduce((sum, d) => sum + (d.studyTime || 0), 0) / 3;
    const weeklyGrowth = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    return {
      totalStudyHours,
      distractionTime: totalDistractionTime,
      focusScore,
      distractionRatio,
      focusSessions,
      weeklyGrowth,
      earlyStudySessions
    };
  } catch (error) {
    console.error('Error getting analytics for period:', error);
    return {
      totalStudyHours: 0,
      distractionTime: 0,
      focusScore: 0,
      distractionRatio: 0,
      focusSessions: 0,
      weeklyGrowth: 0,
      earlyStudySessions: 0
    };
  }
}

/**
 * Calculate momentum growth
 * @param {Object} userData - User data
 * @returns {number} - Growth percentage
 */
function calculateMomentumGrowth(userData) {
  // This would ideally track historical momentum scores
  // For now, return a calculated value based on recent activity
  const currentScore = userData.momentumScore || 0;
  const previousScore = userData.previousMomentumScore || currentScore * 0.8;
  return Math.round(currentScore - previousScore);
}

/**
 * Calculate rank change based on momentum growth direction only.
 * Returns a deterministic value — no randomness.
 * @param {Object} student - Student data
 * @param {string} period - Time period
 * @returns {number} - Rank change (positive = moved up, negative = moved down, 0 = stable)
 */
function calculateRankChange(student, period) {
  const growth = student.momentumGrowth || 0;
  // Deterministic: use growth magnitude capped at ±5
  if (growth > 20) return 5;
  if (growth > 10) return 3;
  if (growth > 5) return 1;
  if (growth < -20) return -5;
  if (growth < -10) return -3;
  if (growth < -5) return -1;
  return 0;
}

/**
 * Calculate achievement badges for student
 * @param {Object} studentData - Student data
 * @returns {Array} - Array of earned badges
 */
function calculateBadges(studentData) {
  const earnedBadges = [];

  Object.values(ACHIEVEMENT_BADGES).forEach(badge => {
    if (badge.requirement(studentData)) {
      earnedBadges.push(badge);
    }
  });

  return earnedBadges;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET STUDENT RANK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get specific student's rank and position
 * @param {string} userId - User ID
 * @param {string} period - Time period
 * @returns {Promise<Object>} - Student rank data
 */
export async function getStudentRank(userId, period = TIME_PERIODS.ALL_TIME) {
  try {
    // Get user document directly for quick access
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        rank: null,
        total: 0,
        percentile: 0,
        student: null
      };
    }

    const userData = userDoc.data();

    // Quick rank estimation based on momentum score
    // This avoids fetching the entire leaderboard
    const usersRef = collection(db, 'users');
    const higherRankedQuery = query(
      usersRef,
      where('role', '==', 'student'),
      where('momentumScore', '>', userData.momentumScore || 0)
    );

    const [higherRankedSnapshot, totalStudentsSnapshot] = await Promise.all([
      getDocs(higherRankedQuery),
      getDocs(query(usersRef, where('role', '==', 'student')))
    ]);

    const rank = higherRankedSnapshot.size + 1;
    const total = totalStudentsSnapshot.size;
    const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

    return {
      rank,
      total,
      percentile,
      student: {
        id: userId,
        name: userData.name || 'Unknown',
        momentumScore: userData.momentumScore || 0,
        totalStudyHours: userData.totalStudyHours || 0,
        streak: userData.streak || 0
      },
      aboveStudent: null, // Not fetching neighbors for performance
      belowStudent: null
    };
  } catch (error) {
    console.error('Error getting student rank:', error);
    return {
      rank: null,
      total: 0,
      percentile: 0,
      student: null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get department-wise leaderboard
 * @param {string} period - Time period
 * @returns {Promise<Object>} - Department rankings
 */
export async function getDepartmentLeaderboard(period = TIME_PERIODS.ALL_TIME) {
  try {
    const allStudents = await fetchLeaderboard(period, null, 1000);

    // Group by department
    const departmentGroups = {};
    allStudents.forEach(student => {
      const dept = student.department || 'General';
      if (!departmentGroups[dept]) {
        departmentGroups[dept] = [];
      }
      departmentGroups[dept].push(student);
    });

    // Calculate department stats
    const departmentStats = Object.entries(departmentGroups).map(([dept, students]) => {
      const avgMomentum = students.reduce((sum, s) => sum + s.momentumScore, 0) / students.length;
      const avgStudyHours = students.reduce((sum, s) => sum + s.totalStudyHours, 0) / students.length;
      const topStudent = students[0];

      return {
        department: dept,
        studentCount: students.length,
        avgMomentum: Math.round(avgMomentum),
        avgStudyHours: Math.round(avgStudyHours * 10) / 10,
        topStudent,
        students: students.slice(0, 10) // Top 10 per department
      };
    });

    // Sort departments by average momentum
    departmentStats.sort((a, b) => b.avgMomentum - a.avgMomentum);

    return departmentStats;
  } catch (error) {
    console.error('Error getting department leaderboard:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOST IMPROVED STUDENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get most improved students
 * @param {string} period - Time period
 * @param {number} limitCount - Number of results
 * @returns {Promise<Array>} - Most improved students
 */
export async function getMostImprovedStudents(period = TIME_PERIODS.WEEKLY, limitCount = 10) {
  try {
    const leaderboard = await fetchLeaderboard(period, null, 1000);

    // Sort by momentum growth
    const improved = leaderboard
      .filter(s => s.momentumGrowth > 0)
      .sort((a, b) => b.momentumGrowth - a.momentumGrowth)
      .slice(0, limitCount);

    return improved;
  } catch (error) {
    console.error('Error getting most improved students:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH STUDENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search students in leaderboard
 * @param {string} searchTerm - Search term
 * @param {Array} leaderboard - Leaderboard data
 * @returns {Array} - Filtered students
 */
export function searchStudents(searchTerm, leaderboard) {
  if (!searchTerm || searchTerm.trim() === '') {
    return leaderboard;
  }

  const term = searchTerm.toLowerCase();
  return leaderboard.filter(student =>
    student.name.toLowerCase().includes(term) ||
    student.email.toLowerCase().includes(term) ||
    student.department.toLowerCase().includes(term)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get leaderboard analytics
 * @param {Array} leaderboard - Leaderboard data
 * @returns {Object} - Analytics summary
 */
export function getLeaderboardAnalytics(leaderboard) {
  if (leaderboard.length === 0) {
    return {
      totalStudents: 0,
      avgMomentum: 0,
      avgStudyHours: 0,
      avgFocusScore: 0,
      topPerformer: null,
      mostImproved: null
    };
  }

  const totalStudents = leaderboard.length;
  const avgMomentum = Math.round(
    leaderboard.reduce((sum, s) => sum + s.momentumScore, 0) / totalStudents
  );
  const avgStudyHours = Math.round(
    (leaderboard.reduce((sum, s) => sum + s.totalStudyHours, 0) / totalStudents) * 10
  ) / 10;
  const avgFocusScore = Math.round(
    leaderboard.reduce((sum, s) => sum + s.focusScore, 0) / totalStudents
  );

  const topPerformer = leaderboard[0];
  const mostImproved = [...leaderboard].sort((a, b) => b.momentumGrowth - a.momentumGrowth)[0];

  return {
    totalStudents,
    avgMomentum,
    avgStudyHours,
    avgFocusScore,
    topPerformer,
    mostImproved
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  fetchLeaderboard,
  getStudentRank,
  getDepartmentLeaderboard,
  getMostImprovedStudents,
  searchStudents,
  getLeaderboardAnalytics,
  ACHIEVEMENT_BADGES,
  TIME_PERIODS
};
