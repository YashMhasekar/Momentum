const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE ADMIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS APP SETUP
// ═══════════════════════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate productivity ratio
 * @param {number} studyTime - Total study time in seconds
 * @param {number} distractionTime - Total distraction time in seconds
 * @returns {number} - Productivity ratio (0-100)
 */
function calculateProductivityRatio(studyTime, distractionTime) {
  const totalTime = studyTime + distractionTime;
  if (totalTime === 0) return 0;
  return Math.round((studyTime / totalTime) * 100);
}

/**
 * Calculate momentum score contribution from extension activity
 * @param {number} studyTime - Study time in seconds
 * @param {number} productivityRatio - Productivity ratio (0-100)
 * @returns {number} - Momentum score points
 */
function calculateMomentumContribution(studyTime, productivityRatio) {
  const studyHours = studyTime / 3600;
  const basePoints = Math.min(studyHours * 10, 50); // Max 50 points from study time
  const productivityBonus = (productivityRatio / 100) * 30; // Max 30 points from productivity
  return Math.round(basePoints + productivityBonus);
}

/**
 * Get date string in YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} - Date string
 */
function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Get start of day timestamp
 * @param {Date} date - Date object
 * @returns {Date} - Start of day
 */
function getStartOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day timestamp
 * @param {Date} date - Date object
 * @returns {Date} - End of day
 */
function getEndOfDay(date = new Date()) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Momentum Extension Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

/**
 * Save extension activity data
 * POST /api/save-extension-data
 */
