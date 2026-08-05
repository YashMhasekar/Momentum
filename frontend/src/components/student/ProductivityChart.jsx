import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getWeeklyAnalytics } from '../../services/extensionService';
import { formatStudyTime, secondsToHours, formatPercentage } from '../../utils/timeFormatter';

function ProductivityChart() {
  const { currentUser } = useAuth();
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadWeeklyData();
    }
  }, [currentUser]);

  const loadWeeklyData = async () => {
    try {
      const data = await getWeeklyAnalytics(currentUser.uid);
      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Calculate weekly trend (comparing last day to first day)
  const weeklyTrend = weeklyData.length >= 2
    ? ((weeklyData[weeklyData.length - 1]?.focusScore || 0) -
      (weeklyData[0]?.focusScore || 0))
    : 0;

  // Calculate average focus score
  const avgFocusScore = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, day) => sum + (day.focusScore || 0), 0) / weeklyData.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly Productivity Trend</h2>
          <p className="text-sm text-gray-600">Study vs distraction time over the last 7 days</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs text-gray-600">Avg Productive Score</p>
            <p className="text-xl font-bold text-indigo-600">{formatPercentage(avgFocusScore)}</p>
          </div>
          {weeklyTrend !== 0 && (
            <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg ${weeklyTrend > 0
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
              {weeklyTrend > 0 ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
              <span className="text-sm font-semibold">{formatPercentage(Math.abs(weeklyTrend))}</span>
            </div>
          )}
        </div>
      </div>

      {weeklyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="distractionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#9ca3af' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value) => formatStudyTime(value * 3600)}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="studyTime"
              name="Study Time"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#studyGradient)"
            />
            <Area
              type="monotone"
              dataKey="distractionTime"
              name="Distraction Time"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#distractionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg font-medium mb-2">No data yet</p>
          <p className="text-sm text-center">Start using the Chrome extension to track your study sessions</p>
        </div>
      )}

      {weeklyData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Total Study</p>
            <p className="text-lg font-bold text-green-600">
              {formatStudyTime(weeklyData.reduce((sum, day) => sum + (day.studyTime || 0), 0) * 3600)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Total Distraction</p>
            <p className="text-lg font-bold text-red-600">
              {formatStudyTime(weeklyData.reduce((sum, day) => sum + (day.distractionTime || 0), 0) * 3600)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Best Day</p>
            <p className="text-lg font-bold text-indigo-600">
              {weeklyData.reduce((best, day) =>
                (day.studyTime || 0) > (best.studyTime || 0) ? day : best,
                weeklyData[0] || {}
              ).day || 'N/A'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default ProductivityChart;
