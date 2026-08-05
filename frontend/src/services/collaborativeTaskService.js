// ═══════════════════════════════════════════════════════════════════════════
// COLLABORATIVE TASK SERVICE - Teacher & Peer Task Assignment System
// ═══════════════════════════════════════════════════════════════════════════

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { triggerMomentumUpdate } from './momentumScoreEngine';

// ═══════════════════════════════════════════════════════════════════════════
// TASK TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const TASK_TYPES = {
  SELF: 'self',
  TEACHER_ASSIGNED: 'teacher_assigned',
  PEER_CHALLENGE: 'peer_challenge',
  ADMIN_ASSIGNED: 'admin_assigned'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted', // NEW: Task submitted for review
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  REVISION_REQUESTED: 'revision_requested' // NEW: Needs revision
};

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const MOMENTUM_REWARDS = {
  low: { base: 10, onTime: 15, early: 20 },
  medium: { base: 20, onTime: 30, early: 40 },
  high: { base: 30, onTime: 45, early: 60 },
  urgent: { base: 50, onTime: 75, early: 100 }
};

// ═══════════════════════════════════════════════════════════════════════════
// TASK ASSIGNMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assign task to student (Teacher/Admin/Peer)
 * @param {Object} taskData - Task assignment data
 * @returns {Promise<Object>} - Created task
 */
export async function assignTaskToStudent(taskData) {
  try {
    const {
      assignedBy,
      assignedByName,
      assignedByRole,
      assignedTo,
      assignedToName,
      title,
      description,
      category,
      subject,
      priority,
      dueDate,
      estimatedTime,
      requiresApproval
    } = taskData;

    // Validate required fields
    if (!assignedBy || !assignedTo || !title) {
      throw new Error('Missing required fields');
    }

    // Create task document
    const taskRef = collection(db, 'assignedTasks');
    const newTask = {
      assignedBy,
      assignedByName: assignedByName || 'Unknown',
      assignedByRole: assignedByRole || 'peer',
      assignedTo,
      assignedToName: assignedToName || 'Student',
      title,
      description: description || '',
      category: category || 'study',
      subject: subject || '',
      priority: priority || PRIORITY_LEVELS.MEDIUM,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      estimatedTime: estimatedTime || 60,
      
      // Status management
      status: assignedByRole === 'teacher' || assignedByRole === 'admin' 
        ? TASK_STATUS.ACCEPTED  // Auto-accept teacher/admin tasks
        : TASK_STATUS.PENDING,   // Peer tasks need approval
      
      requiresApproval: requiresApproval !== undefined ? requiresApproval : (assignedByRole === 'peer'),
      
      // Task type
      taskType: assignedByRole === 'teacher' || assignedByRole === 'admin'
        ? TASK_TYPES.TEACHER_ASSIGNED
        : TASK_TYPES.PEER_CHALLENGE,
      
      // Completion tracking
      completed: false,
      completedAt: null,
      completionTime: null,
      
      // Momentum rewards
      momentumReward: calculateMomentumReward(priority, 'base'),
      momentumEarned: 0,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      acceptedAt: assignedByRole === 'teacher' || assignedByRole === 'admin' ? serverTimestamp() : null,
      
      // Metadata
      isOverdue: false,
      reminderSent: false,
      viewedByStudent: false
    };

    const docRef = await addDoc(taskRef, newTask);

    // Create notification for student
    await createTaskNotification({
      userId: assignedTo,
      taskId: docRef.id,
      type: assignedByRole === 'teacher' || assignedByRole === 'admin' ? 'task_assigned' : 'challenge_received',
      message: `${assignedByName} assigned you: "${title}"`,
      assignedBy,
      assignedByName,
      assignedByRole
    });

    // Log activity
    await logTaskActivity({
      taskId: docRef.id,
      userId: assignedBy,
      action: 'task_assigned',
      details: `Assigned "${title}" to ${assignedToName}`
    });

    return {
      id: docRef.id,
      ...newTask
    };
  } catch (error) {
    console.error('Error assigning task:', error);
    throw error;
  }
}

/**
 * Get tasks assigned to a student
 * @param {string} userId - Student user ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of assigned tasks
 */
