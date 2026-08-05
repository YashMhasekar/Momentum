import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaTasks, FaClock, FaFire, FaChartLine, FaLightbulb,
  FaExclamationTriangle, FaArrowUp, FaArrowDown, FaSync
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getMomentumScore, updateUserMomentumScore } from '../../services/momentumScoreEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function MomentumBreakdown() {
  const { currentUser } = useAuth();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadMomentumScore();
    }
  }, [currentUser]);

  const loadMomentumScore = async () => {
    try {
      setLoading(true);
      const data = await getMomentumScore(currentUser.uid);
      setScoreData(data);
    } catch (error) {
      console.error('Error loading momentum score:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await updateUserMomentumScore(currentUser.uid);
      setScoreData(data);
    } catch (error) {
      console.error('Error refreshing momentum score:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const { total, components, details } = scoreData;

  // Prepare chart data
  const chartData = [
    { name: 'Tasks', value: components.tasks || 0, color: '#3b82f6' },
    { name: 'Study', value: components.study || 0, color: '#10b981' },
    { name: 'Consistency', value: components.consistency || 0, color: '#f59e0b' },
    { name: 'Productivity', value: components.productivity || 0, color: '#8b5cf6' },
    { name: 'Engagement', value: components.engagement || 0, color: '#06b6d4' }
  ].filter(item => item.value > 0);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Momentum Score Breakdown</h2>
          <p className="text-sm text-gray-600">
            {scoreData.cached ? 'Cached score' : 'Fresh calculation'} •
            Last updated: {details.lastCalculated ? new Date(details.lastCalculated).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all disabled:opacity-50"
        >
          <FaSync className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Total Score Display */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Your Momentum Score</p>
            <div className="flex items-baseline space-x-3">
              <p className={`text-5xl font-bold ${getScoreColor(total)}`}>{total}</p>
              <p className="text-2xl text-gray-400">/ 100</p>
            </div>
            <p className={`text-sm font-medium mt-2 ${getScoreColor(total)}`}>
              {getScoreLabel(total)}
            </p>
          </div>
          <div className="text-6xl">
            {total >= 70 ? '🔥' : total >= 40 ? '👍' : '📈'}
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Score Components */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Components</h3>
          <div className="space-y-3">
            <ScoreComponent
              icon={FaTasks}
              label="Task Completion"
              score={components.tasks || 0}
              color="blue"
              details={`${details.selfTasksCompleted || 0} self + ${details.teacherTasksCompleted || 0} teacher + ${details.peerTasksCompleted || 0} peer`}
            />
            <ScoreComponent
              icon={FaClock}
              label="Study Hours"
              score={components.study || 0}
              color="green"
              details={`${(details.totalStudyHours || 0).toFixed(1)}h this week`}
            />
            <ScoreComponent
              icon={FaFire}
              label="Consistency"
              score={components.consistency || 0}
              color="orange"
              details={`${details.currentStreak || 0} day streak`}
            />
            <ScoreComponent
              icon={FaChartLine}
              label="Productivity Quality"
              score={components.productivity || 0}
              color="purple"
              details={`${details.focusScore || 0}% productive score`}
            />
            <ScoreComponent
              icon={FaLightbulb}
              label="Engagement"
              score={components.engagement || 0}
              color="cyan"
              details="Learning & growth"
            />
            {components.penalties < 0 && (
              <ScoreComponent
                icon={FaExclamationTriangle}
                label="Penalties"
                score={components.penalties}
                color="red"
                details={`${details.overdueTasksCount || 0} overdue tasks`}
              />
            )}
          </div>
        </div>

        {/* Visual Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Improvement Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How to Improve</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {total < 70 && (
            <>
              {(components.tasks || 0) < 20 && (
                <li>• Complete more tasks to boost your task score</li>
              )}
              {(components.study || 0) < 15 && (
                <li>• Increase daily study hours for better study score</li>
              )}
              {(components.consistency || 0) < 15 && (
                <li>• Study daily to build your streak and consistency</li>
              )}
              {(details.focusScore || 0) < 60 && (
                <li>• Reduce distractions to improve productive score</li>
              )}
              {(details.overdueTasksCount || 0) > 0 && (
                <li>• Complete overdue tasks to remove penalties</li>
              )}
            </>
          )}
          {total >= 70 && (
            <li>• Excellent work! Keep maintaining your momentum! 🔥</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}

// Score Component Display
function ScoreComponent({ icon: Icon, label, score, color, details }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-xs text-gray-600">{details}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <p className={`text-lg font-bold ${score >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {score >= 0 ? '+' : ''}{Math.round(score)}
        </p>
      </div>
    </div>
  );
}

export default MomentumBreakdown;
