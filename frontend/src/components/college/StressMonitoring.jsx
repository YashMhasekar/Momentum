import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaSpinner, FaUser } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getCollegeAnalytics } from '../../services/adminAnalyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function StressMonitoring() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (userProfile?.collegeName) {
      loadCollegeData();
    }
  }, [userProfile]);

  const loadCollegeData = async () => {
    try {
      setLoading(true);
      const collegeAnalytics = await getCollegeAnalytics(userProfile.collegeName);
      setAnalytics(collegeAnalytics);
      setStudents(collegeAnalytics.students || []);
    } catch (error) {
      console.error('Error loading college data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorize students by wellness level using stress scores
  const stressMap = {};
  if (analytics?.stressData) {
    analytics.stressData.forEach(item => {
      if (!stressMap[item.userId] || item.timestamp > stressMap[item.userId].timestamp) {
        stressMap[item.userId] = item;
      }
    });
  }

  const lowRisk = students.filter(s => {
    const stress = stressMap[s.id];
    const stressScore = stress?.stressScore || 0;
    return stressScore < 31 && (s.momentumScore || 0) >= 70;
  });

  const mediumRisk = students.filter(s => {
    const stress = stressMap[s.id];
    const stressScore = stress?.stressScore || 0;
    const momentum = s.momentumScore || 0;
    return (stressScore >= 31 && stressScore < 61) || (momentum >= 40 && momentum < 70);
  });

  const highRisk = students.filter(s => {
    const stress = stressMap[s.id];
    const stressScore = stress?.stressScore || 0;
    return stressScore >= 61 || (s.momentumScore || 0) < 40;
  });

  // Real wellness trend data from analytics
  const trendData = analytics?.weeklyTrends || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wellness Monitoring</h1>
        <p className="text-gray-600">Track student engagement and identify at-risk students</p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">Healthy</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{lowRisk.length}</p>
          <p className="text-sm text-gray-600">Students performing well</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Momentum Score: 70+</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaExclamationCircle className="text-2xl text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-yellow-600">Monitor</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{mediumRisk.length}</p>
          <p className="text-sm text-gray-600">Students needing attention</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Momentum Score: 40-69</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="text-2xl text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-600">At Risk</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{highRisk.length}</p>
          <p className="text-sm text-gray-600">Students requiring intervention</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Momentum Score: Below 40</p>
          </div>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Wellness Trends (4 Weeks)</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Line type="monotone" dataKey="healthy" stroke="#10b981" strokeWidth={2} name="Healthy %" />
              <Line type="monotone" dataKey="mild" stroke="#f59e0b" strokeWidth={2} name="Mild Stress %" />
              <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} name="High Stress %" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <FaExclamationCircle className="mx-auto text-4xl text-gray-300 mb-3" />
              <p>No wellness trend data available yet</p>
              <p className="text-sm mt-1">Data will appear as students use the platform</p>
            </div>
          </div>
        )}
      </div>

      {/* At-Risk Students List */}
      {highRisk.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <h3 className="text-lg font-bold text-red-900 flex items-center space-x-2">
              <FaExclamationTriangle />
              <span>Students Requiring Attention ({highRisk.length})</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Momentum</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Streak</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Study Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {highRisk.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.fullName?.[0] || student.email?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{student.department || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        {student.momentumScore || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{student.streak || 0} days</td>
                    <td className="px-6 py-4 text-gray-900">{(student.totalStudyHours || 0).toFixed(1)}h</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const stress = stressMap[student.id];
                        const stressScore = stress?.stressScore || 0;
                        if (stressScore >= 61) {
                          return (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              High Stress
                            </span>
                          );
                        } else if ((student.momentumScore || 0) < 40) {
                          return (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Low Engagement
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Needs Support
                            </span>
                          );
                        }
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">Recommended Actions</h3>
        <ul className="space-y-3">
          {highRisk.length > 0 && (
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">Reach out to at-risk students</p>
                <p className="text-sm text-blue-700">Contact {highRisk.length} students with low engagement scores</p>
              </div>
            </li>
          )}
          {mediumRisk.length > 0 && (
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-blue-900">Monitor medium-risk students</p>
                <p className="text-sm text-blue-700">Keep track of {mediumRisk.length} students showing declining patterns</p>
              </div>
            </li>
          )}
          <li className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-blue-900">Organize wellness workshops</p>
              <p className="text-sm text-blue-700">Schedule stress management and productivity sessions</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StressMonitoring;
