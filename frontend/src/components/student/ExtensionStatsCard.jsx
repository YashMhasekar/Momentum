import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaChartLine, FaBolt, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayAnalytics } from '../../services/extensionService';
import { formatStudyTime, calculateFocusScore, formatPercentage } from '../../utils/timeFormatter';

function ExtensionStatsCard() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTodayAnalytics();
    }
  }, [currentUser]);

  const loadTodayAnalytics = async () => {
    try {
      const data = await getTodayAnalytics(currentUser.uid);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading extension analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Get real data in SECONDS from analytics
  const studySeconds = analytics?.totalStudyTime || 0;
  const distractionSeconds = analytics?.totalDistractionTime || 0;

  // Calculate focus score (0-100%)
  const focusScore = calculateFocusScore(studySeconds, distractionSeconds);

  // Format times properly
  const studyTimeFormatted = formatStudyTime(studySeconds);
  const distractionTimeFormatted = formatStudyTime(distractionSeconds);

  const trend = analytics?.trend || 0; // Compare with yesterday

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <FaClock className="text-white text-xl" />
          </div>
          <div>
            <p className="text-sm text-cyan-700 font-medium">Today's Study Time</p>
            <p className="text-3xl font-bold text-cyan-900">{studyTimeFormatted}</p>
          </div>
        </div>
        {trend !== 0 && (
          <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg ${trend > 0
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
            {trend > 0 ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
            <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <FaBolt className="text-cyan-600 text-sm" />
            <p className="text-xs text-cyan-700 font-medium">Productive Score</p>
          </div>
          <p className="text-2xl font-bold text-cyan-900">{formatPercentage(focusScore)}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <FaChartLine className="text-orange-600 text-sm" />
            <p className="text-xs text-orange-700 font-medium">Distractions</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">{distractionTimeFormatted}</p>
        </div>
      </div>

      {/* Productive Score Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-cyan-700 mb-2">
          <span>Focus Level</span>
          <span className="font-semibold">{formatPercentage(focusScore)}</span>
        </div>
        <div className="h-2 bg-cyan-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${focusScore}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full rounded-full ${focusScore >= 80 ? 'bg-green-500' :
              focusScore >= 60 ? 'bg-cyan-500' :
                focusScore >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
              }`}
          />
        </div>
      </div>

      {analytics?.sessionCount > 0 && (
        <p className="text-xs text-cyan-600 mt-3">
          {analytics.sessionCount} study session{analytics.sessionCount !== 1 ? 's' : ''} tracked today
        </p>
      )}
    </motion.div>
  );
}

export default ExtensionStatsCard;
