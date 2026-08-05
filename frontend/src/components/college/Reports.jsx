import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileDownload, FaCalendar, FaFilter, FaSpinner, FaChartBar, FaUsers, FaClock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentsByCollege, getDepartmentStats } from '../../services/firestoreService';

function Reports() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    if (userProfile?.collegeName) {
      loadData();
    }
  }, [userProfile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, deptStats] = await Promise.all([
        getStudentsByCollege(userProfile.collegeName),
        getDepartmentStats(userProfile.collegeName)
      ]);
      setStudents(studentsData);
      setDepartmentStats(deptStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'overview', name: 'Overview Report', icon: FaChartBar },
    { id: 'students', name: 'Student Performance', icon: FaUsers },
    { id: 'departments', name: 'Department Analysis', icon: FaChartBar },
    { id: 'engagement', name: 'Engagement Report', icon: FaClock }
  ];

  const handleExport = (format) => {
    // Mock export functionality
    alert(`Exporting ${selectedReport} report as ${format}...`);
  };

  // Calculate summary stats
  const totalStudents = students.length;
  const avgMomentum = totalStudents > 0 
    ? Math.round(students.reduce((sum, s) => sum + (s.momentumScore || 0), 0) / totalStudents)
    : 0;
  const totalStudyHours = students.reduce((sum, s) => sum + (s.totalStudyHours || 0), 0);
  const activeStudents = students.filter(s => (s.streak || 0) > 0).length;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and export comprehensive reports</p>
      </motion.div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('PDF')}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all flex items-center justify-center space-x-2"
              >
                <FaFileDownload />
                <span>PDF</span>
              </button>
              <button
                onClick={() => handleExport('CSV')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all flex items-center justify-center space-x-2"
              >
                <FaFileDownload />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalStudents}</p>
          <p className="text-sm text-gray-600">Total Students</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="text-2xl text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{avgMomentum}</p>
          <p className="text-sm text-gray-600">Avg Momentum Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-2xl text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalStudyHours}h</p>
          <p className="text-sm text-gray-600">Total Study Hours</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-2xl text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{activeStudents}</p>
          <p className="text-sm text-gray-600">Active Students</p>
        </motion.div>
      </div>

      {/* Report Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Report Preview</h3>
          <span className="text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString()}
          </span>
        </div>

        {selectedReport === 'overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Executive Summary</h4>
              <p className="text-gray-700 leading-relaxed">
                {userProfile?.collegeName} currently has {totalStudents} registered students across {Object.keys(departmentStats).length} departments. 
                The average momentum score is {avgMomentum}, with students collectively logging {totalStudyHours} study hours. 
                {activeStudents} students ({Math.round((activeStudents / totalStudents) * 100)}%) are actively engaged with the platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Department Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(departmentStats).map(([dept, stats]) => (
                  <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-medium">{dept}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">{stats.totalStudents} students</span>
                      <span className="text-gray-600">Avg: {stats.avgMomentumScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Momentum</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Streak</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.slice(0, 10).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{student.fullName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.department || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.momentumScore || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.streak || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.totalStudyHours || 0}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > 10 && (
              <p className="text-center text-sm text-gray-600 mt-4">
                Showing 10 of {students.length} students. Export for full report.
              </p>
            )}
          </div>
        )}

        {selectedReport === 'departments' && (
          <div className="space-y-4">
            {Object.entries(departmentStats).map(([dept, stats]) => (
              <div key={dept} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{dept}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Momentum</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgMomentumScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgStreak}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudyHours}h</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedReport === 'engagement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm text-green-900 font-medium mb-2">High Engagement</p>
                <p className="text-3xl font-bold text-green-900">
                  {students.filter(s => (s.momentumScore || 0) >= 70).length}
                </p>
                <p className="text-xs text-green-700 mt-1">Momentum 70+</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium mb-2">Medium Engagement</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {students.filter(s => (s.momentumScore || 0) >= 40 && (s.momentumScore || 0) < 70).length}
                </p>
                <p className="text-xs text-yellow-700 mt-1">Momentum 40-69</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-red-900 font-medium mb-2">Low Engagement</p>
                <p className="text-3xl font-bold text-red-900">
                  {students.filter(s => (s.momentumScore || 0) < 40).length}
                </p>
                <p className="text-xs text-red-700 mt-1">Momentum Below 40</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">About Reports</h4>
        <p className="text-sm text-blue-700">
          Reports are generated based on real-time data from your institution. 
          Export reports in PDF or CSV format for presentations, record-keeping, or further analysis.
        </p>
      </div>
    </div>
  );
}

export default Reports;
