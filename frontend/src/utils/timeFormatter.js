// ═══════════════════════════════════════════════════════════════════════════
// TIME FORMATTER UTILITY
// ═══════════════════════════════════════════════════════════════════════════
// Provides consistent time formatting across the entire dashboard
// Converts seconds to human-readable format: "2h 31m", "45m", "1h 12m 30s"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format seconds into human-readable time string
 * @param {number} seconds - Time in seconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.showSeconds - Include seconds in output (default: false)
 * @param {boolean} options.compact - Use compact format without spaces (default: false)
 * @param {boolean} options.verbose - Use full words (hours, minutes) instead of abbreviations (default: false)
 * @returns {string} - Formatted time string
 * 
 * @example
 * formatStudyTime(7200) // "2h"
 * formatStudyTime(7260) // "2h 1m"
 * formatStudyTime(7265, { showSeconds: true }) // "2h 1m 5s"
 * formatStudyTime(45) // "45s"
 * formatStudyTime(0) // "0m"
 */
export function formatStudyTime(seconds, options = {}) {
  const {
    showSeconds = false,
    compact = false,
    verbose = false
  } = options;

  // Handle invalid input
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return verbose ? '0 minutes' : '0m';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  const separator = compact ? '' : ' ';

  // Add hours
  if (hours > 0) {
    if (verbose) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    } else {
      parts.push(`${hours}h`);
    }
  }

  // Add minutes
  if (minutes > 0 || (hours > 0 && secs > 0 && showSeconds)) {
    if (verbose) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    } else {
      parts.push(`${minutes}m`);
    }
  }

  // Add seconds
  if (showSeconds && secs > 0) {
    if (verbose) {
      parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
    } else {
      parts.push(`${secs}s`);
    }
  }

  // Handle zero time
  if (parts.length === 0) {
    if (showSeconds) {
      return verbose ? '0 seconds' : '0s';
    }
    return verbose ? '0 minutes' : '0m';
  }

  return parts.join(separator);
}

/**
 * Format duration (alias for formatStudyTime for backward compatibility)
 * @param {number} seconds - Time in seconds
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export function formatDuration(seconds, options = {}) {
  return formatStudyTime(seconds, options);
}

/**
 * Convert seconds to hours (decimal)
 * @param {number} seconds - Time in seconds
 * @returns {number} - Hours with 2 decimal places
 */
export function secondsToHours(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return 0;
  }
  return parseFloat((seconds / 3600).toFixed(2));
}

/**
 * Convert seconds to minutes (rounded)
 * @param {number} seconds - Time in seconds
 * @returns {number} - Minutes (rounded)
 */
export function secondsToMinutes(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return 0;
  }
  return Math.round(seconds / 60);
}

/**
 * Calculate focus score percentage
 * Focus Score = studyTime / (studyTime + distractionTime) * 100
 * @param {number} studySeconds - Study time in seconds
 * @param {number} distractionSeconds - Distraction time in seconds
 * @returns {number} - Focus score percentage (0-100)
 */
export function calculateFocusScore(studySeconds, distractionSeconds) {
  const totalTime = studySeconds + distractionSeconds;
  
  if (totalTime === 0) {
    return 0;
  }
  
  const focusScore = (studySeconds / totalTime) * 100;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(focusScore)));
}

/**
 * Calculate productivity ratio (0-1)
 * @param {number} studySeconds - Study time in seconds
 * @param {number} distractionSeconds - Distraction time in seconds
 * @returns {number} - Productivity ratio (0.00 to 1.00)
 */
export function calculateProductivityRatio(studySeconds, distractionSeconds) {
  const totalTime = studySeconds + distractionSeconds;
  
  if (totalTime === 0) {
    return 0;
  }
  
  const ratio = studySeconds / totalTime;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, parseFloat(ratio.toFixed(2))));
}

/**
 * Format time for chart tooltips
 * @param {number} value - Time value (can be hours or seconds depending on context)
 * @param {string} unit - Unit of the value ('hours' or 'seconds')
 * @returns {string} - Formatted string for tooltip
 */
export function formatChartTooltip(value, unit = 'hours') {
  if (unit === 'seconds') {
    return formatStudyTime(value);
  }
  
  // Assume hours
  const seconds = value * 3600;
  return formatStudyTime(seconds);
}

/**
 * Format percentage with proper clamping
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(value, decimals = 0) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  // Clamp between 0 and 100
  const clamped = Math.max(0, Math.min(100, value));
  
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Get productivity level label and color
 * @param {number} percentage - Productivity percentage (0-100)
 * @returns {Object} - Level info with label, color, emoji, description
 */
export function getProductivityLevel(percentage) {
  if (percentage >= 80) {
    return {
      label: 'Excellent',
      color: '#10b981',
      bgColor: 'bg-green-500',
      emoji: '🔥',
      description: 'Outstanding productivity!'
    };
  } else if (percentage >= 60) {
    return {
      label: 'Good',
      color: '#3b82f6',
      bgColor: 'bg-blue-500',
      emoji: '👍',
      description: 'Good focus and productivity'
    };
  } else if (percentage >= 40) {
    return {
      label: 'Fair',
      color: '#f59e0b',
      bgColor: 'bg-yellow-500',
      emoji: '⚠️',
      description: 'Room for improvement'
    };
  } else {
    return {
      label: 'Needs Improvement',
      color: '#ef4444',
      bgColor: 'bg-red-500',
      emoji: '📉',
      description: 'Try to minimize distractions'
    };
  }
}

/**
 * Format time ago (e.g., "2 hours ago", "5 minutes ago")
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} - Formatted time ago string
 */
export function formatTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffSeconds = Math.floor((now - past) / 1000);

  if (diffSeconds < 60) {
    return 'just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
}

/**
 * Parse time string to seconds (reverse of formatStudyTime)
 * @param {string} timeString - Time string like "2h 30m" or "45m"
 * @returns {number} - Total seconds
 */
export function parseTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return 0;
  }

  let totalSeconds = 0;

  // Match hours
  const hoursMatch = timeString.match(/(\d+)h/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1]) * 3600;
  }

  // Match minutes
  const minutesMatch = timeString.match(/(\d+)m/);
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1]) * 60;
  }

  // Match seconds
  const secondsMatch = timeString.match(/(\d+)s/);
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1]);
  }

  return totalSeconds;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  formatStudyTime,
  formatDuration,
  secondsToHours,
  secondsToMinutes,
  calculateFocusScore,
  calculateProductivityRatio,
  formatChartTooltip,
  formatPercentage,
  getProductivityLevel,
  formatTimeAgo,
  parseTimeString
};
