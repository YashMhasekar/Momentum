import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ANALYTICS SERVICE - College-level Analytics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get comprehensive analytics for a college
 * @param {string} collegeName - College name
 * @returns {Object} - College analytics data
 */
export async function getCollegeAnalytics(collegeName) {
  try {
    console.log('📊 Fetching analytics for college:', collegeName);

    // Get all students from the college (try both field names for compatibility)
    const studentsRef = collection(db, 'users');

    // Query for students with 'college' field
    const studentsQuery1 = query(
      studentsRef,
      where('role', '==', 'student'),
      where('college', '==', collegeName)
    );

    // Query for students with 'collegeName' field
    const studentsQuery2 = query(
      studentsRef,
      where('role', '==', 'student'),
      where('collegeName', '==', collegeName)
    );

    // Execute both queries
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(studentsQuery1),
      getDocs(studentsQuery2)
    ]);

    const students = [];
    const studentIds = new Set();

    // Combine results from both queries (avoid duplicates)
    snapshot1.forEach((doc) => {
      if (!studentIds.has(doc.id)) {
        students.push({ id: doc.id, ...doc.data() });
        studentIds.add(doc.id);
      }
    });

    snapshot2.forEach((doc) => {
      if (!studentIds.has(doc.id)) {
        students.push({ id: doc.id, ...doc.data() });
        studentIds.add(doc.id);
      }
    });

    console.log('✅ Found students:', students.length);

    // Calculate active today (students with activity in last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeToday = students.filter(student => {
      const lastActive = student.updatedAt?.toDate?.() || student.lastActive?.toDate?.();
      return lastActive && lastActive >= yesterday;
    }).length;

    console.log('✅ Active today:', activeToday);

    // Get stress analytics for all students
    const stressRef = collection(db, 'stressAnalytics');
    const stressQuery = query(
      stressRef,
      orderBy('timestamp', 'desc'),
      limit(1000)
    );

    const stressSnapshot = await getDocs(stressQuery);
    const allStressData = [];

    stressSnapshot.forEach((doc) => {
      const data = doc.data();
      allStressData.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate()
      });
    });

    // Filter stress data for college students
    const studentIdsArray = Array.from(studentIds);
    const collegeStressData = allStressData.filter(s => studentIdsArray.includes(s.userId));

    console.log('✅ Stress data points:', collegeStressData.length);

    // Calculate analytics
    const analytics = {
      totalStudents: students.length,
      students: students, // Include students array
      activeToday: activeToday, // Include active today count
      stressAnalytics: collegeStressData,
      studentStats: calculateStudentStats(students),
      stressDistribution: calculateStressDistribution(collegeStressData),
      departmentStats: calculateDepartmentStats(students, collegeStressData),
      recentAlerts: getRecentAlerts(collegeStressData, students),
      trends: calculateTrends(collegeStressData)
    };

    console.log('✅ Analytics calculated successfully');

    return analytics;
  } catch (error) {
    console.error('❌ Error fetching college analytics:', error);
    return {
      totalStudents: 0,
      students: [], // Include empty students array
      activeToday: 0, // Include active today count
      stressAnalytics: [],
      studentStats: {},
      stressDistribution: {},
      departmentStats: [],
      recentAlerts: [],
      trends: {}
    };
  }
}

/**
 * Calculate student statistics
 * @param {Array} students - Array of student objects
 * @returns {Object} - Student statistics
 */
function calculateStudentStats(students) {
  if (students.length === 0) {
    return {
      avgMomentumScore: 0,
      avgStreak: 0,
      totalStudyHours: 0,
      activeStudents: 0
    };
  }

  const totalMomentum = students.reduce((sum, s) => sum + (s.momentumScore || 0), 0);
  const totalStreak = students.reduce((sum, s) => sum + (s.streak || 0), 0);
  const totalHours = students.reduce((sum, s) => sum + (s.totalStudyHours || 0), 0);
  const activeStudents = students.filter(s => (s.streak || 0) > 0).length;

  return {
    avgMomentumScore: Math.round(totalMomentum / students.length),
    avgStreak: Math.round(totalStreak / students.length),
    totalStudyHours: Math.round(totalHours),
    activeStudents
  };
}

/**
 * Calculate stress distribution
 * @param {Array} stressData - Array of stress analytics
 * @returns {Object} - Stress level distribution
 */
function calculateStressDistribution(stressData) {
  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  stressData.forEach(data => {
    const level = data.stressLevel || 'low';
    if (distribution.hasOwnProperty(level)) {
      distribution[level]++;
    }
  });

  return distribution;
}

/**
 * Calculate department-wise statistics
 * @param {Array} students - Array of students
 * @param {Array} stressData - Array of stress analytics
 * @returns {Array} - Department statistics
 */
