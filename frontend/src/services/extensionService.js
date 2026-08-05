// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION SERVICE - Frontend API for Chrome Extension Data
// ═══════════════════════════════════════════════════════════════════════════

const EXTENSION_API_BASE = 'http://localhost:5000/api';

/**
 * Fetch all extension data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of extension activity records
 */
export async function getExtensionData(userId) {
  try {
    const response = await fetch(`${EXTENSION_API_BASE}/get-extension-data/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.warn('⚠️ Extension data unavailable (backend not running)');
    return [];
  }
}

/**
 * Get today's analytics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Today's analytics with times in SECONDS
 */
export async function getTodayAnalytics(userId) {
  try {
    const response = await fetch(`${EXTENSION_API_BASE}/get-today-analytics/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Ensure times are in seconds (backend should return seconds)
      return {
        ...result.analytics,
        totalStudyTime: result.analytics.totalStudyTime || 0, // in seconds
        totalDistractionTime: result.analytics.totalDistractionTime || 0, // in seconds
      };
    }

    return getEmptyAnalytics();
  } catch (error) {
    console.warn('⚠️ Today analytics unavailable (backend not running)');
    return getEmptyAnalytics();
  }
}

/**
 * Get weekly analytics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Weekly analytics array with daily data
 */
export async function getWeeklyAnalytics(userId) {
  try {
    const response = await fetch(`${EXTENSION_API_BASE}/get-weekly-analytics/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && Array.isArray(result.analytics)) {
      // Ensure each day has focusScore calculated
      return result.analytics.map(day => ({
        ...day,
        studyTime: day.studyTime || 0, // in hours (for charts)
        distractionTime: day.distractionTime || 0, // in hours (for charts)
        focusScore: day.focusScore || calculateFocusScoreFromHours(day.studyTime, day.distractionTime)
      }));
    }

    return [];
  } catch (error) {
    console.warn('⚠️ Weekly analytics unavailable (backend not running)');
    return [];
  }
}

/**
 * Calculate focus score from hours
 * @param {number} studyHours - Study time in hours
 * @param {number} distractionHours - Distraction time in hours
 * @returns {number} - Focus score (0-100)
 */
function calculateFocusScoreFromHours(studyHours, distractionHours) {
  const totalHours = studyHours + distractionHours;
  if (totalHours === 0) return 0;
  return Math.round((studyHours / totalHours) * 100);
}

/**
 * Get admin analytics by college name
 * @param {string} collegeName - College name
 * @returns {Promise<Object>} - Admin analytics
 */
export async function getAdminAnalytics(collegeName) {
  try {
    // Check if backend is available first
    const backendAvailable = await checkBackendStatus();
    if (!backendAvailable) {
      console.warn('⚠️ Backend server is not running. Extension analytics will not be available.');
      return getEmptyAdminAnalytics();
    }

    const response = await fetch(`${EXTENSION_API_BASE}/get-admin-analytics/${encodeURIComponent(collegeName)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.analytics : getEmptyAdminAnalytics();
  } catch (error) {
    console.warn('⚠️ Extension analytics unavailable (backend not running):', error.message);
    return getEmptyAdminAnalytics();
  }
}

/**
 * Get top platforms for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of platforms to return
 * @returns {Promise<Array>} - Array of top platforms
 */
export async function getTopPlatforms(userId, limit = 5) {
  try {
    const data = await getExtensionData(userId);

    if (!data || data.length === 0) {
      return [];
    }

    // Aggregate all study websites
    const platformMap = {};

    data.forEach(session => {
      if (session.study) {
        Object.entries(session.study).forEach(([url, time]) => {
          if (!platformMap[url]) {
            platformMap[url] = {
              url,
              totalTime: 0,
              visitCount: 0
            };
          }
          platformMap[url].totalTime += time / 3600; // Convert to hours
          platformMap[url].visitCount += 1;
        });
      }
    });

    // Sort by total time and return top N
    return Object.values(platformMap)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  } catch (error) {
    console.warn('⚠️ Top platforms unavailable (backend not running)');
    return [];
  }
}

/**
 * Get today's activities for timeline
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of activities
 */
export async function getTodayActivities(userId) {
  try {
    const data = await getExtensionData(userId);

    if (!data || data.length === 0) {
      return [];
    }

    // Filter today's data
    const today = new Date().toISOString().split('T')[0];
    const todayData = data.filter(session => {
      const sessionDate = new Date(session.createdAt).toISOString().split('T')[0];
      return sessionDate === today;
    });

    // Convert to activity timeline format
    const activities = [];

    todayData.forEach(session => {
      // Add study activities
      if (session.study) {
        Object.entries(session.study).forEach(([url, time]) => {
          activities.push({
            id: `${session.id}-study-${url}`,
            type: 'study',
            title: getPlatformName(url),
            url,
            duration: time / 60, // Convert to minutes
            timestamp: session.createdAt,
            subject: session.subject
          });
        });
      }

      // Add distraction activities
      if (session.distraction) {
        Object.entries(session.distraction).forEach(([url, time]) => {
          activities.push({
            id: `${session.id}-distraction-${url}`,
            type: 'distraction',
            title: getPlatformName(url),
            url,
            duration: time / 60, // Convert to minutes
            timestamp: session.createdAt,
            subject: session.subject
          });
        });
      }
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.warn('⚠️ Today activities unavailable (backend not running)');
    return [];
  }
}

/**
 * Get platform name from URL
 * @param {string} url - Website URL
 * @returns {string} - Platform name
 */
function getPlatformName(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('leetcode')) return 'LeetCode';
  if (urlLower.includes('geeksforgeeks')) return 'GeeksforGeeks';
  if (urlLower.includes('youtube')) return 'YouTube';
  if (urlLower.includes('github')) return 'GitHub';
  if (urlLower.includes('stackoverflow')) return 'Stack Overflow';
  if (urlLower.includes('chatgpt')) return 'ChatGPT';
  if (urlLower.includes('openai')) return 'OpenAI';
  if (urlLower.includes('w3schools')) return 'W3Schools';
  if (urlLower.includes('mdn')) return 'MDN Web Docs';
  if (urlLower.includes('coursera')) return 'Coursera';
  if (urlLower.includes('udemy')) return 'Udemy';
  if (urlLower.includes('twitter')) return 'Twitter';
  if (urlLower.includes('facebook')) return 'Facebook';
  if (urlLower.includes('instagram')) return 'Instagram';
  if (urlLower.includes('reddit')) return 'Reddit';
  if (urlLower.includes('netflix')) return 'Netflix';

  // Extract domain name
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch {
    return url;
  }
}

/**
 * Calculate study hours from seconds
 * @param {number} seconds - Time in seconds
 * @returns {number} - Hours (rounded to 2 decimals)
 */
export function secondsToHours(seconds) {
  return parseFloat((seconds / 3600).toFixed(2));
}

/**
 * Calculate minutes from seconds
 * @param {number} seconds - Time in seconds
 * @returns {number} - Minutes (rounded)
 */
export function secondsToMinutes(seconds) {
  return Math.round(seconds / 60);
}

/**
 * Format time duration (DEPRECATED - use timeFormatter.js instead)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 * @deprecated Use formatStudyTime from utils/timeFormatter.js instead
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Get productivity level label
 * @param {number} ratio - Productivity ratio (0-100)
 * @returns {Object} - Level info
 */
export function getProductivityLevel(ratio) {
  if (ratio >= 80) {
    return {
      label: 'Excellent',
      color: '#10b981',
      emoji: '🔥',
      description: 'Outstanding productivity!'
    };
  } else if (ratio >= 60) {
    return {
      label: 'Good',
      color: '#3b82f6',
      emoji: '👍',
      description: 'Good focus and productivity'
    };
  } else if (ratio >= 40) {
    return {
      label: 'Fair',
      color: '#f59e0b',
      emoji: '⚠️',
      description: 'Room for improvement'
    };
  } else {
    return {
      label: 'Needs Improvement',
      color: '#ef4444',
      emoji: '📉',
      description: 'Try to minimize distractions'
    };
  }
}

/**
 * Get empty analytics object (fallback)
 */
function getEmptyAnalytics() {
  return {
    totalStudyTime: 0,
    totalDistractionTime: 0,
    productivityRatio: 0,
    studyHours: '0.00',
    distractionHours: '0.00',
    topStudyWebsites: [],
    topDistractionWebsites: [],
    timeline: [],
    sessionsCount: 0
  };
}

/**
 * Get empty weekly analytics object (fallback)
 */
function getEmptyWeeklyAnalytics() {
  return {
    totalStudyTime: 0,
    totalDistractionTime: 0,
    productivityRatio: 0,
    studyHours: '0.00',
    distractionHours: '0.00',
    dailyData: [],
    topStudyWebsites: [],
    topDistractionWebsites: [],
    totalSessions: 0
  };
}

/**
 * Get empty admin analytics object (fallback)
 */
function getEmptyAdminAnalytics() {
  return {
    totalUsers: 0,
    totalStudyTime: 0,
    totalDistractionTime: 0,
    avgStudyHours: 0,
    avgProductivityRatio: 0,
    avgProductivity: 0,
    totalSessions: 0,
    topPlatforms: [],
    departmentProductivity: [],
    userStats: []
  };
}

/**
 * Get study streak from daily data
 * @param {Array} dailyData - Array of daily analytics
 * @returns {number} - Current streak
 */
export function calculateStudyStreak(dailyData) {
  if (!dailyData || dailyData.length === 0) return 0;

  let streak = 0;
  const sortedData = [...dailyData].sort((a, b) => b.date.localeCompare(a.date));

  for (const day of sortedData) {
    if (day.studyTime > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get productivity trend
 * @param {Array} dailyData - Array of daily analytics
 * @returns {string} - Trend direction (up, down, stable)
 */
export function getProductivityTrend(dailyData) {
  if (!dailyData || dailyData.length < 2) return 'stable';

  const sortedData = [...dailyData].sort((a, b) => a.date.localeCompare(b.date));
  const recentDays = sortedData.slice(-3);
  const olderDays = sortedData.slice(-6, -3);

  if (olderDays.length === 0) return 'stable';

  const recentAvg = recentDays.reduce((sum, d) => sum + d.productivityRatio, 0) / recentDays.length;
  const olderAvg = olderDays.reduce((sum, d) => sum + d.productivityRatio, 0) / olderDays.length;

  const difference = recentAvg - olderAvg;

  if (difference > 10) return 'up';
  if (difference < -10) return 'down';
  return 'stable';
}

/**
 * Get most productive time of day
 * @param {Array} timeline - Timeline data
 * @returns {string} - Time period
 */
export function getMostProductiveTime(timeline) {
  if (!timeline || timeline.length === 0) return 'N/A';

  const timeSlots = {
    morning: 0,   // 6-12
    afternoon: 0, // 12-18
    evening: 0,   // 18-24
    night: 0      // 0-6
  };

  timeline.forEach(entry => {
    if (!entry.time) return;

    const hour = new Date(entry.time).getHours();
    const studyTime = entry.studyTime || 0;

    if (hour >= 6 && hour < 12) timeSlots.morning += studyTime;
    else if (hour >= 12 && hour < 18) timeSlots.afternoon += studyTime;
    else if (hour >= 18 && hour < 24) timeSlots.evening += studyTime;
    else timeSlots.night += studyTime;
  });

  const maxSlot = Object.entries(timeSlots).reduce((max, [slot, time]) =>
    time > max.time ? { slot, time } : max,
    { slot: 'morning', time: 0 }
  );

  return maxSlot.slot.charAt(0).toUpperCase() + maxSlot.slot.slice(1);
}

/**
 * Get website category icon
 * @param {string} website - Website name
 * @returns {string} - Emoji icon
 */
export function getWebsiteIcon(website) {
  const lowerSite = website.toLowerCase();

  if (lowerSite.includes('leetcode')) return '💻';
  if (lowerSite.includes('github')) return '🐙';
  if (lowerSite.includes('stackoverflow')) return '📚';
  if (lowerSite.includes('youtube')) return '📺';
  if (lowerSite.includes('chatgpt') || lowerSite.includes('openai')) return '🤖';
  if (lowerSite.includes('geeksforgeeks')) return '👨‍💻';
  if (lowerSite.includes('coursera') || lowerSite.includes('udemy')) return '🎓';
  if (lowerSite.includes('medium') || lowerSite.includes('dev.to')) return '📝';
  if (lowerSite.includes('twitter') || lowerSite.includes('facebook')) return '📱';
  if (lowerSite.includes('netflix') || lowerSite.includes('prime')) return '🎬';
  if (lowerSite.includes('instagram')) return '📷';
  if (lowerSite.includes('reddit')) return '🔴';

  return '🌐';
}

/**
 * Check if backend is available
 * @returns {Promise<boolean>} - True if backend is online
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch('http://localhost:5000/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.status === 'online';
    }

    return false;
  } catch (error) {
    // Silently fail - backend not available
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  getExtensionData,
  getTodayAnalytics,
  getWeeklyAnalytics,
  getAdminAnalytics,
  getTopPlatforms,
  getTodayActivities,
  secondsToHours,
  secondsToMinutes,
  formatDuration,
  getProductivityLevel,
  calculateStudyStreak,
  getProductivityTrend,
  getMostProductiveTime,
  getWebsiteIcon,
  checkBackendStatus
};
