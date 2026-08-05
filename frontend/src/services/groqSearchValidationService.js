// ═══════════════════════════════════════════════════════════════════════════
// GROQ AI-POWERED SEARCH VALIDATION SERVICE
// Uses GROQ LLM to validate educational content searches
// Fallback to Gemini and OpenRouter if GROQ fails
// ═══════════════════════════════════════════════════════════════════════════

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Cache for validated queries to reduce API calls
const validationCache = new Map();
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// ═══════════════════════════════════════════════════════════════════════════
// GROQ LLM VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate search query using AI (GROQ → Gemini → OpenRouter → Keywords)
 * @param {string} searchQuery - User's search query
 * @returns {Promise<Object>} - { isValid, reason, confidence }
 */
export async function validateSearchWithGroq(searchQuery) {
  try {
    console.log('🤖 AI Validation - Query:', searchQuery);

    // Check cache first
    const cached = getCachedValidation(searchQuery);
    if (cached) {
      console.log('✅ Using cached validation:', cached);
      return cached;
    }

    // Try GROQ first
    if (GROQ_API_KEY) {
      console.log('🔵 Trying GROQ API...');
      const groqResult = await validateWithGroq(searchQuery);
      if (groqResult) {
        cacheValidation(searchQuery, groqResult);
        return groqResult;
      }
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY) {
      console.log('🟢 Trying Gemini API...');
      const geminiResult = await validateWithGemini(searchQuery);
      if (geminiResult) {
        cacheValidation(searchQuery, geminiResult);
        return geminiResult;
      }
    }

    // Fallback to OpenRouter
    if (OPENROUTER_API_KEY) {
      console.log('🟠 Trying OpenRouter API...');
      const openRouterResult = await validateWithOpenRouter(searchQuery);
      if (openRouterResult) {
        cacheValidation(searchQuery, openRouterResult);
        return openRouterResult;
      }
    }

    // Final fallback to keyword-based validation
    console.log('🔄 All APIs failed, using keyword validation');
    return fallbackValidation(searchQuery);

  } catch (error) {
    console.error('❌ Error validating with AI:', error);
    return fallbackValidation(searchQuery);
  }
}

/**
 * Create validation prompt for LLM
 */
function createValidationPrompt(searchQuery) {
  return `Determine whether this search query is educational, study-related, or productivity-focused.

Educational topics include:
- Programming, coding, software development
- Data structures, algorithms, computer science
- Mathematics, science, engineering
- Academic subjects (physics, chemistry, biology, etc.)
- Interview preparation, aptitude, reasoning
- Business, management, finance
- Productivity, study techniques, learning skills
- Technology tutorials and courses

Non-educational topics include:
- Entertainment (movies, TV shows, celebrity gossip)
- Gaming (gameplay, game reviews, gaming montages)
- Social media content (memes, pranks, viral videos)
- Sports highlights (non-educational)
- Music videos, dance videos
- Comedy, funny videos, jokes
- Fashion, beauty, lifestyle vlogs
- Food recipes, cooking shows (non-educational)

Query: "${searchQuery}"

Reply ONLY with:
- "VALID" if the query is educational/study-related
- "INVALID" if the query is entertainment/non-educational

Format: VALID or INVALID`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate with GROQ API
 */
async function validateWithGroq(searchQuery) {
  try {
    const prompt = createValidationPrompt(searchQuery);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an educational content validator. Reply ONLY with "VALID" or "INVALID".'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      console.error('❌ GROQ API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ GROQ Response received');

    return parseLLMResponse(data, searchQuery, 'groq');

  } catch (error) {
    console.error('❌ GROQ API error:', error);
    return null;
  }
}

/**
 * Validate with Gemini API
 */
async function validateWithGemini(searchQuery) {
  try {
    const prompt = createValidationPrompt(searchQuery);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an educational content validator. ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      })
    });

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ Gemini Response received');

    // Parse Gemini response format
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || '';
    
    const isValid = content.includes('VALID') && !content.includes('INVALID');
    const isInvalid = content.includes('INVALID');

    if (isValid) {
      return {
        isValid: true,
        reason: 'Educational content approved by AI',
        confidence: 'high',
        source: 'gemini-ai'
      };
    } else if (isInvalid) {
      return {
        isValid: false,
        reason: 'This platform only allows educational and productivity-related content.',
        confidence: 'high',
        source: 'gemini-ai'
      };
    }

    return null;

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return null;
  }
}

/**
 * Validate with OpenRouter API
 */
async function validateWithOpenRouter(searchQuery) {
  try {
    const prompt = createValidationPrompt(searchQuery);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Momentum Study Platform'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an educational content validator. Reply ONLY with "VALID" or "INVALID".'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.error('❌ OpenRouter API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ OpenRouter Response received');

    return parseLLMResponse(data, searchQuery, 'openrouter');

  } catch (error) {
    console.error('❌ OpenRouter API error:', error);
    return null;
  }
}

/**
 * Parse LLM response
 */
function parseLLMResponse(data, searchQuery, source = 'groq') {
  try {
    let content = '';

    // Extract content based on source
    if (source === 'groq' || source === 'openrouter') {
      content = data.choices?.[0]?.message?.content?.trim().toUpperCase() || '';
    }

    console.log('📝 LLM Content:', content);

    // Check if response contains VALID or INVALID
    const isValid = content.includes('VALID') && !content.includes('INVALID');
    const isInvalid = content.includes('INVALID');

    if (isValid) {
      return {
        isValid: true,
        reason: 'Educational content approved by AI',
        confidence: 'high',
        source: `${source}-llm`
      };
    } else if (isInvalid) {
      return {
        isValid: false,
        reason: 'This platform only allows educational and productivity-related content.',
        confidence: 'high',
        source: `${source}-llm`
      };
    } else {
      // Unclear response
      console.warn('⚠️ Unclear LLM response');
      return null;
    }
  } catch (error) {
    console.error('❌ Error parsing LLM response:', error);
    return null;
  }
}

