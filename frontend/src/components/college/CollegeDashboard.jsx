import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaChartLine, FaExclamationTriangle, FaTrophy, FaSpinner, FaClock, FaGlobe, FaBolt } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentsByCollege, getDepartmentStats } from '../../services/firestoreService';
import { getAdminAnalytics } from '../../services/extensionService';

function CollegeDashboard() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});
  const [extensionAnalytics, setExtensionAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile?.collegeName) {
      loadCollegeData();
    }
  }, [userProfile]);

  const loadCollegeData = async () => {
    try {
      setLoading(true);
      console.log('Loading data for college:', userProfile.collegeName);
      
      const [studentsData, deptStats, extAnalytics] = await Promise.all([
        getStudentsByCollege(userProfile.collegeName),
        getDepartmentStats(userProfile.collegeName),
        getAdminAnalytics(userProfile.collegeName)
      ]);
      
      console.log('Students loaded:', studentsData.length);
      console.log('Department stats:', deptStats);
      console.log('Extension analytics:', extAnalytics);
      
      setStudents(studentsData);
      setDepartmentStats(deptStats);
      setExtensionAnalytics(extAnalytics);
    } catch (error) {
      console.error('Error loading college data:', error);
      setError('Failed to load college data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => (s.streak || 0) > 0).length;
  const avgProductivity = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + (s.momentumScore || 0), 0) / totalStudents)
    : 0;
  const atRiskStudents = students.filter(s => (s.momentumScore || 0) < 30 && (s.totalStudyHours || 0) < 5).length;

  // Extension analytics stats
  const avgStudyHours = extensionAnalytics?.avgStudyHours || 0;
  const avgProductivityRatio = extensionAnalytics?.avgProductivityRatio || 0;
  const totalSessions = extensionAnalytics?.totalSessions || 0;

  // Prepare department chart data
  const departmentData = Object.entries(departmentStats).map(([dept, stats]) => ({
    dept: dept.split(' ')[0], // Short name
    students: stats.totalStudents,
    avgScore: stats.avgMomentumScore
  }));

  // Mock stress data (will be calculated from real data later)
  const stressData = [
    { week: 'W1', low: 60, medium: 30, high: 10 },
    { week: 'W2', low: 55, medium: 35, high: 10 },
    { week: 'W3', low: 50, medium: 35, high: 15 },
    { week: 'W4', low: 45, medium: 40, high: 15 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">College Dashboard</h1>
        <p className="text-gray-600">{userProfile?.collegeName || 'Your College'} - Institutional productivity and wellness analytics</p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <FaUsers className="text-3xl text-blue-600 mb-3" />
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <FaChartLine className="text-3xl text-green-600 mb-3" />
          <p className="text-gray-600 text-sm">Avg Momentum Score</p>
          <p className="text-3xl font-bold text-gray-900">{avgProductivity}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <FaExclamationTriangle className="text-3xl text-yellow-600 mb-3" />
          <p className="text-gray-600 text-sm">At-Risk Students</p>
          <p className="text-3xl font-bold text-gray-900">{atRiskStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <FaTrophy className="text-3xl text-purple-600 mb-3" />
          <p className="text-gray-600 text-sm">Active Users</p>
          <p className="text-3xl font-bold text-gray-900">{activeStudents}</p>
        </div>
      </div>

      {/* Extension Analytics Overview */}
      {extensionAnalytics && (
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center">
                <FaClock className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-cyan-700 font-medium">Avg Study Hours</p>
                <p className="text-3xl font-bold text-cyan-900">{avgStudyHours.toFixed(1)}h</p>
              </div>
            </div>
            <p className="text-xs text-cyan-600">Per student this week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <FaBolt className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Avg Productivity</p>
                <p className="text-3xl font-bold text-green-900">{(avgProductivityRatio * 100).toFixed(0)}%</p>
              </div>
            </div>
            <p className="text-xs text-green-600">Focus vs distraction ratio</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <FaGlobe className="text-white text-xl" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-purple-900">{totalSessions}</p>
              </div>
            </div>
            <p className="text-xs text-purple-600">Study sessions tracked</p>
          </motion.div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Department Overview</h2>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dept" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="students" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No department data available yet
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Stress Level Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Study Platforms - Admin View */}
      {extensionAnalytics?.topPlatforms && extensionAnalytics.topPlatforms.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Most Used Study Platforms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extensionAnalytics.topPlatforms.slice(0, 6).map((platform, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{platform.name}</p>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                    {platform.count} users
                  </span>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{platform.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-600 mt-1">Total study time</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Productivity Comparison */}
      {extensionAnalytics?.departmentProductivity && extensionAnalytics.departmentProductivity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Department Productivity Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={extensionAnalytics.departmentProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="department" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="avgStudyHours" fill="#10b981" name="Avg Study Hours" />
              <Bar dataKey="avgProductivity" fill="#6366f1" name="Avg Productivity %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {atRiskStudents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">⚠️ Wellness Alerts</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-red-100">
              <p className="text-gray-900 font-medium">{atRiskStudents} students showing low engagement</p>
              <p className="text-gray-600 text-sm">Students with momentum score below 30 and less than 5 study hours</p>
            </div>
          </div>
        </div>
      )}

      {totalStudents === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">No Students Yet</h3>
          <p className="text-blue-700">Students from your college will appear here once they register with "{userProfile?.collegeName}"</p>
        </div>
      )}
    </div>
  );
}

export default CollegeDashboard;