export async function getAssignedTasks(userId, filters = {}) {
  try {
    const tasksRef = collection(db, 'assignedTasks');
    let q = query(
      tasksRef,
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Apply filters
    if (filters.status) {
      q = query(tasksRef, where('assignedTo', '==', userId), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }

    if (filters.taskType) {
      q = query(tasksRef, where('assignedTo', '==', userId), where('taskType', '==', filters.taskType), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const tasks = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        acceptedAt: data.acceptedAt?.toDate()
      });
    });

    // Check for overdue tasks
    const now = new Date();
    tasks.forEach(task => {
      if (task.dueDate && task.dueDate < now && !task.completed) {
        task.isOverdue = true;
      }
    });

    return tasks;
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return [];
  }
}

/**
 * Get tasks created by a user (teacher/peer)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of created tasks
 */
export async function getCreatedTasks(userId) {
  try {
    const tasksRef = collection(db, 'assignedTasks');
    const q = query(
      tasksRef,
      where('assignedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const tasks = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });

    return tasks;
  } catch (error) {
    console.error('Error fetching created tasks:', error);
    return [];
  }
}

/**
 * Accept peer task
 * @param {string} taskId - Task ID
 * @param {string} userId - Student user ID
 * @returns {Promise<void>}
 */
export async function acceptPeerTask(taskId, userId) {
  try {
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    // Verify user is the assignee
    if (taskData.assignedTo !== userId) {
      throw new Error('Unauthorized');
    }

    // Update task status
    await updateDoc(taskRef, {
      status: TASK_STATUS.ACCEPTED,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Notify assigner
    await createTaskNotification({
      userId: taskData.assignedBy,
      taskId,
      type: 'challenge_accepted',
      message: `${taskData.assignedToName} accepted your challenge: "${taskData.title}"`,
      assignedBy: userId,
      assignedByName: taskData.assignedToName
    });

    // Log activity
    await logTaskActivity({
      taskId,
      userId,
      action: 'task_accepted',
      details: `Accepted task "${taskData.title}"`
    });
  } catch (error) {
    console.error('Error accepting task:', error);
    throw error;
  }
}

/**
 * Reject peer task
 * @param {string} taskId - Task ID
 * @param {string} userId - Student user ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
export async function rejectPeerTask(taskId, userId, reason = '') {
  try {
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    // Verify user is the assignee
    if (taskData.assignedTo !== userId) {
      throw new Error('Unauthorized');
    }

    // Update task status
    await updateDoc(taskRef, {
      status: TASK_STATUS.REJECTED,
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Notify assigner
    await createTaskNotification({
      userId: taskData.assignedBy,
      taskId,
      type: 'challenge_rejected',
      message: `${taskData.assignedToName} declined your challenge: "${taskData.title}"`,
      assignedBy: userId,
      assignedByName: taskData.assignedToName
    });

    // Log activity
    await logTaskActivity({
      taskId,
      userId,
      action: 'task_rejected',
      details: `Rejected task "${taskData.title}". Reason: ${reason || 'No reason provided'}`
    });
  } catch (error) {
    console.error('Error rejecting task:', error);
    throw error;
  }
}

/**
 * Complete assigned task
 * @param {string} taskId - Task ID
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>} - Momentum reward info
 */
export async function completeAssignedTask(taskId, userId) {
  try {
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    // Verify user is the assignee
    if (taskData.assignedTo !== userId) {
      throw new Error('Unauthorized');
    }

    // Calculate momentum reward
    const now = new Date();
    const dueDate = taskData.dueDate?.toDate();
    let rewardMultiplier = 'base';

    if (dueDate) {
      const timeUntilDue = dueDate - now;
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (timeUntilDue > oneDayMs) {
        rewardMultiplier = 'early'; // Completed more than 1 day early
      } else if (timeUntilDue > 0) {
        rewardMultiplier = 'onTime'; // Completed on time
      } else {
        rewardMultiplier = 'base'; // Completed late
      }
    }

    const momentumEarned = calculateMomentumReward(taskData.priority, rewardMultiplier);

    // Update task
    await updateDoc(taskRef, {
      completed: true,
      completedAt: serverTimestamp(),
      status: TASK_STATUS.COMPLETED,
      momentumEarned,
      updatedAt: serverTimestamp()
    });

    // Update user momentum score
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      momentumScore: increment(momentumEarned),
      totalTasksCompleted: increment(1),
      updatedAt: serverTimestamp()
    });

    // Notify assigner
    await createTaskNotification({
      userId: taskData.assignedBy,
      taskId,
      type: 'task_completed',
      message: `${taskData.assignedToName} completed: "${taskData.title}"`,
      assignedBy: userId,
      assignedByName: taskData.assignedToName
    });

    // Log activity
    await logTaskActivity({
      taskId,
      userId,
      action: 'task_completed',
      details: `Completed task "${taskData.title}". Earned ${momentumEarned} momentum points.`
    });

    // Update productivity score
    await updateProductivityScore(userId, taskData);

    // Trigger momentum score recalculation
    await triggerMomentumUpdate(userId);

    return {
      momentumEarned,
      rewardMultiplier,
      taskTitle: taskData.title
    };
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

/**
 * Delete assigned task
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID (must be assigner)
 * @returns {Promise<void>}
 */
export async function deleteAssignedTask(taskId, userId) {
  try {
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    // Verify user is the assigner
    if (taskData.assignedBy !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete task
    await deleteDoc(taskRef);

    // Log activity
    await logTaskActivity({
      taskId,
      userId,
      action: 'task_deleted',
      details: `Deleted task "${taskData.title}"`
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK SUBMISSION & VERIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit task for verification (student submits proof of completion)
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID (student)
 * @param {Object} submissionData - Submission details
 * @returns {Promise<Object>}
 */
export async function submitTaskForVerification(taskId, userId, submissionData) {
  try {
    console.log('submitTaskForVerification called:', { taskId, userId, submissionData });
    
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();
    console.log('Task data:', taskData);

    // Verify user is assigned to this task
    if (taskData.assignedTo !== userId) {
      throw new Error('Unauthorized');
    }

    // Verify task is accepted or in progress
    if (taskData.status !== TASK_STATUS.ACCEPTED && taskData.status !== TASK_STATUS.IN_PROGRESS) {
      throw new Error('Task must be accepted before submission');
    }

    const {
      submissionText,
      submissionFiles = [],
      submissionLinks = []
    } = submissionData;

    console.log('Updating task with submission...');
    
    // Update task with submission
    await updateDoc(taskRef, {
      status: TASK_STATUS.SUBMITTED,
      submittedAt: serverTimestamp(),
      submission: {
        text: submissionText || '',
        files: submissionFiles,
        links: submissionLinks,
        submittedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    console.log('Task updated successfully. Creating notification for:', taskData.assignedBy);

    // Notify assigner that task is submitted for review
    await createTaskNotification({
      userId: taskData.assignedBy,
      taskId,
      type: 'task_submitted',
      message: `${taskData.assignedToName} submitted: "${taskData.title}" for review`,
      assignedBy: userId,
      assignedByName: taskData.assignedToName
    });

    console.log('Notification created. Logging activity...');

    // Log activity
    await logTaskActivity({
      taskId,
      userId,
      action: 'task_submitted',
      details: `Submitted task "${taskData.title}" for verification`
    });

    console.log('Task submission complete!');

    return {
      success: true,
      message: 'Task submitted for verification'
    };
  } catch (error) {
    console.error('Error submitting task:', error);
    throw error;
  }
}

/**
 * Verify and approve task completion (teacher/admin/friend approves)
 * @param {string} taskId - Task ID
 * @param {string} reviewerId - Reviewer ID (assigner)
 * @param {Object} reviewData - Review details
 * @returns {Promise<Object>}
 */
export async function verifyTaskCompletion(taskId, reviewerId, reviewData) {
  try {
    const taskRef = doc(db, 'assignedTasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    // Verify reviewer is the assigner
    if (taskData.assignedBy !== reviewerId) {
      throw new Error('Unauthorized: Only task assigner can verify');
    }

    // Verify task is submitted
    if (taskData.status !== TASK_STATUS.SUBMITTED) {
      throw new Error('Task must be submitted before verification');
    }

    const {
      approved,
      reviewComment = '',
      rating = 0 // 1-5 stars
    } = reviewData;

    if (approved) {
      // Calculate momentum reward
      let rewardMultiplier = 'base';
      
      if (taskData.dueDate) {
        const dueDate = taskData.dueDate.toDate ? taskData.dueDate.toDate() : new Date(taskData.dueDate);
        const now = new Date();
        
        if (now < dueDate) {
          const daysEarly = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
          if (daysEarly >= 2) {
            rewardMultiplier = 'early';
          } else {
            rewardMultiplier = 'onTime';
          }
        } else {
          rewardMultiplier = 'base';
        }
      }

      const momentumEarned = calculateMomentumReward(taskData.priority, rewardMultiplier);

      // Bonus for high rating
      const ratingBonus = rating >= 4 ? Math.round(momentumEarned * 0.2) : 0;
      const totalMomentum = momentumEarned + ratingBonus;

      // Update task as completed
      await updateDoc(taskRef, {
        completed: true,
        completedAt: serverTimestamp(),
        status: TASK_STATUS.COMPLETED,
        momentumEarned: totalMomentum,
        review: {
          approved: true,
          reviewedBy: reviewerId,
          reviewedAt: serverTimestamp(),
          comment: reviewComment,
          rating
        },
        updatedAt: serverTimestamp()
      });

      // Update user momentum score
      const userRef = doc(db, 'users', taskData.assignedTo);
      await updateDoc(userRef, {
        momentumScore: increment(totalMomentum),
        totalTasksCompleted: increment(1),
        updatedAt: serverTimestamp()
      });

      // Notify student of approval
      await createTaskNotification({
        userId: taskData.assignedTo,
        taskId,
        type: 'task_approved',
        message: `Your task "${taskData.title}" was approved! +${totalMomentum} momentum`,
        assignedBy: reviewerId,
        assignedByName: taskData.assignedByName
      });

      // Log activity
      await logTaskActivity({
        taskId,
        userId: taskData.assignedTo,
        action: 'task_approved',
        details: `Task "${taskData.title}" approved. Earned ${totalMomentum} momentum points (${momentumEarned} base + ${ratingBonus} rating bonus).`
      });

      // Update productivity score
      await updateProductivityScore(taskData.assignedTo, taskData);

      // Trigger momentum score recalculation
      await triggerMomentumUpdate(taskData.assignedTo);

      return {
        success: true,
        approved: true,
        momentumEarned: totalMomentum,
        message: 'Task approved and points awarded'
      };
    } else {
      // Request revision
      await updateDoc(taskRef, {
        status: TASK_STATUS.REVISION_REQUESTED,
        review: {
          approved: false,
          reviewedBy: reviewerId,
          reviewedAt: serverTimestamp(),
          comment: reviewComment,
          rating
        },
        updatedAt: serverTimestamp()
      });

      // Notify student of revision request
      await createTaskNotification({
        userId: taskData.assignedTo,
        taskId,
        type: 'task_revision_requested',
        message: `Revision requested for "${taskData.title}": ${reviewComment}`,
        assignedBy: reviewerId,
        assignedByName: taskData.assignedByName
      });

      // Log activity
      await logTaskActivity({
        taskId,
        userId: taskData.assignedTo,
        action: 'revision_requested',
        details: `Revision requested for "${taskData.title}": ${reviewComment}`
      });

      return {
        success: true,
        approved: false,
        message: 'Revision requested'
      };
    }
  } catch (error) {
    console.error('Error verifying task:', error);
    throw error;
  }
}

/**
 * Get tasks pending verification (for task assigners)
 * @param {string} assignerId - Assigner ID
 * @returns {Promise<Array>} - Tasks pending verification
 */
export async function getTasksPendingVerification(assignerId) {
  try {
    console.log('getTasksPendingVerification called for assignerId:', assignerId);
    
    const tasksRef = collection(db, 'assignedTasks');
    const q = query(
      tasksRef,
      where('assignedBy', '==', assignerId),
      where('status', '==', TASK_STATUS.SUBMITTED),
      orderBy('submittedAt', 'desc')
    );

    console.log('Executing query...');
    const querySnapshot = await getDocs(q);
    console.log('Query returned', querySnapshot.size, 'documents');
    
    const tasks = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Task document:', doc.id, data);
      tasks.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        submittedAt: data.submittedAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });

    console.log('Returning', tasks.length, 'pending verification tasks');
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks pending verification:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate momentum reward based on priority and completion timing
 * @param {string} priority - Task priority
 * @param {string} timing - Completion timing (base, onTime, early)
 * @returns {number} - Momentum points
 */
function calculateMomentumReward(priority, timing = 'base') {
  const rewards = MOMENTUM_REWARDS[priority] || MOMENTUM_REWARDS.medium;
  return rewards[timing] || rewards.base;
}

/**
 * Create task notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<void>}
 */
async function createTaskNotification(notificationData) {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Log task activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<void>}
 */
async function logTaskActivity(activityData) {
  try {
    const activityRef = collection(db, 'taskActivity');
    await addDoc(activityRef, {
      ...activityData,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Update productivity score based on task completion
 * @param {string} userId - User ID
 * @param {Object} taskData - Task data
 * @returns {Promise<void>}
 */
async function updateProductivityScore(userId, taskData) {
  try {
    const productivityRef = collection(db, 'productivityScores');
    const today = new Date().toISOString().split('T')[0];

    // Check if today's score exists
    const q = query(
      productivityRef,
      where('userId', '==', userId),
      where('date', '==', today),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Create new productivity score
      await addDoc(productivityRef, {
        userId,
        date: today,
        tasksCompleted: 1,
        momentumEarned: taskData.momentumEarned || 0,
        productivityScore: calculateProductivityScore(taskData),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing score
      const docRef = querySnapshot.docs[0].ref;
      const currentData = querySnapshot.docs[0].data();

      await updateDoc(docRef, {
        tasksCompleted: increment(1),
        momentumEarned: increment(taskData.momentumEarned || 0),
        productivityScore: currentData.productivityScore + calculateProductivityScore(taskData),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating productivity score:', error);
  }
}

/**
 * Calculate productivity score for a task
 * @param {Object} taskData - Task data
 * @returns {number} - Productivity score
 */
function calculateProductivityScore(taskData) {
  let score = 10; // Base score

  // Priority multiplier
  const priorityMultipliers = {
    low: 1,
    medium: 1.5,
    high: 2,
    urgent: 2.5
  };

  score *= priorityMultipliers[taskData.priority] || 1;

  // Task type multiplier
  if (taskData.taskType === TASK_TYPES.TEACHER_ASSIGNED) {
    score *= 1.5; // Teacher tasks are more valuable
  }

  // Completion timing bonus
  if (!taskData.isOverdue) {
    score *= 1.2;
  }

  return Math.round(score);
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get task statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Task statistics
 */
export async function getTaskStatistics(userId) {
  try {
    const tasks = await getAssignedTasks(userId);

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TASK_STATUS.PENDING).length,
      accepted: tasks.filter(t => t.status === TASK_STATUS.ACCEPTED).length,
      completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
      rejected: tasks.filter(t => t.status === TASK_STATUS.REJECTED).length,
      overdue: tasks.filter(t => t.isOverdue).length,
      
      byType: {
        teacher: tasks.filter(t => t.taskType === TASK_TYPES.TEACHER_ASSIGNED).length,
        peer: tasks.filter(t => t.taskType === TASK_TYPES.PEER_CHALLENGE).length
      },
      
      byPriority: {
        low: tasks.filter(t => t.priority === PRIORITY_LEVELS.LOW).length,
        medium: tasks.filter(t => t.priority === PRIORITY_LEVELS.MEDIUM).length,
        high: tasks.filter(t => t.priority === PRIORITY_LEVELS.HIGH).length,
        urgent: tasks.filter(t => t.priority === PRIORITY_LEVELS.URGENT).length
      },
      
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
        : 0,
      
      totalMomentumEarned: tasks.reduce((sum, t) => sum + (t.momentumEarned || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error calculating task statistics:', error);
    return null;
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of notifications to fetch
 * @returns {Promise<Array>} - Array of notifications
 */
export async function getUserNotifications(userId, limitCount = 20) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Task assignment
  assignTaskToStudent,
  getAssignedTasks,
  getCreatedTasks,
  acceptPeerTask,
  rejectPeerTask,
  completeAssignedTask,
  deleteAssignedTask,
  
  // Task submission & verification
  submitTaskForVerification,
  verifyTaskCompletion,
  getTasksPendingVerification,
  
  // Statistics
  getTaskStatistics,
  
  // Notifications
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  
  // Constants
  TASK_TYPES,
  TASK_STATUS,
  PRIORITY_LEVELS,
  MOMENTUM_REWARDS
};
