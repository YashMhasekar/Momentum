import axios from 'axios';

const AI_SERVICE_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = 'http://localhost:5000/api';

/**
 * Detect emotion from webcam image
 * @param {string} userId - User ID
 * @param {string} imageData - Base64 encoded image
 * @param {string} sessionType - Type of session (study, focus, general)
 * @returns {Promise<Object>} - Emotion detection result
 */
export async function detectEmotion(userId, imageData, sessionType = 'study') {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/detect-emotion`, {
            userId,
            imageData,
            sessionType
        });

        return response.data;
    } catch (error) {
        console.error('Error detecting emotion:', error);
        throw error;
    }
}

/**
 * Analyze complete emotion session
 * @param {string} userId - User ID
 * @param {Array<string>} emotions - Array of detected emotions
 * @param {string} sessionType - Type of session
 * @returns {Promise<Object>} - Session analysis
 */
export async function analyzeEmotionSession(userId, emotions, sessionType = 'study') {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/analyze-emotion-session`, {
            userId,
            emotions,
            sessionType
        });

        return response.data;
    } catch (error) {
        console.error('Error analyzing emotion session:', error);
        throw error;
    }
}

/**
 * Save emotion session to Firestore
 * @param {Object} sessionData - Session data to save
 * @returns {Promise<Object>} - Save result
 */
export async function saveEmotionSession(sessionData) {
    try {
        const response = await axios.post(`${BACKEND_URL}/emotion/save-session`, sessionData);
        return response.data;
    } catch (error) {
        console.error('Error saving emotion session:', error);
        throw error;
    }
}

/**
 * Get emotion history for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default: 7)
 * @returns {Promise<Array>} - Emotion history
 */
export async function getEmotionHistory(userId, days = 7) {
    try {
        const response = await axios.get(`${BACKEND_URL}/emotion/history/${userId}`, {
            params: { days }
        });
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching emotion history:', error);
        return [];
    }
}

/**
 * Get emotion analytics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to analyze (default: 7)
 * @returns {Promise<Object>} - Emotion analytics
 */
export async function getEmotionAnalytics(userId, days = 7) {
    try {
        const response = await axios.get(`${BACKEND_URL}/emotion/analytics/${userId}`, {
            params: { days }
        });
        return response.data.analytics || {};
    } catch (error) {
        console.error('Error fetching emotion analytics:', error);
        return {
            totalSessions: 0,
            avgWellnessScore: 0,
            mostCommonEmotion: 'neutral',
            emotionDistribution: {},
            dailyTrend: []
        };
    }
}

/**
 * Get emotion emoji representation
 * @param {string} emotion - Emotion name
 * @returns {string} - Emoji
 */
export function getEmotionEmoji(emotion) {
    const emojiMap = {
        happy: '😊',
        sad: '😢',
        angry: '😠',
        fear: '😰',
        surprise: '😲',
        disgust: '😖',
        neutral: '😐'
    };
    return emojiMap[emotion] || '😐';
}

/**
 * Get emotion color
 * @param {string} emotion - Emotion name
 * @returns {string} - Color hex code
 */
export function getEmotionColor(emotion) {
    const colorMap = {
        happy: '#10b981',
        sad: '#3b82f6',
        angry: '#ef4444',
        fear: '#f59e0b',
        surprise: '#8b5cf6',
        disgust: '#6b7280',
        neutral: '#6366f1'
    };
    return colorMap[emotion] || '#6366f1';
}

/**
 * Get wellness level info
 * @param {number} score - Wellness score (0-100)
 * @returns {Object} - Wellness level info
 */
export function getWellnessLevelInfo(score) {
    if (score >= 80) {
        return {
            level: 'excellent',
            label: 'Excellent',
            color: '#10b981',
            emoji: '🌟',
            description: 'You\'re in an optimal emotional state for learning!'
        };
    } else if (score >= 60) {
        return {
            level: 'good',
            label: 'Good',
            color: '#3b82f6',
            emoji: '😊',
            description: 'Your emotional state is positive and conducive to studying.'
        };
    } else if (score >= 40) {
        return {
            level: 'moderate',
            label: 'Moderate',
            color: '#f59e0b',
            emoji: '😐',
            description: 'Consider taking breaks to maintain your emotional wellbeing.'
        };
    } else {
        return {
            level: 'needs_attention',
            label: 'Needs Attention',
            color: '#ef4444',
            emoji: '😔',
            description: 'Your emotional state suggests you need self-care and rest.'
        };
    }
}

/**
 * Calculate emotion trend
 * @param {Array} dailyData - Daily emotion data
 * @returns {string} - Trend direction (improving, stable, declining)
 */
export function calculateEmotionTrend(dailyData) {
    if (!dailyData || dailyData.length < 2) return 'stable';

    const recentData = dailyData.slice(-3);
    const avgRecent = recentData.reduce((sum, day) => sum + day.avgWellness, 0) / recentData.length;

    const olderData = dailyData.slice(0, -3);
    if (olderData.length === 0) return 'stable';

    const avgOlder = olderData.reduce((sum, day) => sum + day.avgWellness, 0) / olderData.length;

    const difference = avgRecent - avgOlder;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
}
