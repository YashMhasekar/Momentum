import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { triggerMomentumUpdate } from './momentumScoreEngine';

// ═══════════════════════════════════════════════════════════════════════════
// HABIT TRACKER SERVICE - Firestore Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new habit
 * @param {string} userId - User ID
 * @param {Object} habitData - Habit data
 * @returns {Object} - Created habit document
 */
export async function createHabit(userId, habitData) {
  try {
    const habitRef = collection(db, 'habits');
    
    const habitDoc = {
      userId,
      name: habitData.name,
      description: habitData.description || '',
      category: habitData.category || 'study',
      targetDays: habitData.targetDays || 30,
      streak: 0,
      longestStreak: 0,
      completedDates: [],
      lastCompletedDate: null,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(habitRef, habitDoc);
    
    return {
      id: docRef.id,
      ...habitDoc
    };
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

/**
 * Get all habits for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of habit documents
 */
export async function getUserHabits(userId) {
  try {
    const habitRef = collection(db, 'habits');
    const q = query(
      habitRef,
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const habits = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      habits.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastCompletedDate: data.lastCompletedDate?.toDate()
      });
    });

    return habits;
  } catch (error) {
    console.error('Error fetching user habits:', error);
    return [];
  }
}

/**
 * Mark habit as completed for today
 * @param {string} habitId - Habit document ID
 * @param {Object} currentHabit - Current habit data
 * @returns {Object} - Updated habit
 */
export async function completeHabit(habitId, currentHabit) {
  try {
    const habitRef = doc(db, 'habits', habitId);
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    if (currentHabit.completedDates?.includes(today)) {
      return currentHabit;
    }

    // Calculate new streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = currentHabit.streak || 0;
    
    if (currentHabit.completedDates?.includes(yesterdayStr)) {
      // Continue streak
      newStreak += 1;
    } else if (currentHabit.completedDates?.length === 0 || !currentHabit.lastCompletedDate) {
      // First completion or restart
      newStreak = 1;
    } else {
      // Streak broken, restart
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, currentHabit.longestStreak || 0);
    const updatedCompletedDates = [...(currentHabit.completedDates || []), today];

    await updateDoc(habitRef, {
      streak: newStreak,
      longestStreak,
      completedDates: updatedCompletedDates,
      lastCompletedDate: Timestamp.fromDate(new Date()),
      updatedAt: serverTimestamp()
    });

    // Trigger momentum score recalculation
    await triggerMomentumUpdate(currentHabit.userId);

    return {
      ...currentHabit,
      streak: newStreak,
      longestStreak,
      completedDates: updatedCompletedDates,
      lastCompletedDate: new Date()
    };
  } catch (error) {
    console.error('Error completing habit:', error);
    throw error;
  }
}

/**
 * Unmark habit completion for today
 * @param {string} habitId - Habit document ID
 * @param {Object} currentHabit - Current habit data
 * @returns {Object} - Updated habit
 */
export async function uncompleteHabit(habitId, currentHabit) {
  try {
    const habitRef = doc(db, 'habits', habitId);
    const today = new Date().toISOString().split('T')[0];
    
    // Remove today from completed dates
    const updatedCompletedDates = (currentHabit.completedDates || []).filter(date => date !== today);
    
    // Recalculate streak
    let newStreak = 0;
    if (updatedCompletedDates.length > 0) {
      // Check consecutive days from today backwards
      const sortedDates = updatedCompletedDates.sort().reverse();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      for (let i = 0; i < sortedDates.length; i++) {
        const checkDate = new Date(yesterday);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (sortedDates.includes(checkDateStr)) {
          newStreak++;
        } else {
          break;
        }
      }
    }

    await updateDoc(habitRef, {
      streak: newStreak,
      completedDates: updatedCompletedDates,
      updatedAt: serverTimestamp()
    });

    return {
      ...currentHabit,
      streak: newStreak,
      completedDates: updatedCompletedDates
    };
  } catch (error) {
    console.error('Error uncompleting habit:', error);
    throw error;
  }
}

/**
 * Update habit details
 * @param {string} habitId - Habit document ID
 * @param {Object} updates - Fields to update
 */
export async function updateHabit(habitId, updates) {
  try {
    const habitRef = doc(db, 'habits', habitId);
    await updateDoc(habitRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
}

/**
 * Delete (archive) a habit
 * @param {string} habitId - Habit document ID
 */
export async function deleteHabit(habitId) {
  try {
    const habitRef = doc(db, 'habits', habitId);
    await updateDoc(habitRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
}

/**
 * Check if habit is completed today
 * @param {Object} habit - Habit object
 * @returns {boolean} - True if completed today
 */
export function isCompletedToday(habit) {
  const today = new Date().toISOString().split('T')[0];
  return habit.completedDates?.includes(today) || false;
}

/**
 * Get habit completion rate
 * @param {Object} habit - Habit object
 * @returns {number} - Completion rate percentage (0-100)
 */
export function getCompletionRate(habit) {
  if (!habit.createdAt) return 0;
  
  const daysSinceCreation = Math.floor(
    (new Date() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  const completedDays = habit.completedDates?.length || 0;
  const rate = (completedDays / daysSinceCreation) * 100;
  
  return Math.min(Math.round(rate), 100);
}

/**
 * Get habit statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} - Habit statistics
 */
export async function getHabitStats(userId) {
  try {
    const habits = await getUserHabits(userId);
    
    if (habits.length === 0) {
      return {
        totalHabits: 0,
        activeHabits: 0,
        totalCompletions: 0,
        avgStreak: 0,
        longestStreak: 0
      };
    }

    const totalCompletions = habits.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);
    const avgStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length;
    const longestStreak = Math.max(...habits.map(h => h.longestStreak || 0));

    return {
      totalHabits: habits.length,
      activeHabits: habits.filter(h => h.streak > 0).length,
      totalCompletions,
      avgStreak: Math.round(avgStreak),
      longestStreak
    };
  } catch (error) {
    console.error('Error calculating habit stats:', error);
    return {
      totalHabits: 0,
      activeHabits: 0,
      totalCompletions: 0,
      avgStreak: 0,
      longestStreak: 0
    };
  }
}

export default {
  createHabit,
  getUserHabits,
  completeHabit,
  uncompleteHabit,
  updateHabit,
  deleteHabit,
  isCompletedToday,
  getCompletionRate,
  getHabitStats
};
