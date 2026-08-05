// ═══════════════════════════════════════════════════════════════════════════
// SMART STUDY REELS RECOMMENDATION SERVICE
// AI-Powered Controlled Learning Content System
// ═══════════════════════════════════════════════════════════════════════════

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATIONAL KEYWORDS & CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

// Allowed educational categories
export const EDUCATIONAL_CATEGORIES = {
  // Programming & Development
  PROGRAMMING: [
    'javascript', 'python', 'java', 'c++', 'c programming', 'typescript',
    'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask',
    'spring boot', 'html', 'css', 'tailwind', 'bootstrap', 'sass',
    'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'mongodb', 'sql', 'postgresql', 'mysql', 'firebase', 'graphql',
    'rest api', 'microservices', 'devops', 'ci/cd', 'testing', 'jest'
  ],
  
  // Data Structures & Algorithms
  DSA: [
    'data structures', 'algorithms', 'dsa', 'arrays', 'linked list',
    'stack', 'queue', 'tree', 'graph', 'heap', 'hash table', 'sorting',
    'searching', 'dynamic programming', 'greedy', 'backtracking',
    'recursion', 'time complexity', 'space complexity', 'big o notation',
    'leetcode', 'coding interview', 'competitive programming'
  ],
  
  // Computer Science Fundamentals
  CS_FUNDAMENTALS: [
    'operating system', 'os', 'dbms', 'database', 'computer networks',
    'networking', 'cn', 'compiler design', 'theory of computation', 'toc',
    'automata', 'computer architecture', 'digital logic', 'oops', 'oop',
    'object oriented programming', 'system design', 'design patterns'
  ],
  
  // AI & Machine Learning
  AI_ML: [
    'machine learning', 'ml', 'artificial intelligence', 'ai', 'deep learning',
    'neural networks', 'cnn', 'rnn', 'nlp', 'computer vision', 'tensorflow',
    'pytorch', 'keras', 'scikit-learn', 'data science', 'pandas', 'numpy',
    'matplotlib', 'statistics', 'linear algebra', 'calculus'
  ],
  
  // Interview Preparation
  INTERVIEW_PREP: [
    'interview preparation', 'interview questions', 'coding interview',
    'system design interview', 'behavioral interview', 'hr interview',
    'technical interview', 'mock interview', 'resume tips', 'aptitude',
    'logical reasoning', 'verbal ability', 'quantitative aptitude'
  ],
  
  // Web Development
  WEB_DEV: [
    'web development', 'frontend', 'backend', 'full stack', 'responsive design',
    'web design', 'ui ux', 'user interface', 'user experience', 'figma',
    'wireframing', 'prototyping', 'web security', 'authentication', 'jwt'
  ],
  
  // Mobile Development
  MOBILE_DEV: [
    'android', 'ios', 'react native', 'flutter', 'kotlin', 'swift',
    'mobile app development', 'app design', 'mobile ui'
  ],
  
  // Mathematics & Science
  MATH_SCIENCE: [
    'mathematics', 'calculus', 'algebra', 'geometry', 'trigonometry',
    'statistics', 'probability', 'discrete mathematics', 'linear algebra',
    'physics', 'chemistry', 'biology', 'engineering mathematics'
  ],
  
  // Productivity & Skills
  PRODUCTIVITY: [
    'productivity', 'time management', 'study tips', 'learning techniques',
    'note taking', 'memory techniques', 'focus', 'concentration',
    'exam preparation', 'revision techniques', 'speed reading'
  ],
  
  // Business & Management
  BUSINESS: [
    'business', 'management', 'marketing', 'finance', 'accounting',
    'economics', 'entrepreneurship', 'startup', 'leadership', 'communication'
  ]
};

