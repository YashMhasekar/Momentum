// ═══════════════════════════════════════════════════════════════════════════
// AI-POWERED SMART STUDY SEARCH SERVICE
// Uses GROQ LLM to optimize and validate educational search queries
// Corrects spelling, expands abbreviations, generates optimized queries
// ═══════════════════════════════════════════════════════════════════════════

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Cache for optimized queries
const queryCache = new Map();
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// ═══════════════════════════════════════════════════════════════════════════
// AI-POWERED SEARCH OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Optimize search query using AI
 * @param {string} rawQuery - User's raw search query
 * @returns {Promise<Object>} - { valid, improvedQuery, reason, source }
 */
export async function optimizeSearchQuery(rawQuery) {
  try {
    console.log('🔍 AI Search Optimization - Raw Query:', rawQuery);

    // Check cache first
    const cached = getCachedQuery(rawQuery);
    if (cached) {
      console.log('✅ Using cached optimized query:', cached);
      return cached;
    }

    // Try GROQ first
    if (GROQ_API_KEY) {
      console.log('🔵 Optimizing with GROQ AI...');
      const groqResult = await optimizeWithGroq(rawQuery);
      if (groqResult) {
        cacheQuery(rawQuery, groqResult);
        return groqResult;
      }
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY) {
      console.log('🟢 Optimizing with Gemini AI...');
      const geminiResult = await optimizeWithGemini(rawQuery);
      if (geminiResult) {
        cacheQuery(rawQuery, geminiResult);
        return geminiResult;
      }
    }

    // Fallback to OpenRouter
    if (OPENROUTER_API_KEY) {
      console.log('🟠 Optimizing with OpenRouter AI...');
      const openRouterResult = await optimizeWithOpenRouter(rawQuery);
      if (openRouterResult) {
        cacheQuery(rawQuery, openRouterResult);
        return openRouterResult;
      }
    }

    // Final fallback to basic optimization
    console.log('🔄 All APIs failed, using basic optimization');
    return basicOptimization(rawQuery);

  } catch (error) {
    console.error('❌ Error optimizing search query:', error);
    return basicOptimization(rawQuery);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT ENGINEERING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create AI prompt for search optimization
 */
function createOptimizationPrompt(rawQuery) {
  return `You are an intelligent educational search optimizer. Your job is to:
1. Correct spelling mistakes
2. Expand abbreviations and short forms
3. Understand context and intent
4. Determine if the query is educational/study-related
5. Generate an optimized search query for educational videos

EDUCATIONAL TOPICS (VALID):
- Programming: JavaScript, Python, Java, C++, React, Angular, Node.js, etc.
- Computer Science: DSA, algorithms, data structures, OS, DBMS, networks, etc.
- Mathematics: calculus, algebra, geometry, statistics, etc.
- Science: physics, chemistry, biology, etc.
- Engineering: electrical, mechanical, civil, etc.
- Interview Prep: coding interviews, aptitude, reasoning, etc.
- Business: management, marketing, finance, accounting, etc.
- Productivity: study techniques, time management, focus, etc.
- Technology: AI, ML, web development, mobile development, etc.

NON-EDUCATIONAL TOPICS (INVALID):
- Entertainment: movies, TV shows, celebrity gossip, funny videos, memes
- Gaming: gameplay, game reviews, gaming montages
- Social Media: Instagram, TikTok, viral content, pranks
- Sports: highlights, matches (non-educational)
- Music: music videos, songs (non-educational)
- Lifestyle: fashion, beauty, vlogs (non-educational)

ABBREVIATION EXAMPLES:
- "dp" → "Dynamic Programming"
- "os" → "Operating System"
- "dbms" → "Database Management System"
- "cn" → "Computer Networks"
- "dsa" → "Data Structures and Algorithms"
- "ml" → "Machine Learning"
- "ai" → "Artificial Intelligence"
- "oop" → "Object Oriented Programming"

SPELLING CORRECTION EXAMPLES:
- "webdevlopment" → "Web Development"
- "javascrpt" → "JavaScript"
- "algoritm" → "Algorithm"
- "programing" → "Programming"

USER QUERY: "${rawQuery}"

INSTRUCTIONS:
1. Analyze if the query is educational/study-related
2. If NOT educational, return: {"valid": false, "reason": "Non-educational query"}
3. If educational:
   - Correct any spelling mistakes
   - Expand abbreviations
   - Add helpful context (e.g., "tutorial", "explained", "for beginners")
   - Generate an optimized search query
   - Return: {"valid": true, "improvedQuery": "optimized query here"}

RESPOND ONLY WITH VALID JSON. NO ADDITIONAL TEXT.

Examples:
Input: "webdevlopment"
Output: {"valid": true, "improvedQuery": "Web Development tutorial for beginners"}

Input: "dp graphs"
Output: {"valid": true, "improvedQuery": "Dynamic Programming Graph Problems DSA"}

Input: "os sched"
Output: {"valid": true, "improvedQuery": "Operating System CPU Scheduling Algorithms"}

Input: "react hooks"
Output: {"valid": true, "improvedQuery": "React Hooks tutorial with examples"}

Input: "funny memes"
Output: {"valid": false, "reason": "Non-educational query"}

Input: "movie clips"
Output: {"valid": false, "reason": "Non-educational query"}

NOW PROCESS: "${rawQuery}"`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API OPTIMIZATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Optimize with GROQ API
 */
async function optimizeWithGroq(rawQuery) {
  try {
    const prompt = createOptimizationPrompt(rawQuery);

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
            content: 'You are an educational search optimizer. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error('❌ GROQ API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ GROQ Response received');

    return parseAIResponse(data, rawQuery, 'groq');

  } catch (error) {
    console.error('❌ GROQ API error:', error);
    return null;
  }
}

/**
 * Optimize with Gemini API
 */
async function optimizeWithGemini(rawQuery) {
  try {
    const prompt = createOptimizationPrompt(rawQuery);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          valid: parsed.valid || false,
          improvedQuery: parsed.improvedQuery || rawQuery,
          reason: parsed.reason || '',
          source: 'gemini-ai',
          originalQuery: rawQuery
        };
      }
    } catch (e) {
      console.error('❌ Error parsing Gemini JSON:', e);
    }

    return null;

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return null;
  }
}

