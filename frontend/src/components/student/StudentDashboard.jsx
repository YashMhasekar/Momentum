import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTasks, calculateTaskStats } from '../../services/taskService';
import { getTodayAnalytics, getWeeklyAnalytics, calculateStudyStreak } from '../../services/extensionService';
import { formatStudyTime, calculateFocusScore, formatPercentage } from '../../utils/timeFormatter';
import {
  FaFire, FaClock, FaChartLine, FaBrain, FaCalendar,
  FaCheckCircle, FaArrowRight, FaBook, FaTrophy, FaLightbulb,
  FaArrowUp, FaArrowDown, FaPlay, FaPlus, FaCheck, FaTimes,
  FaFlag, FaBolt, FaHeart, FaUserSecret
} from 'react-icons/fa';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ExtensionStatsCard from './ExtensionStatsCard';
import ProductivityChart from './ProductivityChart';
import TopPlatforms from './TopPlatforms';
import ActivityTimeline from './ActivityTimeline';

function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [todayAnalytics, setTodayAnalytics] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadTodayAnalytics();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    try {
      const userTasks = await getUserTasks(currentUser.uid);
      setTasks(userTasks);
      setTaskStats(calculateTaskStats(userTasks));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAnalytics = async () => {
    try {
      const [analytics, weekly] = await Promise.all([
        getTodayAnalytics(currentUser.uid),
        getWeeklyAnalytics(currentUser.uid)
      ]);
      setTodayAnalytics(analytics);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading today analytics:', error);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quotes = [
    "Small progress is still progress.",
    "Consistency beats intensity.",
    "Your future self will thank you.",
    "Focus on progress, not perfection.",
    "Every expert was once a beginner."
  ];

  const dailyQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Calculate real analytics from extension data
  const studySeconds = todayAnalytics?.totalStudyTime || 0;
  const distractionSeconds = todayAnalytics?.totalDistractionTime || 0;
  const focusScore = calculateFocusScore(studySeconds, distractionSeconds);

  // totalStudyHours is stored as decimal hours in Firestore, convert to seconds for formatting
  const totalStudyHoursValue = userProfile?.totalStudyHours || 0;
  const totalStudyHours = totalStudyHoursValue > 0
    ? formatStudyTime(totalStudyHoursValue * 3600) // Convert hours to seconds
    : '0m';

  // Calculate streak from weekly data
  const currentStreak = weeklyData.length > 0 ? calculateStudyStreak(weeklyData) : (userProfile?.streak || 0);

  // Weekly growth from Firestore (set by userStatsUpdater — real comparison)
  const weeklyGrowth = userProfile?.weeklyGrowth ?? null; // null = no data yet

  // REAL weekly data for charts (from extension tracking)
  // weeklyData already contains: { date, day, studyTime (hours), distractionTime (hours), focusScore, sessions }
  const chartWeeklyData = weeklyData.map(day => ({
    day: day.day,
    hours: day.studyTime || 0,
    focus: day.focusScore || 0
  }));

  // Calculate productivity trend from weekly data (last 4 weeks)
  const calculateWeeklyTrend = () => {
    if (weeklyData.length === 0) return [];

    // Group by week and calculate average focus score
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = i * 7;
      const weekEnd = weekStart + 7;
      const weekData = weeklyData.slice(weekStart, weekEnd);

      if (weekData.length > 0) {
        const avgScore = Math.round(
          weekData.reduce((sum, day) => sum + (day.focusScore || 0), 0) / weekData.length
        );
        weeks.push({
          week: `W${i + 1}`,
          score: avgScore
        });
      }
    }

    return weeks.reverse(); // Most recent week last
  };

  const productivityTrend = calculateWeeklyTrend();

  // Study heatmap data (GitHub-style) - Generate from real weekly data
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();

    // Generate last 12 weeks (84 days)
    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 7; day++) {
        const daysAgo = (11 - week) * 7 + (6 - day);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dateString = date.toISOString().split('T')[0];

        // Find matching data from weeklyData
        const matchingDay = weeklyData.find(d => d.date === dateString);
        const studyHours = matchingDay?.studyTime || 0;

        // Convert hours to intensity level (0-4)
        let value = 0;
        if (studyHours >= 4) value = 4;
        else if (studyHours >= 3) value = 3;
        else if (studyHours >= 2) value = 2;
        else if (studyHours >= 1) value = 1;

        data.push({
          week,
          day,
          value,
          date: dateString,
          hours: studyHours
        });
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getHeatmapColor = (value) => {
    const colors = ['#f3f4f6', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'];
    return colors[value] || colors[0];
  };

  // Today's tasks (from real data)
  const todayTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {getGreeting()}, {currentUser?.displayName || userProfile?.fullName || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 italic">"{dailyQuote}"</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
            <FaFire className="text-orange-500" />
            <div>
              <p className="text-xs text-orange-700 font-medium">Streak</p>
              <p className="text-lg font-bold text-orange-900">{currentStreak} days</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FaChartLine className="text-white text-xl" />
            </div>
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">Momentum Score</p>
          <p className="text-3xl font-bold text-blue-900">{userProfile?.momentumScore || 0}</p>
          <div className="mt-3 h-1 bg-blue-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(userProfile?.momentumScore || 0) % 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-blue-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FaClock className="text-white text-xl" />
            </div>
            {weeklyGrowth !== null && weeklyGrowth !== 0 && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm font-medium ${weeklyGrowth > 0 ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {weeklyGrowth > 0 ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
                <span>{Math.abs(weeklyGrowth)}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-emerald-700 font-medium mb-1">Total Study Hours</p>
          <p className="text-3xl font-bold text-emerald-900">{totalStudyHours}</p>
          <p className="text-xs text-emerald-600 mt-2">From extension tracking</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FaCheckCircle className="text-white text-xl" />
            </div>
          </div>
          <p className="text-sm text-purple-700 font-medium mb-1">Tasks Completed</p>
          <p className="text-3xl font-bold text-purple-900">
            {taskStats?.completed || 0}/{taskStats?.total || 0}
          </p>
          <p className="text-xs text-purple-600 mt-2">{taskStats?.completionRate || 0}% completion rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <FaBolt className="text-white text-xl" />
            </div>
          </div>
          <p className="text-sm text-amber-700 font-medium mb-1">Productive Score</p>
          <p className="text-3xl font-bold text-amber-900">{formatPercentage(focusScore)}</p>
          <p className="text-xs text-amber-600 mt-2">
            {focusScore >= 80 ? 'Excellent focus!' :
              focusScore >= 60 ? 'Good focus!' :
                focusScore >= 40 ? 'Keep improving!' :
                  'Minimize distractions'}
          </p>
        </motion.div>
      </div>

      {/* Extension Stats Card - NEW */}
      <ExtensionStatsCard />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-6 gap-4">
        <Link to="/student/focus">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <FaPlay className="text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Start Focus</h3>
            </div>
            <p className="text-sm text-gray-600">Begin deep work session</p>
          </motion.div>
        </Link>

        <Link to="/student/tasks">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <FaPlus className="text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Add Task</h3>
            </div>
            <p className="text-sm text-gray-600">Create new task</p>
          </motion.div>
        </Link>

        <Link to="/student/mentor">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                <FaBrain className="text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">AI Mentor</h3>
            </div>
            <p className="text-sm text-gray-600">Get study guidance</p>
          </motion.div>
        </Link>

        <Link to="/student/planner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <FaCalendar className="text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Planner</h3>
            </div>
            <p className="text-sm text-gray-600">Organize schedule</p>
          </motion.div>
        </Link>

        <Link to="/student/counselor">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                <FaHeart className="text-pink-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Counselor</h3>
            </div>
            <p className="text-sm text-gray-600">Book wellness session</p>
          </motion.div>
        </Link>

        <Link to="/student/anonymous-support">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <FaUserSecret className="text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Safe Space</h3>
            </div>
            <p className="text-sm text-gray-600">Anonymous support chat</p>
          </motion.div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Extension Productivity Chart - REAL DATA */}
          <ProductivityChart />

          {/* Top Study Platforms - REAL DATA */}
          <TopPlatforms />

          {/* Study Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Study Consistency</h2>
              <p className="text-sm text-gray-600">Your study activity over the last 12 weeks</p>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col space-y-1">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <div key={day} className="flex space-x-1">
                    {heatmapData.filter(d => d.day === day).map((cell, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-indigo-400"
                        style={{ backgroundColor: getHeatmapColor(cell.value) }}
                        title={`${cell.date}: ${cell.hours.toFixed(1)} hours`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
                <span>Less</span>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: getHeatmapColor(i) }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Timeline - REAL DATA */}
          <ActivityTimeline />

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <FaLightbulb className="text-white" />
              </div>
              <h3 className="font-bold text-indigo-900">AI Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🎯</span>
                <p className="text-sm text-indigo-800">Your focus peaks between 9-11 AM. Schedule difficult subjects then.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lg">📈</span>
                <p className="text-sm text-indigo-800">You're 23% more productive after breaks. Keep it up!</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lg">⚡</span>
                <p className="text-sm text-indigo-800">Coding tasks have 85% completion rate. Great consistency!</p>
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <FaTrophy className="text-white" />
              </div>
              <h3 className="font-bold text-amber-900">Achievements</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FaFire className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Week Warrior</p>
                    <p className="text-xs text-gray-600">7 day streak</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaCheckCircle className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Task Master</p>
                    <p className="text-xs text-gray-600">50 tasks completed</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