// Blocked non-educational keywords
export const BLOCKED_KEYWORDS = [
  // Entertainment
  'funny', 'comedy', 'meme', 'memes', 'prank', 'pranks', 'joke', 'jokes',
  'entertainment', 'viral', 'trending', 'challenge', 'dance', 'music video',
  
  // Gaming
  'gaming', 'gameplay', 'game', 'fortnite', 'minecraft', 'pubg', 'cod',
  'gta', 'fifa', 'valorant', 'league of legends', 'dota', 'esports',
  
  // Movies & TV
  'movie', 'movies', 'film', 'cinema', 'trailer', 'tv show', 'series',
  'netflix', 'web series', 'episode', 'season', 'actor', 'actress',
  
  // Social Media & Celebrities
  'instagram', 'tiktok', 'snapchat', 'celebrity', 'gossip', 'vlog',
  'lifestyle', 'fashion', 'makeup', 'beauty', 'haul', 'unboxing',
  
  // Sports (non-educational)
  'cricket', 'football', 'soccer', 'basketball', 'sports highlights',
  'match', 'goal', 'player', 'team', 'tournament',
  
  // Other distractions
  'reaction', 'roast', 'drama', 'controversy', 'news', 'politics',
  'food', 'cooking show', 'recipe', 'travel', 'vacation', 'party'
];

// Default fallback topics (always educational)
export const DEFAULT_TOPICS = [
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: '🧮', category: 'DSA' },
  { id: 'web-dev', label: 'Web Development', icon: '🌐', category: 'WEB_DEV' },
  { id: 'react', label: 'React JS', icon: '⚛️', category: 'PROGRAMMING' },
  { id: 'python', label: 'Python Programming', icon: '🐍', category: 'PROGRAMMING' },
  { id: 'java', label: 'Java Programming', icon: '☕', category: 'PROGRAMMING' },
  { id: 'os', label: 'Operating Systems', icon: '💻', category: 'CS_FUNDAMENTALS' },
  { id: 'dbms', label: 'Database Management', icon: '🗄️', category: 'CS_FUNDAMENTALS' },
  { id: 'cn', label: 'Computer Networks', icon: '🌐', category: 'CS_FUNDAMENTALS' },
  { id: 'ai-ml', label: 'AI & Machine Learning', icon: '🤖', category: 'AI_ML' },
  { id: 'interview', label: 'Interview Preparation', icon: '🎯', category: 'INTERVIEW_PREP' },
  { id: 'aptitude', label: 'Aptitude & Reasoning', icon: '🧠', category: 'INTERVIEW_PREP' },
  { id: 'system-design', label: 'System Design', icon: '🏗️', category: 'CS_FUNDAMENTALS' }
];

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate if search query is educational
 * @param {string} searchQuery - User search query
 * @returns {Object} - { isValid, reason, category }
 */
