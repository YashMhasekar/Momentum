import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { triggerMomentumUpdate } from './momentumScoreEngine';

// Task Categories
export const taskCategories = [
  { id: 'study', name: 'Study', color: '#3b82f6' },
  { id: 'assignment', name: 'Assignment', color: '#8b5cf6' },
  { id: 'revision', name: 'Revision', color: '#10b981' },
  { id: 'coding', name: 'Coding', color: '#f59e0b' },
  { id: 'exam-prep', name: 'Exam Prep', color: '#ef4444' },
  { id: 'personal', name: 'Personal', color: '#6b7280' },
  { id: 'project', name: 'Project', color: '#06b6d4' },
  { id: 'focus', name: 'Focus', color: '#8b5cf6' }
];

// Priority Levels
export const priorityLevels = [
  { id: 'low', name: 'Low', color: '#6b7280' },
  { id: 'medium', name: 'Medium', color: '#f59e0b' },
  { id: 'high', name: 'High', color: '#ef4444' }
];

// Recurring Types
export const recurringTypes = [
  { id: 'none', name: 'None' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekdays', name: 'Weekdays (Mon-Fri)' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'custom', name: 'Custom' }
];

// Create Task
export const createTask = async (userId, taskData) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const newTask = {
      userId,
      title: taskData.title,
      description: taskData.description || '',
      category: taskData.category || 'study',
      subject: taskData.subject || '',
      priority: taskData.priority || 'medium',
      estimatedTime: taskData.estimatedTime || 30,
      completed: false,
      recurring: taskData.recurring || false,
      recurringType: taskData.recurringType || 'none',
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      startTime: taskData.startTime || '09:00',
      endTime: taskData.endTime || '10:00',
      googleEventId: taskData.googleEventId || null,
      isCalendarSynced: taskData.isCalendarSynced || false,
      reminderType: taskData.reminderType || [],
      calendarLink: taskData.calendarLink || null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(tasksRef, newTask);
    return { id: docRef.id, ...newTask };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Get User Tasks
export const getUserTasks = async (userId) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
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
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get Today's Tasks
export const getTodayTasks = async (userId) => {
  try {
    const tasks = await getUserTasks(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter tasks for today
    const todayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    // Generate recurring tasks for today
    const recurringTasks = await generateRecurringTasks(userId, tasks);

    return [...todayTasks, ...recurringTasks];
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    throw error;
  }
};

// Generate Recurring Tasks
export const generateRecurringTasks = async (userId, allTasks) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const recurringTasks = allTasks.filter(task => task.recurring && task.recurringType !== 'none');
    const generatedTasks = [];

    for (const task of recurringTasks) {
      let shouldGenerate = false;

      switch (task.recurringType) {
        case 'daily':
          shouldGenerate = true;
          break;
        case 'weekdays':
          shouldGenerate = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'weekly':
          // Check if it's the same day of week as creation
          if (task.createdAt) {
            const createdDay = new Date(task.createdAt).getDay();
            shouldGenerate = dayOfWeek === createdDay;
          }
          break;
        default:
          shouldGenerate = false;
      }

      if (shouldGenerate) {
        // Check if already completed today
        const completedToday = task.completedAt &&
          new Date(task.completedAt).toDateString() === today.toDateString();

        if (!completedToday) {
          generatedTasks.push({
            ...task,
            id: `${task.id}-${today.toDateString()}`,
            isRecurringInstance: true,
            originalTaskId: task.id
          });
        }
      }
    }

    return generatedTasks;
  } catch (error) {
    console.error('Error generating recurring tasks:', error);
    return [];
  }
};

// Update Task
export const updateTask = async (taskId, updates) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Toggle Task Completion
export const toggleTaskCompletion = async (taskId, completed, userId = null) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed,
      completedAt: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    
    // Trigger momentum score recalculation when task is completed
    if (completed && userId) {
      await triggerMomentumUpdate(userId);
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    throw error;
  }
};