app.post("/api/save-extension-data", async (req, res) => {
  try {
    const { userId, subject, study, distraction, date } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    if (!study && !distraction) {
      return res.status(400).json({
        success: false,
        error: "Either study or distraction data is required"
      });
    }

    // Calculate totals
    const studyTime = Object.values(study || {}).reduce((a, b) => a + b, 0);
    const distractionTime = Object.values(distraction || {}).reduce((a, b) => a + b, 0);
    const productivityRatio = calculateProductivityRatio(studyTime, distractionTime);
    const momentumPoints = calculateMomentumContribution(studyTime, productivityRatio);

    // Prepare payload
    const payload = {
      userId,
      subject: subject || "General",
      study: study || {},
      distraction: distraction || {},
      studyTime,
      distractionTime,
      productivityRatio,
      momentumPoints,
      date: date || getDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const docRef = await db.collection("extensionActivity").add(payload);

    // Update user's total study hours and momentum score
    await updateUserStats(userId, studyTime, momentumPoints);

    console.log("✅ Saved Extension Data:", {
      id: docRef.id,
      userId,
      studyTime: `${(studyTime / 60).toFixed(1)} min`,
      distractionTime: `${(distractionTime / 60).toFixed(1)} min`,
      productivityRatio: `${productivityRatio}%`,
      momentumPoints
    });

    res.json({
      success: true,
      message: "Extension data stored successfully",
      data: {
        id: docRef.id,
        studyTime,
        distractionTime,
        productivityRatio,
        momentumPoints
      }
    });

  } catch (error) {
    console.error("❌ Error saving extension data:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update user statistics (study hours, momentum score)
 */
async function updateUserStats(userId, studyTimeSeconds, momentumPoints) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const currentData = userDoc.data();
      const studyHours = studyTimeSeconds / 3600;

      await userRef.update({
        totalStudyHours: (currentData.totalStudyHours || 0) + studyHours,
        momentumScore: (currentData.momentumScore || 0) + momentumPoints,
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Updated user stats: +${studyHours.toFixed(2)}h, +${momentumPoints} momentum`);
    }
  } catch (error) {
    console.error("❌ Error updating user stats:", error);
  }
}

/**
 * Get all extension data for a user
 * GET /api/get-extension-data/:userId
 */
app.get("/api/get-extension-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`📊 Fetching extension data for user: ${userId}`);

    const snapshot = await db
      .collection("extensionActivity")
      .where("userId", "==", userId)
      .limit(100)
      .get();

    const data = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });

    console.log(`✅ Found ${data.length} records for user ${userId}`);

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error("❌ Error fetching extension data:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get today's analytics for a user
 * GET /api/get-today-analytics/:userId
 */
app.get("/api/get-today-analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`📊 Fetching today's analytics for user: ${userId}`);

    const today = getDateString();
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();

    // Fetch all data for user (single WHERE clause - no index required)
    const snapshot = await db
      .collection("extensionActivity")
      .where("userId", "==", userId)
      .get();

    let totalStudyTime = 0;
    let totalDistractionTime = 0;
    const studyWebsites = {};
    const distractionWebsites = {};
    const timeline = [];

    // Filter by date in JavaScript after fetching
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();

      // Skip if not today's data
      if (!createdAt || createdAt < startOfDay || createdAt > endOfDay) {
        return;
      }

      totalStudyTime += data.studyTime || 0;
      totalDistractionTime += data.distractionTime || 0;

      // Aggregate study websites
      Object.entries(data.study || {}).forEach(([site, time]) => {
        studyWebsites[site] = (studyWebsites[site] || 0) + time;
      });

      // Aggregate distraction websites
      Object.entries(data.distraction || {}).forEach(([site, time]) => {
        distractionWebsites[site] = (distractionWebsites[site] || 0) + time;
      });

      // Add to timeline
      timeline.push({
        time: createdAt,
        subject: data.subject,
        studyTime: data.studyTime,
        distractionTime: data.distractionTime,
        productivityRatio: data.productivityRatio
      });
    });

    const productivityRatio = calculateProductivityRatio(totalStudyTime, totalDistractionTime);

    // Sort websites by time
    const topStudyWebsites = Object.entries(studyWebsites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([site, time]) => ({ site, time }));

    const topDistractionWebsites = Object.entries(distractionWebsites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([site, time]) => ({ site, time }));

    console.log(`✅ Today's analytics: ${timeline.length} sessions, ${(totalStudyTime / 3600).toFixed(2)}h study`);

    res.json({
      success: true,
      date: today,
      analytics: {
        totalStudyTime,
        totalDistractionTime,
        productivityRatio,
        studyHours: (totalStudyTime / 3600).toFixed(2),
        distractionHours: (totalDistractionTime / 3600).toFixed(2),
        topStudyWebsites,
        topDistractionWebsites,
        timeline: timeline.sort((a, b) => a.time - b.time),
        sessionCount: timeline.length
      }
    });

  } catch (error) {
    console.error("❌ Error fetching today's analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get weekly analytics for a user
 * GET /api/get-weekly-analytics/:userId
 */
app.get("/api/get-weekly-analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`📊 Fetching weekly analytics for user: ${userId}`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startTimestamp = getStartOfDay(sevenDaysAgo);

    // Fetch all data for user (single WHERE clause - no index required)
    const snapshot = await db
      .collection("extensionActivity")
      .where("userId", "==", userId)
      .get();

    const dailyData = {};
    let totalStudyTime = 0;
    let totalDistractionTime = 0;
    const allStudyWebsites = {};
    const allDistractionWebsites = {};

    // Filter by date in JavaScript after fetching
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();

      // Skip if older than 7 days
      if (!createdAt || createdAt < startTimestamp) {
        return;
      }

      const date = data.date || getDateString(createdAt);

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          day: createdAt.toLocaleDateString('en-US', { weekday: 'short' }),
          studyTime: 0,
          distractionTime: 0,
          productivityRatio: 0,
          sessions: 0
        };
      }

      dailyData[date].studyTime += data.studyTime || 0;
      dailyData[date].distractionTime += data.distractionTime || 0;
      dailyData[date].sessions += 1;

      totalStudyTime += data.studyTime || 0;
      totalDistractionTime += data.distractionTime || 0;

      // Aggregate websites
      Object.entries(data.study || {}).forEach(([site, time]) => {
        allStudyWebsites[site] = (allStudyWebsites[site] || 0) + time;
      });

      Object.entries(data.distraction || {}).forEach(([site, time]) => {
        allDistractionWebsites[site] = (allDistractionWebsites[site] || 0) + time;
      });
    });

    // Calculate productivity ratio for each day
    Object.values(dailyData).forEach(day => {
      day.productivityRatio = calculateProductivityRatio(day.studyTime, day.distractionTime) / 100;
      day.studyTime = day.studyTime / 3600; // Convert to hours
      day.distractionTime = day.distractionTime / 3600; // Convert to hours
    });

    const weeklyProductivityRatio = calculateProductivityRatio(totalStudyTime, totalDistractionTime);

    // Top websites
    const topStudyWebsites = Object.entries(allStudyWebsites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([site, time]) => ({ site, time, hours: (time / 3600).toFixed(2) }));

    const topDistractionWebsites = Object.entries(allDistractionWebsites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([site, time]) => ({ site, time, hours: (time / 3600).toFixed(2) }));

    // Calculate total sessions from filtered data
    const totalSessions = Object.values(dailyData).reduce((sum, day) => sum + day.sessions, 0);

    console.log(`✅ Weekly analytics: ${totalSessions} sessions, ${(totalStudyTime / 3600).toFixed(2)}h study`);

    res.json({
      success: true,
      period: "Last 7 days",
      analytics: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
    });

  } catch (error) {
    console.error("❌ Error fetching weekly analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get admin analytics (all users)
 * GET /api/admin/analytics
 */
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const { department, days = 7 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const startTimestamp = admin.firestore.Timestamp.fromDate(getStartOfDay(daysAgo));

    let query = db.collection("extensionActivity")
      .where("createdAt", ">=", startTimestamp);

    const snapshot = await query.get();

    const userStats = {};
    let totalStudyTime = 0;
    let totalDistractionTime = 0;
    const platformUsage = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          studyTime: 0,
          distractionTime: 0,
          sessions: 0,
          productivityRatio: 0
        };
      }

      userStats[userId].studyTime += data.studyTime || 0;
      userStats[userId].distractionTime += data.distractionTime || 0;
      userStats[userId].sessions += 1;

      totalStudyTime += data.studyTime || 0;
      totalDistractionTime += data.distractionTime || 0;

      // Platform usage
      Object.entries(data.study || {}).forEach(([site, time]) => {
        platformUsage[site] = (platformUsage[site] || 0) + time;
      });
    });

    // Calculate productivity ratio for each user
    Object.values(userStats).forEach(user => {
      user.productivityRatio = calculateProductivityRatio(user.studyTime, user.distractionTime);
    });

    const avgProductivityRatio = calculateProductivityRatio(totalStudyTime, totalDistractionTime);

    // Top platforms
    const topPlatforms = Object.entries(platformUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([platform, time]) => ({
        platform,
        time,
        hours: (time / 3600).toFixed(2)
      }));

    res.json({
      success: true,
      period: `Last ${days} days`,
      analytics: {
        totalUsers: Object.keys(userStats).length,
        totalStudyTime,
        totalDistractionTime,
        avgStudyHours: (totalStudyTime / 3600 / Object.keys(userStats).length).toFixed(2),
        avgProductivityRatio,
        topPlatforms,
        userStats: Object.values(userStats).sort((a, b) => b.studyTime - a.studyTime)
      }
    });

  } catch (error) {
    console.error("❌ Error fetching admin analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EMOTION DETECTION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save emotion detection session data
 * POST /api/emotion/save-session
 */
app.post("/api/emotion/save-session", async (req, res) => {
  try {
    const {
      userId,
      sessionType,
      dominantEmotion,
      emotionDistribution,
      wellnessScore,
      totalDetections,
      aiInsight,
      recommendations,
      emotions
    } = req.body;

    // Validation
    if (!userId || !dominantEmotion) {
      return res.status(400).json({
        success: false,
        error: "userId and dominantEmotion are required"
      });
    }

    // Prepare payload
    const payload = {
      userId,
      sessionType: sessionType || "general",
      dominantEmotion,
      emotionDistribution: emotionDistribution || {},
      wellnessScore: wellnessScore || 0,
      totalDetections: totalDetections || 0,
      aiInsight: aiInsight || "",
      recommendations: recommendations || [],
      emotions: emotions || [],
      date: getDateString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const docRef = await db.collection("emotionSessions").add(payload);

    console.log("✅ Saved Emotion Session:", {
      id: docRef.id,
      userId,
      dominantEmotion,
      wellnessScore: `${wellnessScore}%`
    });

    res.json({
      success: true,
      message: "Emotion session stored successfully",
      data: {
        id: docRef.id,
        dominantEmotion,
        wellnessScore
      }
    });

  } catch (error) {
    console.error("❌ Error saving emotion session:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get emotion history for a user
 * GET /api/emotion/history/:userId
 */
app.get("/api/emotion/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`📊 Fetching emotion history for user: ${userId}`);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const startTimestamp = admin.firestore.Timestamp.fromDate(getStartOfDay(daysAgo));

    const snapshot = await db
      .collection("emotionSessions")
      .where("userId", "==", userId)
      .where("createdAt", ">=", startTimestamp)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    console.log(`✅ Found ${data.length} emotion sessions for user ${userId}`);

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error("❌ Error fetching emotion history:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get emotion analytics for a user
 * GET /api/emotion/analytics/:userId
 */
app.get("/api/emotion/analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    console.log(`📊 Fetching emotion analytics for user: ${userId}`);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const startTimestamp = admin.firestore.Timestamp.fromDate(getStartOfDay(daysAgo));

    const snapshot = await db
      .collection("emotionSessions")
      .where("userId", "==", userId)
      .where("createdAt", ">=", startTimestamp)
      .get();

    // Calculate analytics
    let totalSessions = 0;
    let totalWellnessScore = 0;
    const emotionCounts = {};
    const dailyData = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalSessions++;
      totalWellnessScore += data.wellnessScore || 0;

      // Count emotions
      const emotion = data.dominantEmotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

      // Daily aggregation
      const date = data.date || getDateString(data.createdAt?.toDate());
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          sessions: 0,
          totalWellness: 0,
          emotions: {}
        };
      }
      dailyData[date].sessions++;
      dailyData[date].totalWellness += data.wellnessScore || 0;
      dailyData[date].emotions[emotion] = (dailyData[date].emotions[emotion] || 0) + 1;
    });

    // Calculate averages
    const avgWellnessScore = totalSessions > 0 ? Math.round(totalWellnessScore / totalSessions) : 0;

    // Most common emotion
    const mostCommonEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Daily wellness trend
    const dailyTrend = Object.values(dailyData).map(day => ({
      date: day.date,
      sessions: day.sessions,
      avgWellness: Math.round(day.totalWellness / day.sessions),
      dominantEmotion: Object.entries(day.emotions)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log(`✅ Emotion analytics: ${totalSessions} sessions, ${avgWellnessScore}% avg wellness`);

    res.json({
      success: true,
      period: `Last ${days} days`,
      analytics: {
        totalSessions,
        avgWellnessScore,
        mostCommonEmotion,
        emotionDistribution: emotionCounts,
        dailyTrend
      }
    });

  } catch (error) {
    console.error("❌ Error fetching emotion analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Momentum Extension Backend API");
  console.log("=".repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔥 Status: Online and ready`);
  console.log(`📊 Firestore: Connected`);
  console.log("=".repeat(60) + "\n");
});