/**
 * Optimize with OpenRouter API
 */
async function optimizeWithOpenRouter(rawQuery) {
  try {
    const prompt = createOptimizationPrompt(rawQuery);

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
            content: 'You are an educational search optimizer. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('❌ OpenRouter API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ OpenRouter Response received');

    return parseAIResponse(data, rawQuery, 'openrouter');

  } catch (error) {
    console.error('❌ OpenRouter API error:', error);
    return null;
  }
}

/**
 * Parse AI response
 */
function parseAIResponse(data, rawQuery, source) {
  try {
    let content = '';

    // Extract content based on source
    if (source === 'groq' || source === 'openrouter') {
      content = data.choices?.[0]?.message?.content?.trim() || '';
    }

    console.log('📝 AI Response Content:', content);

    // Parse JSON response
    const parsed = JSON.parse(content);

    if (parsed.valid === false) {
      return {
        valid: false,
        reason: parsed.reason || 'Non-educational query',
        source: `${source}-ai`,
        originalQuery: rawQuery
      };
    }

    if (parsed.valid === true && parsed.improvedQuery) {
      return {
        valid: true,
        improvedQuery: parsed.improvedQuery,
        source: `${source}-ai`,
        originalQuery: rawQuery
      };
    }

    // Invalid response format
    console.warn('⚠️ Invalid AI response format');
    return null;

  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BASIC OPTIMIZATION (FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Basic optimization without AI (fallback)
 */
function basicOptimization(rawQuery) {
  console.log('🔄 Using basic optimization (fallback)');

  const query = rawQuery.toLowerCase().trim();

  // Check for blocked keywords
  const blockedKeywords = [
    'funny', 'comedy', 'meme', 'memes', 'prank', 'pranks', 'joke', 'jokes',
    'entertainment', 'viral', 'gaming', 'gameplay', 'movie', 'movies',
    'instagram', 'tiktok', 'celebrity', 'gossip', 'music video'
  ];

  for (const blocked of blockedKeywords) {
    if (query.includes(blocked)) {
      return {
        valid: false,
        reason: 'This platform only supports educational and productivity-related content.',
        source: 'basic-fallback',
        originalQuery: rawQuery
      };
    }
  }

  // Common abbreviation expansions
  const abbreviations = {
    'dp': 'Dynamic Programming',
    'dsa': 'Data Structures and Algorithms',
    'os': 'Operating System',
    'dbms': 'Database Management System',
    'cn': 'Computer Networks',
    'ml': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'oop': 'Object Oriented Programming',
    'oops': 'Object Oriented Programming',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'cpp': 'C++',
    'webdev': 'Web Development',
    'mobiledev': 'Mobile Development',
    'algo': 'Algorithm',
    'algos': 'Algorithms'
  };

  // Expand abbreviations
  let improvedQuery = rawQuery;
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    improvedQuery = improvedQuery.replace(regex, full);
  }

  // Common spelling corrections
  const corrections = {
    'webdevlopment': 'Web Development',
    'javascrpt': 'JavaScript',
    'algoritm': 'Algorithm',
    'algoritms': 'Algorithms',
    'programing': 'Programming',
    'developement': 'Development',
    'tutorail': 'Tutorial',
    'tutorails': 'Tutorials'
  };

  for (const [wrong, correct] of Object.entries(corrections)) {
    const regex = new RegExp(wrong, 'gi');
    improvedQuery = improvedQuery.replace(regex, correct);
  }

  // Add "tutorial" if not present and query is short
  if (improvedQuery.split(' ').length <= 3 && !improvedQuery.toLowerCase().includes('tutorial')) {
    improvedQuery += ' tutorial';
  }

  return {
    valid: true,
    improvedQuery: improvedQuery.trim(),
    source: 'basic-fallback',
    originalQuery: rawQuery
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get cached query optimization
 */
function getCachedQuery(rawQuery) {
  const key = rawQuery.toLowerCase().trim();
  const cached = queryCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.result;
  }

  // Remove expired cache
  if (cached) {
    queryCache.delete(key);
  }

  return null;
}

/**
 * Cache query optimization
 */
function cacheQuery(rawQuery, result) {
  const key = rawQuery.toLowerCase().trim();
  queryCache.set(key, {
    result,
    timestamp: Date.now()
  });

  // Limit cache size
  if (queryCache.size > 100) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
}

/**
 * Clear query cache
 */
export function clearQueryCache() {
  queryCache.clear();
  console.log('🗑️ Query cache cleared');
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Optimize multiple queries at once
 * @param {Array<string>} queries - Array of raw queries
 * @returns {Promise<Array<Object>>} - Array of optimization results
 */
export async function optimizeMultipleQueries(queries) {
  try {
    const results = await Promise.all(
      queries.map(query => optimizeSearchQuery(query))
    );
    return results;
  } catch (error) {
    console.error('❌ Error optimizing multiple queries:', error);
    return queries.map(query => basicOptimization(query));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get search suggestions based on partial query
 * @param {string} partialQuery - Partial search query
 * @returns {Array<string>} - Array of suggestions
 */
export function getSearchSuggestions(partialQuery) {
  const query = partialQuery.toLowerCase().trim();

  if (query.length < 2) return [];

  const suggestions = [
    // Programming
    'JavaScript tutorial', 'Python programming', 'React Hooks', 'Node.js',
    'Java programming', 'C++ tutorial', 'TypeScript', 'Angular',
    
    // DSA
    'Data Structures', 'Algorithms', 'Dynamic Programming', 'Graph Algorithms',
    'Binary Trees', 'Sorting Algorithms', 'Linked Lists', 'Hash Tables',
    
    // CS Fundamentals
    'Operating System', 'DBMS', 'Computer Networks', 'System Design',
    'OOP concepts', 'Design Patterns', 'Compiler Design',
    
    // Interview
    'Coding Interview', 'Aptitude', 'Logical Reasoning', 'System Design Interview',
    
    // Web Dev
    'Web Development', 'Frontend', 'Backend', 'Full Stack', 'REST API',
    
    // AI/ML
    'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Neural Networks'
  ];

  return suggestions
    .filter(s => s.toLowerCase().includes(query))
    .slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  optimizeSearchQuery,
  optimizeMultipleQueries,
  getSearchSuggestions,
  clearQueryCache
};