// Delete Task
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Default Tasks for New Users
export const defaultTasks = [
  {
    title: "Complete DSA Practice Questions",
    description: "Solve 5 medium difficulty array and linked list problems on LeetCode.",
    category: "coding",
    subject: "Data Structures",
    priority: "high",
    estimatedTime: 90,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Revise DBMS Notes",
    description: "Read normalization, joins, and transaction management concepts.",
    category: "revision",
    subject: "DBMS",
    priority: "medium",
    estimatedTime: 60,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Complete Operating System Assignment",
    description: "Finish CPU scheduling algorithm assignment and upload PDF.",
    category: "assignment",
    subject: "Operating Systems",
    priority: "high",
    estimatedTime: 120,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Morning Focus Session",
    description: "Deep work session without distractions for core subjects.",
    category: "study",
    subject: "General Study",
    priority: "medium",
    estimatedTime: 120,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Practice Aptitude Questions",
    description: "Solve quantitative aptitude and reasoning problems for placements.",
    category: "exam-prep",
    subject: "Aptitude",
    priority: "medium",
    estimatedTime: 45,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Read AI/ML Research Article",
    description: "Read one article related to AI productivity systems and note key insights.",
    category: "study",
    subject: "Artificial Intelligence",
    priority: "low",
    estimatedTime: 40,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Prepare Mini Project Documentation",
    description: "Update architecture diagrams and feature descriptions for Momentum.",
    category: "assignment",
    subject: "Mini Project",
    priority: "high",
    estimatedTime: 90,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Evening Revision Session",
    description: "Revise all subjects studied today and summarize important points.",
    category: "revision",
    subject: "General Revision",
    priority: "medium",
    estimatedTime: 60,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Practice Java Development",
    description: "Build small Java backend modules and revise OOP concepts.",
    category: "coding",
    subject: "Java",
    priority: "medium",
    estimatedTime: 75,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Watch System Design Tutorial",
    description: "Watch one backend architecture/system design tutorial on YouTube.",
    category: "study",
    subject: "System Design",
    priority: "low",
    estimatedTime: 50,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Update GitHub Portfolio",
    description: "Push latest Momentum changes and improve README documentation.",
    category: "personal",
    subject: "GitHub",
    priority: "medium",
    estimatedTime: 30,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Night Reflection Journal",
    description: "Write what was learned today and identify tomorrow's priorities.",
    category: "personal",
    subject: "Self Reflection",
    priority: "low",
    estimatedTime: 15,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Solve Competitive Programming Contest",
    description: "Participate in Codeforces or LeetCode contest and solve at least 3 questions.",
    category: "coding",
    subject: "Competitive Programming",
    priority: "high",
    estimatedTime: 120,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Revise Computer Networks Protocols",
    description: "Study TCP/IP, HTTP, DNS, and routing concepts.",
    category: "revision",
    subject: "Computer Networks",
    priority: "medium",
    estimatedTime: 75,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Frontend UI Practice",
    description: "Create one responsive dashboard component using Tailwind CSS.",
    category: "assignment",
    subject: "Frontend Development",
    priority: "medium",
    estimatedTime: 90,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Mock Interview Preparation",
    description: "Practice HR and technical interview questions.",
    category: "exam-prep",
    subject: "Placements",
    priority: "high",
    estimatedTime: 60,
    recurring: false,
    recurringType: "none"
  },
  {
    title: "Prepare Notes for Tomorrow Classes",
    description: "Organize lecture notes and prepare important questions.",
    category: "study",
    subject: "Academics",
    priority: "low",
    estimatedTime: 30,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Practice SQL Queries",
    description: "Write and test joins, triggers, stored procedures, and nested queries.",
    category: "coding",
    subject: "SQL",
    priority: "medium",
    estimatedTime: 60,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Deep Work Session",
    description: "2-hour distraction-free focused study session.",
    category: "study",
    subject: "Productivity",
    priority: "high",
    estimatedTime: 120,
    recurring: true,
    recurringType: "daily"
  },
  {
    title: "Review Previous Year Question Papers",
    description: "Analyze important university exam questions and patterns.",
    category: "exam-prep",
    subject: "University Preparation",
    priority: "medium",
    estimatedTime: 90,
    recurring: false,
    recurringType: "none"
  }
];

// Create Default Tasks for New User
export const createDefaultTasks = async (userId) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day

    const taskPromises = defaultTasks.map(taskData => {
      return createTask(userId, {
        ...taskData,
        dueDate: today.toISOString()
      });
    });

    await Promise.all(taskPromises);
    console.log(`Created ${defaultTasks.length} default tasks for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error creating default tasks:', error);
    throw error;
  }
};

// Calculate Task Statistics
export const calculateTaskStats = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // By category
  const byCategory = {};
  taskCategories.forEach(cat => {
    const categoryTasks = tasks.filter(t => t.category === cat.id);
    byCategory[cat.id] = {
      total: categoryTasks.length,
      completed: categoryTasks.filter(t => t.completed).length
    };
  });

  // By priority
  const byPriority = {};
  priorityLevels.forEach(pri => {
    const priorityTasks = tasks.filter(t => t.priority === pri.id);
    byPriority[pri.id] = {
      total: priorityTasks.length,
      completed: priorityTasks.filter(t => t.completed).length
    };
  });

  return {
    total,
    completed,
    pending,
    completionRate,
    byCategory,
    byPriority
  };
};

// Get Task Insights
export const getTaskInsights = (tasks) => {
  const insights = [];

  // Completion rate insight
  const stats = calculateTaskStats(tasks);
  if (stats.completionRate >= 80) {
    insights.push({
      type: 'success',
      message: `Excellent! You're completing ${stats.completionRate}% of your tasks.`
    });
  } else if (stats.completionRate >= 50) {
    insights.push({
      type: 'info',
      message: `You're completing ${stats.completionRate}% of tasks. Keep pushing!`
    });
  } else if (stats.completionRate > 0) {
    insights.push({
      type: 'warning',
      message: `Only ${stats.completionRate}% completion rate. Try breaking tasks into smaller chunks.`
    });
  }

  // Category insights
  const categoryStats = Object.entries(stats.byCategory);
  const bestCategory = categoryStats.reduce((best, [cat, data]) => {
    const rate = data.total > 0 ? (data.completed / data.total) : 0;
    return rate > best.rate ? { cat, rate, data } : best;
  }, { cat: null, rate: 0, data: null });

  if (bestCategory.cat && bestCategory.rate > 0.7) {
    const catName = taskCategories.find(c => c.id === bestCategory.cat)?.name;
    insights.push({
      type: 'success',
      message: `You excel at ${catName} tasks! ${Math.round(bestCategory.rate * 100)}% completion rate.`
    });
  }

  // Recurring task insight
  const recurringTasks = tasks.filter(t => t.recurring);
  if (recurringTasks.length > 0) {
    const recurringCompleted = recurringTasks.filter(t => t.completed).length;
    const recurringRate = Math.round((recurringCompleted / recurringTasks.length) * 100);
    insights.push({
      type: 'info',
      message: `${recurringRate}% of your daily habits are completed. Consistency is key!`
    });
  }

  return insights;
};
