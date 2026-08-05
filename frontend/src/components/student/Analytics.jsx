import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain, FaFire, FaTrophy, FaClock, FaChartLine, FaHeart,
  FaSmile, FaDownload, FaUser, FaGraduationCap, FaCalendarAlt,
  FaCheckCircle, FaBolt, FaBullseye, FaBook, FaLightbulb, FaClipboardCheck
} from 'react-icons/fa';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  getWeeklyAnalytics,
  getTodayAnalytics,
  getTopPlatforms,
  calculateStudyStreak
} from '../../services/extensionService';
import {
  getRecentStressAnalytics,
  calculateAverageStressScore,
  getStressTrend,
  getStressLevelInfo,
  getWellnessRecommendations
} from '../../services/stressDetectionService';
import {
  getMoodHistory,
  calculateMoodTrends,
  getWeeklyMoodSummary
} from '../../services/moodService';
import {
  getFocusTestStatistics
} from '../../services/focusTestService';
import {
  getEmotionAnalytics,
  getEmotionEmoji,
  getEmotionColor,
  getWellnessLevelInfo,
  calculateEmotionTrend
} from '../../services/emotionDetectionService';
import {
  formatStudyTime,
  calculateFocusScore,
  formatPercentage
} from '../../utils/timeFormatter';
import MomentumBreakdown from './MomentumBreakdown';