/**
 * Fallback validation using keyword matching
 */
function fallbackValidation(searchQuery) {
  console.log('🔄 Using fallback keyword validation');

  const query = searchQuery.toLowerCase().trim();

  // Educational keywords
  const educationalKeywords = [
    // Programming
    'programming', 'coding', 'javascript', 'python', 'java', 'c++', 'react',
    'angular', 'vue', 'node', 'django', 'flask', 'spring', 'html', 'css',
    'typescript', 'php', 'ruby', 'swift', 'kotlin', 'go', 'rust',
    
    // Computer Science
    'algorithm', 'data structure', 'dsa', 'array', 'linked list', 'tree',
    'graph', 'stack', 'queue', 'heap', 'hash', 'sorting', 'searching',
    'dynamic programming', 'greedy', 'backtracking', 'recursion',
    
    // CS Fundamentals
    'operating system', 'os', 'dbms', 'database', 'sql', 'network',
    'computer network', 'cn', 'compiler', 'automata', 'toc', 'architecture',
    'digital logic', 'oop', 'oops', 'system design', 'design pattern',
    
    // AI/ML
    'machine learning', 'ml', 'artificial intelligence', 'ai', 'deep learning',
    'neural network', 'cnn', 'rnn', 'nlp', 'computer vision', 'tensorflow',
    'pytorch', 'keras', 'data science', 'pandas', 'numpy',
    
    // Interview & Career
    'interview', 'aptitude', 'reasoning', 'logical', 'verbal', 'quantitative',
    'placement', 'job', 'career', 'resume', 'leetcode', 'hackerrank',
    
    // Academic
    'mathematics', 'math', 'calculus', 'algebra', 'geometry', 'trigonometry',
    'statistics', 'probability', 'physics', 'chemistry', 'biology',
    'engineering', 'science', 'study', 'learn', 'tutorial', 'course',
    'lecture', 'education', 'academic', 'exam', 'test', 'preparation',
    
    // Web & Mobile
    'web development', 'frontend', 'backend', 'full stack', 'api', 'rest',
    'graphql', 'microservices', 'docker', 'kubernetes', 'aws', 'azure',
    'android', 'ios', 'mobile', 'app development',
    
    // Productivity
    'productivity', 'time management', 'focus', 'concentration', 'study tips',
    'learning', 'memory', 'note taking', 'revision', 'speed reading',
    
    // Business
    'business', 'management', 'marketing', 'finance', 'accounting',
    'economics', 'entrepreneurship', 'startup', 'leadership'
  ];

  // Blocked keywords
  const blockedKeywords = [
    'funny', 'comedy', 'meme', 'memes', 'prank', 'pranks', 'joke', 'jokes',
    'entertainment', 'viral', 'trending', 'challenge', 'dance', 'music video',
    'gaming', 'gameplay', 'game', 'fortnite', 'minecraft', 'pubg', 'cod',
    'gta', 'fifa', 'valorant', 'league of legends', 'dota',
    'movie', 'movies', 'film', 'cinema', 'trailer', 'tv show', 'series',
    'netflix', 'web series', 'episode', 'season',
    'instagram', 'tiktok', 'snapchat', 'celebrity', 'gossip', 'vlog',
    'fashion', 'makeup', 'beauty', 'haul', 'unboxing',
    'cricket', 'football', 'soccer', 'basketball', 'sports highlights',
    'reaction', 'roast', 'drama', 'controversy'
  ];

  // Check for blocked keywords first
  for (const blocked of blockedKeywords) {
    if (query.includes(blocked)) {
      return {
        isValid: false,
        reason: 'This platform only allows educational and productivity-related content.',
        confidence: 'high',
        source: 'keyword-fallback',
        blockedKeyword: blocked
      };
    }
  }

  // Check for educational keywords
  for (const keyword of educationalKeywords) {
    if (query.includes(keyword)) {
      return {
        isValid: true,
        reason: 'Educational content approved',
        confidence: 'medium',
        source: 'keyword-fallback',
        matchedKeyword: keyword
      };
    }
  }

  // If no match, be conservative and reject
  return {
    isValid: false,
    reason: 'Please search for educational or study-related topics only.',
    confidence: 'low',
    source: 'keyword-fallback'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get cached validation result
 */
function getCachedValidation(searchQuery) {
  const key = searchQuery.toLowerCase().trim();
  const cached = validationCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.result;
  }

  // Remove expired cache
  if (cached) {
    validationCache.delete(key);
  }

  return null;
}

/**
 * Cache validation result
 */
function cacheValidation(searchQuery, result) {
  const key = searchQuery.toLowerCase().trim();
  validationCache.set(key, {
    result,
    timestamp: Date.now()
  });

  // Limit cache size
  if (validationCache.size > 100) {
    const firstKey = validationCache.keys().next().value;
    validationCache.delete(firstKey);
  }
}

/**
 * Clear validation cache
 */
export function clearValidationCache() {
  validationCache.clear();
  console.log('🗑️ Validation cache cleared');
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH VALIDATION (for multiple queries)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate multiple queries at once
 * @param {Array<string>} queries - Array of search queries
 * @returns {Promise<Array<Object>>} - Array of validation results
 */
export async function validateMultipleQueries(queries) {
  try {
    const results = await Promise.all(
      queries.map(query => validateSearchWithGroq(query))
    );
    return results;
  } catch (error) {
    console.error('❌ Error validating multiple queries:', error);
    return queries.map(query => fallbackValidation(query));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  validateSearchWithGroq,
  validateMultipleQueries,
  clearValidationCache
};