export function validateSearchQuery(searchQuery) {
  const query = searchQuery.toLowerCase().trim();
  
  if (!query) {
    return {
      isValid: false,
      reason: 'Please enter a search term',
      category: null
    };
  }

  // Check if query contains blocked keywords
  for (const blocked of BLOCKED_KEYWORDS) {
    if (query.includes(blocked.toLowerCase())) {
      return {
        isValid: false,
        reason: 'This platform is optimized for learning and productivity. Please search educational topics only.',
        category: null,
        blockedKeyword: blocked
      };
    }
  }

  // Check if query matches educational categories
  let matchedCategory = null;
  let isEducational = false;

  for (const [category, keywords] of Object.entries(EDUCATIONAL_CATEGORIES)) {
    for (const keyword of keywords) {
      if (query.includes(keyword.toLowerCase())) {
        matchedCategory = category;
        isEducational = true;
        break;
      }
    }
    if (isEducational) break;
  }

  // If no match found, check if it's a generic educational term
  const genericEducationalTerms = [
    'tutorial', 'learn', 'course', 'lecture', 'study', 'education',
    'programming', 'coding', 'development', 'engineering', 'science',
    'mathematics', 'computer', 'software', 'technology', 'tech'
  ];

  if (!isEducational) {
    for (const term of genericEducationalTerms) {
      if (query.includes(term)) {
        isEducational = true;
        matchedCategory = 'GENERAL';
        break;
      }
    }
  }

  if (isEducational) {
    return {
      isValid: true,
      reason: 'Valid educational search',
      category: matchedCategory
    };
  }

  // If still no match, reject
  return {
    isValid: false,
    reason: 'Search rejected: Please search for academic or study-related content only.',
    category: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALIZED RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate personalized study recommendations for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of recommended topics
 */
export async function generatePersonalizedRecommendations(userId) {
  try {
    console.log('Generating personalized recommendations for:', userId);
    
    const recommendations = new Set();
    const sources = {
      tasks: [],
      timetable: [],
      github: [],
      aiMentor: [],
      focusSessions: [],
      weakSubjects: []
    };

    // 1. Get recommendations from tasks
    const taskRecommendations = await getRecommendationsFromTasks(userId);
    taskRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.tasks.push(rec);
    });

    // 2. Get recommendations from timetable
    const timetableRecommendations = await getRecommendationsFromTimetable(userId);
    timetableRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.timetable.push(rec);
    });

    // 3. Get recommendations from GitHub skills (if available)
    const githubRecommendations = await getRecommendationsFromGitHub(userId);
    githubRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.github.push(rec);
    });

    // 4. Get recommendations from AI Mentor conversations
    const aiMentorRecommendations = await getRecommendationsFromAIMentor(userId);
    aiMentorRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.aiMentor.push(rec);
    });

    // 5. Get recommendations from focus sessions
    const focusRecommendations = await getRecommendationsFromFocusSessions(userId);
    focusRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.focusSessions.push(rec);
    });

    // 6. Get weak subjects from analytics
    const weakSubjectRecommendations = await getRecommendationsFromWeakSubjects(userId);
    weakSubjectRecommendations.forEach(rec => {
      recommendations.add(rec);
      sources.weakSubjects.push(rec);
    });

    // Convert Set to Array and create topic objects
    const recommendedTopics = Array.from(recommendations).map(keyword => {
      const category = findCategoryForKeyword(keyword);
      const icon = getIconForCategory(category);
      
      return {
        id: keyword.toLowerCase().replace(/\s+/g, '-'),
        label: keyword,
        icon: icon,
        category: category,
        sources: getSourcesForKeyword(keyword, sources)
      };
    });

    console.log('Generated recommendations:', recommendedTopics);

    // If no recommendations, return default topics
    if (recommendedTopics.length === 0) {
      return DEFAULT_TOPICS;
    }

    // Prioritize and limit to top 12 recommendations
    const prioritized = prioritizeRecommendations(recommendedTopics, sources);
    return prioritized.slice(0, 12);

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return DEFAULT_TOPICS;
  }
}

/**
 * Get recommendations from user tasks
 */