function Analytics() {
  const { currentUser, userProfile } = useAuth();

  // State management
  const [weeklyData, setWeeklyData] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [stressAnalytics, setStressAnalytics] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [topPlatforms, setTopPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusTestStats, setFocusTestStats] = useState(null);
  const [emotionAnalytics, setEmotionAnalytics] = useState(null);

  // Load all analytics data
  useEffect(() => {
    if (currentUser) {
      loadAllAnalytics();
    }
  }, [currentUser]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [weekly, today, stress, mood, platforms, focusTests, emotions] = await Promise.all([
        getWeeklyAnalytics(currentUser.uid),
        getTodayAnalytics(currentUser.uid),
        getRecentStressAnalytics(currentUser.uid, 7),
        getMoodHistory(currentUser.uid, 7),
        getTopPlatforms(currentUser.uid, 5),
        getFocusTestStatistics(currentUser.uid),
        getEmotionAnalytics(currentUser.uid, 7)
      ]);

      setWeeklyData(weekly);
      setTodayData(today);
      setStressAnalytics(stress);
      setMoodHistory(mood);
      setTopPlatforms(platforms);
      setFocusTestStats(focusTests);
      setEmotionAnalytics(emotions);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate study metrics
  const totalStudySeconds = weeklyData.reduce((sum, day) => sum + (day.studyTime || 0) * 3600, 0);
  const totalDistractionSeconds = weeklyData.reduce((sum, day) => sum + (day.distractionTime || 0) * 3600, 0);
  const avgFocusScore = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, day) => sum + (day.focusScore || 0), 0) / weeklyData.length)
    : 0;
  const studyStreak = calculateStudyStreak(weeklyData);
  const momentumScore = userProfile?.momentumScore || 0;

  // Calculate weekly consistency
  const daysWithStudy = weeklyData.filter(day => day.studyTime > 0).length;
  const weeklyConsistency = Math.round((daysWithStudy / 7) * 100);

  // Find best study day
  const bestDay = weeklyData.length > 0
    ? weeklyData.reduce((best, day) => (day.studyTime > best.studyTime ? day : best), weeklyData[0])
    : null;

  // Calculate stress metrics
  const avgStressScore = calculateAverageStressScore(stressAnalytics);
  const stressTrend = getStressTrend(stressAnalytics);
  const stressLevel = avgStressScore >= 81 ? 'critical' : avgStressScore >= 61 ? 'high' : avgStressScore >= 31 ? 'medium' : 'low';
  const stressInfo = getStressLevelInfo(stressLevel);

  // Get wellness recommendations
  const recommendations = getWellnessRecommendations(avgStressScore, {
    stress: stressAnalytics.flatMap(s => s.keywords || []).slice(0, 5),
    behavioral: []
  });

  // Calculate mood metrics
  const moodTrends = calculateMoodTrends(moodHistory);
  const weeklyMood = getWeeklyMoodSummary(moodHistory);

  // Common stressors from analytics
  const commonStressors = [...new Set(
    stressAnalytics.flatMap(s => s.keywords || []).slice(0, 8)
  )];

  // Main concerns from topics
  const mainConcerns = [...new Set(
    stressAnalytics.flatMap(s => s.topics || []).slice(0, 6)
  )];

  // Download report function - PDF
  const downloadReportPDF = async () => {
    try {
      // Create a printable HTML version
      const printWindow = window.open('', '_blank');
      const reportHTML = generatePrintableReport();

      printWindow.document.write(reportHTML);
      printWindow.document.close();

      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to HTML download
      downloadReport();
    }
  };

  const generatePrintableReport = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Momentum Analytics Report</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; }
    }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
      color: #111827;
    }
    .header {
      text-align: center;
      margin-bottom: 50px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 30px;
    }
    h1 {
      color: #6366f1;
      font-size: 36px;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
    }
    .student-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .section {
      margin: 40px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 20px;
      border-left: 4px solid #6366f1;
      padding-left: 15px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #111827;
    }
    .metric-subtitle {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 5px;
    }
    .wellness-section {
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border: 2px solid #93c5fd;
      border-radius: 12px;
      padding: 25px;
      margin: 20px 0;
    }
    .stress-display {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stress-emoji {
      font-size: 60px;
    }
    .stress-info h3 {
      font-size: 28px;
      margin: 0 0 5px 0;
    }
    .recommendations {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .recommendation-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 15px;
    }
    .recommendation-card .icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .recommendation-card .title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .recommendation-card .description {
      font-size: 12px;
      color: #6b7280;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 15px 0;
    }
    .tag {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      color: #374151;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
    .footer .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Momentum Analytics Report</h1>
    <p class="subtitle">AI-Powered Student Wellness & Productivity Intelligence</p>
  </div>

  <div class="student-info">
    <strong>Student:</strong> ${userProfile?.fullName || 'Student'}<br>
    <strong>Department:</strong> ${userProfile?.department || 'N/A'}<br>
    <strong>College:</strong> ${userProfile?.collegeName || 'N/A'}<br>
    <strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  </div>

  <div class="section">
    <h2 class="section-title">📊 Study Analytics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Study Hours</div>
        <div class="metric-value">${formatStudyTime(totalStudySeconds)}</div>
        <div class="metric-subtitle">This week</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Momentum Score</div>
        <div class="metric-value">${momentumScore}</div>
        <div class="metric-subtitle">Keep it up!</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Study Streak</div>
        <div class="metric-value">${studyStreak} days</div>
        <div class="metric-subtitle">Consecutive</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Productive Score</div>
        <div class="metric-value">${avgFocusScore}%</div>
        <div class="metric-subtitle">Excellent!</div>
      </div>
    </div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Focused Work</div>
        <div class="metric-value">${formatStudyTime(totalStudySeconds)}</div>
        <div class="metric-subtitle">Productive time</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Distraction Time</div>
        <div class="metric-value">${formatStudyTime(totalDistractionSeconds)}</div>
        <div class="metric-subtitle">To improve</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Weekly Consistency</div>
        <div class="metric-value">${weeklyConsistency}%</div>
        <div class="metric-subtitle">${daysWithStudy}/7 days</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Best Day</div>
        <div class="metric-value">${bestDay ? bestDay.day : 'N/A'}</div>
        <div class="metric-subtitle">${bestDay ? formatStudyTime(bestDay.studyTime * 3600) : 'No data'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">🧠 Wellness & Stress Analysis</h2>
    <div class="wellness-section">
      <div class="stress-display">
        <div class="stress-emoji">${stressInfo.emoji}</div>
        <div class="stress-info">
          <h3 style="color: ${stressInfo.color}">${stressInfo.label}</h3>
          <p style="margin: 0; font-size: 16px;">Stress Score: ${avgStressScore}/100</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">${stressInfo.description}</p>
        </div>
      </div>
      
      ${commonStressors.length > 0 ? `
        <div style="margin-top: 20px;">
          <strong style="display: block; margin-bottom: 10px;">Common Stressors:</strong>
          <div class="tags">
            ${commonStressors.map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${mainConcerns.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong style="display: block; margin-bottom: 10px;">Main Concerns:</strong>
          <div class="tags">
            ${mainConcerns.map(c => `<span class="tag">${c}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">💡 AI Wellness Recommendations</h2>
    <div class="recommendations">
      ${recommendations.map(rec => `
        <div class="recommendation-card">
          <div class="icon">${rec.icon}</div>
          <div class="title">${rec.title}</div>
          <div class="description">${rec.description}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    <div class="logo">Momentum</div>
    <p>AI-Powered Student Wellness & Productivity Platform</p>
    <p>© ${new Date().getFullYear()} Momentum. All rights reserved.</p>
    <p style="margin-top: 10px; font-style: italic;">This report is confidential and intended for the student's personal use only.</p>
  </div>
</body>
</html>
    `;
  };

  const generateHTMLReport = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Momentum Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #6366f1; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-label { font-size: 14px; color: #6b7280; }
    .metric-value { font-size: 24px; font-weight: bold; color: #111827; }
    .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Momentum Analytics Report</h1>
    <p><strong>${userProfile?.fullName || 'Student'}</strong></p>
    <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>📊 Study Analytics</h2>
    <div class="metric">
      <div class="metric-label">Total Study Hours</div>
      <div class="metric-value">${formatStudyTime(totalStudySeconds)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Productive Score</div>
      <div class="metric-value">${avgFocusScore}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">Study Streak</div>
      <div class="metric-value">${studyStreak} days</div>
    </div>
    <div class="metric">
      <div class="metric-label">Momentum Score</div>
      <div class="metric-value">${momentumScore}</div>
    </div>
  </div>

  <div class="section">
    <h2>🧠 Wellness Insights</h2>
    <div class="metric">
      <div class="metric-label">Stress Level</div>
      <div class="metric-value">${stressInfo.emoji} ${stressInfo.label}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Stress Score</div>
      <div class="metric-value">${avgStressScore}/100</div>
    </div>
    <div class="metric">
      <div class="metric-label">Average Mood</div>
      <div class="metric-value">${moodTrends.averageMood}/5</div>
    </div>
  </div>

  <div class="section">
    <h2>💡 Recommendations</h2>
    <ul>
      ${recommendations.map(rec => `<li><strong>${rec.icon} ${rec.title}:</strong> ${rec.description}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p>Generated by Momentum - AI-Powered Student Wellness Platform</p>
    <p>© ${new Date().getFullYear()} Momentum. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAllAnalytics}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Premium Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">AI-Powered Student Insight & Wellness Intelligence</p>
          </div>
          <button
            onClick={downloadReportPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <FaDownload />
            <span>Download PDF Report</span>
          </button>
        </div>
      </motion.div>

      {/* Study Analytics Grid - 8 Premium Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Study Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={FaClock}
            title="Total Study Hours"
            value={formatStudyTime(totalStudySeconds)}
            subtitle="This week"
            color="blue"
          />
          <MetricCard
            icon={FaBolt}
            title="Momentum Score"
            value={momentumScore}
            subtitle="Keep it up!"
            color="purple"
          />
          <MetricCard
            icon={FaFire}
            title="Current Streak"
            value={`${studyStreak} days`}
            subtitle="Consecutive study days"
            color="orange"
          />
          <MetricCard
            icon={FaBullseye}
            title="Productive Score"
            value={`${avgFocusScore}%`}
            subtitle="Study vs distraction"
            color="green"
          />
          <MetricCard
            icon={FaBook}
            title="Focused Work Time"
            value={formatStudyTime(totalStudySeconds)}
            subtitle="Quality study hours"
            color="emerald"
          />
          <MetricCard
            icon={FaClock}
            title="Distraction Time"
            value={formatStudyTime(totalDistractionSeconds)}
            subtitle="Time to improve"
            color="red"
          />
          <MetricCard
            icon={FaCalendarAlt}
            title="Weekly Consistency"
            value={`${weeklyConsistency}%`}
            subtitle={`${daysWithStudy}/7 days active`}
            color="indigo"
          />
          <MetricCard
            icon={FaTrophy}
            title="Best Day"
            value={bestDay ? bestDay.day : 'N/A'}
            subtitle={bestDay ? formatStudyTime(bestDay.studyTime * 3600) : 'No data'}
            color="yellow"
          />
        </div>
      </motion.div>

      {/* Momentum Score Breakdown - NEW */}
      <MomentumBreakdown />

      {/* Wellness & Stress Analysis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🧠 Wellness & Stress Analysis</h2>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          {/* Stress Level Display */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="text-7xl">{stressInfo.emoji}</div>
            <div>
              <p className="text-3xl font-bold" style={{ color: stressInfo.color }}>
                {stressInfo.label}
              </p>
              <p className="text-gray-600 text-lg">Stress Score: {avgStressScore}/100</p>
              <p className="text-sm text-gray-500 mt-1">{stressInfo.description}</p>
            </div>
          </div>

          {/* AI Summary */}
          {stressAnalytics.length > 0 && (
            <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <FaBrain className="text-white text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">AI Summary</p>
                  <p className="text-sm text-gray-600">
                    {stressAnalytics[0]?.detailedAnalysis || 'Based on your recent conversations, your stress levels appear to be manageable. Continue maintaining healthy study habits.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Common Stressors */}
          {commonStressors.length > 0 && (
            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">Common Stressors</p>
              <div className="flex flex-wrap gap-2">
                {commonStressors.map((stressor, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700"
                  >
                    {stressor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Concerns */}
          {mainConcerns.length > 0 && (
            <div>
              <p className="font-semibold text-gray-900 mb-2">Main Concerns</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mainConcerns.map((concern, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 text-center"
                  >
                    {concern}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Emotion Detection Analytics - NEW */}
      {emotionAnalytics && emotionAnalytics.totalSessions > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">😊 Emotion Detection Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              icon={FaSmile}
              title="Total Sessions"
              value={emotionAnalytics.totalSessions}
              subtitle="Emotion check-ins"
              color="purple"
            />
            <MetricCard
              icon={FaHeart}
              title="Avg Wellness Score"
              value={`${emotionAnalytics.avgWellnessScore}%`}
              subtitle={getWellnessLevelInfo(emotionAnalytics.avgWellnessScore).label}
              color={emotionAnalytics.avgWellnessScore >= 70 ? 'green' : emotionAnalytics.avgWellnessScore >= 50 ? 'orange' : 'red'}
            />
            <MetricCard
              icon={FaChartLine}
              title="Emotion Trend"
              value={calculateEmotionTrend(emotionAnalytics.dailyTrend) === 'improving' ? '📈 Improving' : calculateEmotionTrend(emotionAnalytics.dailyTrend) === 'declining' ? '📉 Declining' : '➡️ Stable'}
              subtitle="Recent trend"
              color={calculateEmotionTrend(emotionAnalytics.dailyTrend) === 'improving' ? 'green' : calculateEmotionTrend(emotionAnalytics.dailyTrend) === 'declining' ? 'red' : 'indigo'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Common Emotion */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Most Common Emotion</h3>
              <div className="flex items-center space-x-4 mb-6">
                <div className="text-7xl">
                  {getEmotionEmoji(emotionAnalytics.mostCommonEmotion)}
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 capitalize">
                    {emotionAnalytics.mostCommonEmotion}
                  </p>
                  <p className="text-gray-600">
                    Detected most frequently
                  </p>
                </div>
              </div>

              {/* Emotion Distribution */}
              <div className="space-y-3">
                <p className="font-semibold text-gray-900 mb-2">Emotion Breakdown</p>
                {Object.entries(emotionAnalytics.emotionDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([emotion, count]) => {
                    const percentage = (count / emotionAnalytics.totalSessions) * 100;
                    return (
                      <div key={emotion}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getEmotionEmoji(emotion)}</span>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {emotion}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getEmotionColor(emotion) }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Daily Wellness Trend */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Wellness Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={emotionAnalytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Wellness Score']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWellness"
                    stroke="#ec4899"
                    strokeWidth={3}
                    dot={{ fill: '#ec4899', r: 4 }}
                    name="Wellness Score"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {emotionAnalytics.dailyTrend.slice(-3).map((day, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">{getEmotionEmoji(day.dominantEmotion)}</div>
                    <p className="text-xs text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{day.avgWellness}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Focus Test Statistics - NEW */}
      {focusTestStats && focusTestStats.totalTests > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FaClipboardCheck className="text-purple-600" />
            <span>📘 Focus Test Performance</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={FaCheckCircle}
              title="Total Tests Taken"
              value={focusTestStats.totalTests}
              subtitle="Learning validations"
              color="purple"
            />
            <MetricCard
              icon={FaTrophy}
              title="Average Score"
              value={`${focusTestStats.averageScore}%`}
              subtitle={focusTestStats.averageScore >= 75 ? 'Excellent!' : 'Keep improving'}
              color={focusTestStats.averageScore >= 75 ? 'green' : 'orange'}
            />
            <MetricCard
              icon={FaBullseye}
              title="Pass Rate"
              value={`${focusTestStats.passRate}%`}
              subtitle={`${Math.round(focusTestStats.totalTests * focusTestStats.passRate / 100)} passed`}
              color="blue"
            />
            <MetricCard
              icon={FaChartLine}
              title="Learning Trend"
              value={focusTestStats.improvementTrend === 'improving' ? '📈 Improving' : focusTestStats.improvementTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              subtitle="Recent performance"
              color={focusTestStats.improvementTrend === 'improving' ? 'green' : focusTestStats.improvementTrend === 'declining' ? 'red' : 'indigo'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strongest Subjects */}
            {focusTestStats.strongestSubjects.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <FaTrophy className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">💪 Strongest Subjects</h3>
                    <p className="text-sm text-gray-600">Your best performing topics</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {focusTestStats.strongestSubjects.map((subject, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{subject.subject}</span>
                        <span className="text-2xl font-bold text-green-600">{subject.averageScore}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{subject.testCount} test{subject.testCount > 1 ? 's' : ''}</span>
                        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${subject.averageScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weakest Subjects */}
            {focusTestStats.weakestSubjects.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <FaLightbulb className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">📚 Areas to Improve</h3>
                    <p className="text-sm text-gray-600">Focus on these topics</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {focusTestStats.weakestSubjects.map((subject, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{subject.subject}</span>
                        <span className="text-2xl font-bold text-orange-600">{subject.averageScore}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{subject.testCount} test{subject.testCount > 1 ? 's' : ''}</span>
                        <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${subject.averageScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Learning Consistency */}
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <FaCalendarAlt className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Learning Consistency</h3>
                  <p className="text-sm text-gray-600">Tests taken this week</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-indigo-600">{focusTestStats.learningConsistency}</p>
                <p className="text-sm text-gray-600">tests this week</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Wellness Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 AI Wellness Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{rec.icon}</div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">{rec.title}</p>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                    {rec.type === 'urgent' && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Visualizations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Study Hours Chart */}
          <ChartCard title="Weekly Study Hours">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatStudyTime(value * 3600)} />
                <Area
                  type="monotone"
                  dataKey="studyTime"
                  stroke="#3b82f6"
                  fill="url(#studyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Focus vs Distraction Pie Chart */}
          <ChartCard title="Focus vs Distraction">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Focus Time', value: totalStudySeconds },
                    { name: 'Distraction', value: totalDistractionSeconds }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value) => formatStudyTime(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Productivity Trend */}
          <ChartCard title="Productivity Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="focusScore"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Productive Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Mood vs Productivity */}
          <ChartCard title="Weekly Mood Summary">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyMood}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dayName" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="score" fill="#f59e0b" name="Mood Score" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weekly Consistency */}
          <ChartCard title="Weekly Consistency">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatStudyTime(value * 3600)} />
                <Bar dataKey="studyTime" fill="#6366f1" name="Study Hours" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Platforms */}
          <ChartCard title="Top Study Platforms">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPlatforms} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="url" type="category" stroke="#6b7280" width={100} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}h`} />
                <Bar dataKey="totalTime" fill="#10b981" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </motion.div>

      {/* Profile Integration */}
      {userProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Profile Insights</h2>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Student Name</p>
                <p className="text-lg font-bold text-gray-900">{userProfile.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Department</p>
                <p className="text-lg font-bold text-gray-900">{userProfile.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">College</p>
                <p className="text-lg font-bold text-gray-900">{userProfile.collegeName || 'N/A'}</p>
              </div>
              {userProfile.githubSkills && userProfile.githubSkills.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">GitHub Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.githubSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border border-purple-300 rounded-full text-sm text-purple-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Study Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Reusable Components

function MetricCard({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
      <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default Analytics;
