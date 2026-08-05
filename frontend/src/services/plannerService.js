import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

// ═══════════════════════════════════════════════════════════════════════════
// SMART PLANNER SERVICE - Firestore Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save a generated timetable to Firestore
 * @param {string} userId - User ID
 * @param {Object} plannerData - Timetable data
 * @returns {Object} - Created planner document
 */
export async function savePlanner(userId, plannerData) {
  try {
    const plannerRef = collection(db, 'smartPlanners');
    
    const plannerDoc = {
      userId,
      tasks: plannerData.tasks || [],
      inputMode: plannerData.inputMode || 'days',
      totalDays: plannerData.totalDays || 0,
      startDate: plannerData.startDate || null,
      endDate: plannerData.endDate || null,
      dailyHours: plannerData.dailyHours || 0,
      breakDuration: plannerData.breakDuration || 0,
      preferredTime: plannerData.preferredTime || 'Morning',
      timetable: plannerData.timetable || [],
      stats: plannerData.stats || {},
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(plannerRef, plannerDoc);
    
    return {
      id: docRef.id,
      ...plannerDoc
    };
  } catch (error) {
    console.error('Error saving planner:', error);
    throw error;
  }
}

/**
 * Get all planners for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of planners to fetch
 * @returns {Array} - Array of planner documents
 */
export async function getUserPlanners(userId, limitCount = 10) {
  try {
    const plannerRef = collection(db, 'smartPlanners');
    const q = query(
      plannerRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const planners = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      planners.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
        createdAt: data.createdAt?.toDate()
      });
    });

    return planners;
  } catch (error) {
    console.error('Error fetching user planners:', error);
    return [];
  }
}

/**
 * Get the most recent planner for a user
 * @param {string} userId - User ID
 * @returns {Object|null} - Most recent planner or null
 */
export async function getLatestPlanner(userId) {
  try {
    const planners = await getUserPlanners(userId, 1);
    return planners.length > 0 ? planners[0] : null;
  } catch (error) {
    console.error('Error fetching latest planner:', error);
    return null;
  }
}

/**
 * Delete a planner
 * @param {string} plannerId - Planner document ID
 */
export async function deletePlanner(plannerId) {
  try {
    const plannerRef = doc(db, 'smartPlanners', plannerId);
    await deleteDoc(plannerRef);
  } catch (error) {
    console.error('Error deleting planner:', error);
    throw error;
  }
}

/**
 * Get planner statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} - Planner statistics
 */
export async function getPlannerStats(userId) {
  try {
    const planners = await getUserPlanners(userId, 100);
    
    if (planners.length === 0) {
      return {
        totalPlanners: 0,
        totalTasks: 0,
        totalStudyHours: 0,
        avgDailyHours: 0
      };
    }

    const totalTasks = planners.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const totalStudyHours = planners.reduce((sum, p) => sum + (p.stats?.totalStudyTime || 0), 0);
    const avgDailyHours = planners.reduce((sum, p) => sum + (p.dailyHours || 0), 0) / planners.length;

    return {
      totalPlanners: planners.length,
      totalTasks,
      totalStudyHours,
      avgDailyHours: Math.round(avgDailyHours * 10) / 10
    };
  } catch (error) {
    console.error('Error calculating planner stats:', error);
    return {
      totalPlanners: 0,
      totalTasks: 0,
      totalStudyHours: 0,
      avgDailyHours: 0
    };
  }
}

export default {
  savePlanner,
  getUserPlanners,
  getLatestPlanner,
  deletePlanner,
  getPlannerStats
};