function calculateDepartmentStats(students, stressData) {
  const deptMap = {};

  students.forEach(student => {
    const dept = student.department || 'Unknown';
    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        studentCount: 0,
        avgMomentumScore: 0,
        avgStressScore: 0,
        highStressCount: 0,
        totalMomentum: 0,
        totalStress: 0,
        stressCount: 0
      };
    }

    deptMap[dept].studentCount++;
    deptMap[dept].totalMomentum += student.momentumScore || 0;
  });

  // Add stress data
  stressData.forEach(data => {
    const student = students.find(s => s.id === data.userId);
    if (student) {
      const dept = student.department || 'Unknown';
      if (deptMap[dept]) {
        deptMap[dept].totalStress += data.stressScore || 0;
        deptMap[dept].stressCount++;
        if ((data.stressScore || 0) >= 61) {
          deptMap[dept].highStressCount++;
        }
      }
    }
  });

  // Calculate averages
  Object.values(deptMap).forEach(dept => {
    if (dept.studentCount > 0) {
      dept.avgMomentumScore = Math.round(dept.totalMomentum / dept.studentCount);
    }
    if (dept.stressCount > 0) {
      dept.avgStressScore = Math.round(dept.totalStress / dept.stressCount);
    }
  });

  return Object.values(deptMap);
}

/**
 * Get recent high-stress alerts
 * @param {Array} stressData - Array of stress analytics
 * @param {Array} students - Array of students
 * @returns {Array} - Recent alerts
 */
function getRecentAlerts(stressData, students) {
  const highStressData = stressData
    .filter(data => (data.stressScore || 0) >= 61)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10);

  return highStressData.map(data => {
    const student = students.find(s => s.id === data.userId);
    return {
      id: data.id,
      studentName: student?.fullName || 'Unknown Student',
      studentId: data.userId,
      department: student?.department || 'Unknown',
      stressScore: data.stressScore || 0,
      stressLevel: data.stressLevel || 'medium',
      timestamp: data.timestamp,
      keywords: data.keywords || [],
      urgencyLevel: data.urgencyLevel || 'medium'
    };
  });
}

/**
 * Calculate stress trends over time
 * @param {Array} stressData - Array of stress analytics
 * @returns {Object} - Trend data
 */
function calculateTrends(stressData) {
  if (stressData.length === 0) {
    return {
      weeklyTrend: [],
      overallTrend: 'stable'
    };
  }

  // Group by week
  const weeklyData = {};
  const now = new Date();

  stressData.forEach(data => {
    if (!data.timestamp) return;

    const daysDiff = Math.floor((now - data.timestamp) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(daysDiff / 7);

    if (weekNum < 4) { // Last 4 weeks
      if (!weeklyData[weekNum]) {
        weeklyData[weekNum] = {
          week: `Week ${4 - weekNum}`,
          totalScore: 0,
          count: 0,
          avgScore: 0
        };
      }
      weeklyData[weekNum].totalScore += data.stressScore || 0;
      weeklyData[weekNum].count++;
    }
  });

  // Calculate averages
  const weeklyTrend = Object.values(weeklyData).map(week => {
    week.avgScore = week.count > 0 ? Math.round(week.totalScore / week.count) : 0;
    return week;
  }).sort((a, b) => a.week.localeCompare(b.week));

  // Determine overall trend
  let overallTrend = 'stable';
  if (weeklyTrend.length >= 2) {
    const recent = weeklyTrend[weeklyTrend.length - 1].avgScore;
    const previous = weeklyTrend[weeklyTrend.length - 2].avgScore;
    const diff = recent - previous;

    if (diff > 10) overallTrend = 'increasing';
    else if (diff < -10) overallTrend = 'decreasing';
  }

  return {
    weeklyTrend,
    overallTrend
  };
}

/**
 * Get student stress history
 * @param {string} studentId - Student ID
 * @param {number} days - Number of days to fetch
 * @returns {Array} - Student stress history
 */
export async function getStudentStressHistory(studentId, days = 30) {
  try {
    const stressRef = collection(db, 'stressAnalytics');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const q = query(
      stressRef,
      where('userId', '==', studentId),
      where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const history = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate()
      });
    });

    return history;
  } catch (error) {
    console.error('Error fetching student stress history:', error);
    return [];
  }
}

/**
 * Get department analytics
 * @param {string} collegeName - College name
 * @param {string} department - Department name
 * @returns {Object} - Department analytics
 */
export async function getDepartmentAnalytics(collegeName, department) {
  try {
    const studentsRef = collection(db, 'users');
    const q = query(
      studentsRef,
      where('role', '==', 'student'),
      where('collegeName', '==', collegeName),
      where('department', '==', department)
    );

    const querySnapshot = await getDocs(q);
    const students = [];

    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    // Get stress data for these students
    const studentIds = students.map(s => s.id);
    const stressRef = collection(db, 'stressAnalytics');
    const stressQuery = query(
      stressRef,
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const stressSnapshot = await getDocs(stressQuery);
    const stressData = [];

    stressSnapshot.forEach((doc) => {
      const data = doc.data();
      if (studentIds.includes(data.userId)) {
        stressData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      }
    });

    return {
      students,
      stressData,
      stats: calculateStudentStats(students),
      stressDistribution: calculateStressDistribution(stressData),
      recentAlerts: getRecentAlerts(stressData, students)
    };
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    return {
      students: [],
      stressData: [],
      stats: {},
      stressDistribution: {},
      recentAlerts: []
    };
  }
}

export default {
  getCollegeAnalytics,
  getStudentStressHistory,
  getDepartmentAnalytics
};