async function getRecommendationsFromTasks(userId) {
  try {
    const tasksRef = collection(db, 'assignedTasks');
    const q = query(
      tasksRef,
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const keywords = new Set();

    querySnapshot.forEach((doc) => {
      const task = doc.data();
      
      // Extract keywords from title
      extractEducationalKeywords(task.title).forEach(k => keywords.add(k));
      
      // Extract keywords from description
      if (task.description) {
        extractEducationalKeywords(task.description).forEach(k => keywords.add(k));
      }
      
      // Use category and subject
      if (task.category) keywords.add(task.category);
      if (task.subject) keywords.add(task.subject);
    });

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting task recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations from timetable
 */
async function getRecommendationsFromTimetable(userId) {
  try {
    const timetableRef = collection(db, 'timetables');
    const q = query(timetableRef, where('userId', '==', userId), limit(1));
    
    const querySnapshot = await getDocs(q);
    const keywords = new Set();

    querySnapshot.forEach((doc) => {
      const timetable = doc.data();
      
      if (timetable.schedule) {
        Object.values(timetable.schedule).forEach(day => {
          if (Array.isArray(day)) {
            day.forEach(slot => {
              if (slot.subject) {
                extractEducationalKeywords(slot.subject).forEach(k => keywords.add(k));
              }
            });
          }
        });
      }
    });

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting timetable recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations from GitHub profile
 */
async function getRecommendationsFromGitHub(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return [];
    
    const userData = userDoc.data();
    const keywords = new Set();

    // Extract from GitHub skills
    if (userData.githubSkills && Array.isArray(userData.githubSkills)) {
      userData.githubSkills.forEach(skill => {
        extractEducationalKeywords(skill).forEach(k => keywords.add(k));
      });
    }

    // Extract from GitHub languages
    if (userData.githubLanguages && Array.isArray(userData.githubLanguages)) {
      userData.githubLanguages.forEach(lang => {
        keywords.add(lang);
      });
    }

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting GitHub recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations from AI Mentor conversations
 */
async function getRecommendationsFromAIMentor(userId) {
  try {
    const chatsRef = collection(db, 'aiMentorChats');
    const q = query(
      chatsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const keywords = new Set();

    querySnapshot.forEach((doc) => {
      const chat = doc.data();
      
      if (chat.message) {
        extractEducationalKeywords(chat.message).forEach(k => keywords.add(k));
      }
    });

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting AI Mentor recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations from focus sessions
 */
async function getRecommendationsFromFocusSessions(userId) {
  try {
    const sessionsRef = collection(db, 'focusSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const keywords = new Set();

    querySnapshot.forEach((doc) => {
      const session = doc.data();
      
      if (session.task) {
        extractEducationalKeywords(session.task).forEach(k => keywords.add(k));
      }
      
      if (session.category) {
        keywords.add(session.category);
      }
    });

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting focus session recommendations:', error);
    return [];
  }
}

/**
 * Get recommendations from weak subjects (analytics)
 */
async function getRecommendationsFromWeakSubjects(userId) {
  try {
    const analyticsRef = doc(db, 'analytics', userId);
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (!analyticsDoc.exists()) return [];
    
    const analytics = analyticsDoc.data();
    const keywords = new Set();

    // Extract weak subjects
    if (analytics.weakSubjects && Array.isArray(analytics.weakSubjects)) {
      analytics.weakSubjects.forEach(subject => {
        extractEducationalKeywords(subject).forEach(k => keywords.add(k));
      });
    }

    return Array.from(keywords);
  } catch (error) {
    console.error('Error getting weak subject recommendations:', error);
    return [];
  }
}

/**
 * Extract educational keywords from text
 */
function extractEducationalKeywords(text) {
  if (!text) return [];
  
  const keywords = new Set();
  const lowerText = text.toLowerCase();

  // Check against all educational categories
  for (const categoryKeywords of Object.values(EDUCATIONAL_CATEGORIES)) {
    for (const keyword of categoryKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywords.add(keyword);
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Find category for keyword
 */
function findCategoryForKeyword(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  for (const [category, keywords] of Object.entries(EDUCATIONAL_CATEGORIES)) {
    for (const k of keywords) {
      if (k.toLowerCase() === lowerKeyword || lowerKeyword.includes(k.toLowerCase())) {
        return category;
      }
    }
  }
  
  return 'GENERAL';
}

/**
 * Get icon for category
 */
function getIconForCategory(category) {
  const icons = {
    PROGRAMMING: '💻',
    DSA: '🧮',
    CS_FUNDAMENTALS: '🖥️',
    AI_ML: '🤖',
    INTERVIEW_PREP: '🎯',
    WEB_DEV: '🌐',
    MOBILE_DEV: '📱',
    MATH_SCIENCE: '📐',
    PRODUCTIVITY: '⚡',
    BUSINESS: '💼',
    GENERAL: '📚'
  };
  
  return icons[category] || '📚';
}

/**
 * Get sources for keyword
 */
function getSourcesForKeyword(keyword, sources) {
  const keywordSources = [];
  
  if (sources.tasks.includes(keyword)) keywordSources.push('tasks');
  if (sources.timetable.includes(keyword)) keywordSources.push('timetable');
  if (sources.github.includes(keyword)) keywordSources.push('github');
  if (sources.aiMentor.includes(keyword)) keywordSources.push('aiMentor');
  if (sources.focusSessions.includes(keyword)) keywordSources.push('focusSessions');
  if (sources.weakSubjects.includes(keyword)) keywordSources.push('weakSubjects');
  
  return keywordSources;
}

/**
 * Prioritize recommendations based on sources
 */
function prioritizeRecommendations(recommendations, sources) {
  return recommendations.sort((a, b) => {
    // Prioritize by number of sources
    const aSourceCount = a.sources.length;
    const bSourceCount = b.sources.length;
    
    if (aSourceCount !== bSourceCount) {
      return bSourceCount - aSourceCount;
    }
    
    // Prioritize weak subjects
    const aIsWeak = a.sources.includes('weakSubjects');
    const bIsWeak = b.sources.includes('weakSubjects');
    
    if (aIsWeak && !bIsWeak) return -1;
    if (!aIsWeak && bIsWeak) return 1;
    
    // Prioritize recent tasks
    const aIsTask = a.sources.includes('tasks');
    const bIsTask = b.sources.includes('tasks');
    
    if (aIsTask && !bIsTask) return -1;
    if (!aIsTask && bIsTask) return 1;
    
    return 0;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track video watch activity
 * @param {string} userId - User ID
 * @param {Object} videoData - Video data
 * @returns {Promise<void>}
 */
export async function trackVideoWatch(userId, videoData) {
  try {
    const watchHistoryRef = collection(db, 'studyReelsHistory');
    
    await addDoc(watchHistoryRef, {
      userId,
      videoId: videoData.id,
      videoTitle: videoData.title,
      channel: videoData.channel,
      topic: videoData.topic,
      category: videoData.category,
      contentType: videoData.contentType, // 'shorts' or 'lectures'
      watchedAt: serverTimestamp(),
      duration: videoData.duration || 0
    });

    // Update user analytics
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalVideosWatched: increment(1),
      lastVideoWatchedAt: serverTimestamp()
    });

    console.log('Video watch tracked:', videoData.title);
  } catch (error) {
    console.error('Error tracking video watch:', error);
  }
}

/**
 * Get watch history for user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of records to fetch
 * @returns {Promise<Array>} - Watch history
 */
export async function getWatchHistory(userId, limitCount = 20) {
  try {
    const watchHistoryRef = collection(db, 'studyReelsHistory');
    const q = query(
      watchHistoryRef,
      where('userId', '==', userId),
      orderBy('watchedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const history = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        watchedAt: data.watchedAt?.toDate()
      });
    });

    return history;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
}

/**
 * Get trending topics based on watch history
 * @returns {Promise<Array>} - Trending topics
 */
export async function getTrendingTopics() {
  try {
    const watchHistoryRef = collection(db, 'studyReelsHistory');
    const q = query(
      watchHistoryRef,
      orderBy('watchedAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const topicCounts = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.topic) {
        topicCounts[data.topic] = (topicCounts[data.topic] || 0) + 1;
      }
    });

    // Sort by count and return top 10
    const trending = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({
        topic,
        count,
        category: findCategoryForKeyword(topic),
        icon: getIconForCategory(findCategoryForKeyword(topic))
      }));

    return trending;
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  validateSearchQuery,
  generatePersonalizedRecommendations,
  trackVideoWatch,
  getWatchHistory,
  getTrendingTopics,
  EDUCATIONAL_CATEGORIES,
  BLOCKED_KEYWORDS,
  DEFAULT_TOPICS
};
