import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaChartLine, FaFire, FaClock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getDepartmentStats } from '../../services/firestoreService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function DepartmentManagement() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState({});
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    if (userProfile?.collegeName) {
      loadDepartmentStats();
    }
  }, [userProfile]);

  const loadDepartmentStats = async () => {
    try {
      setLoading(true);
      const stats = await getDepartmentStats(userProfile.collegeName);
      setDepartmentStats(stats);
      
      // Select first department by default
      const firstDept = Object.keys(stats)[0];
      if (firstDept) setSelectedDept(firstDept);
    } catch (error) {
      console.error('Error loading department stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = Object.keys(departmentStats);
  
  // Prepare chart data
  const chartData = departments.map(dept => ({
    name: dept.split(' ')[0], // Short name
    students: departmentStats[dept].totalStudents,
    momentum: departmentStats[dept].avgMomentumScore,
    streak: departmentStats[dept].avgStreak
  }));

  // Pie chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">No Department Data</h3>
        <p className="text-blue-700">Department statistics will appear once students register.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Department Management</h1>
        <p className="text-gray-600">Analyze performance across departments</p>
      </motion.div>

      {/* Department Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept, index) => {
          const stats = departmentStats[dept];
          const isSelected = dept === selectedDept;
          
          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedDept(dept)}
              className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition-all ${
                isSelected ? 'border-gray-900 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">{dept.split(' ')[0]}</h3>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                  <FaUsers className={isSelected ? 'text-white' : 'text-gray-600'} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-600">Students</p>
                </div>
                
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Avg Momentum</span>
                    <span className="font-semibold text-gray-900">{stats.avgMomentumScore}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Department Details */}
      {selectedDept && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">{selectedDept} - Detailed Stats</h2>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <FaUsers className="text-2xl text-blue-600 mb-2" />
              <p className="text-sm text-blue-900 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{departmentStats[selectedDept].totalStudents}</p>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <FaChartLine className="text-2xl text-green-600 mb-2" />
              <p className="text-sm text-green-900 font-medium">Avg Momentum</p>
              <p className="text-2xl font-bold text-green-900">{departmentStats[selectedDept].avgMomentumScore}</p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <FaFire className="text-2xl text-orange-600 mb-2" />
              <p className="text-sm text-orange-900 font-medium">Avg Streak</p>
              <p className="text-2xl font-bold text-orange-900">{departmentStats[selectedDept].avgStreak} days</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <FaClock className="text-2xl text-purple-600 mb-2" />
              <p className="text-sm text-purple-900 font-medium">Total Hours</p>
              <p className="text-2xl font-bold text-purple-900">{departmentStats[selectedDept].totalStudyHours}h</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Students by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="students"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Department Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Students</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Avg Momentum</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Avg Streak</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((dept) => {
                const stats = departmentStats[dept];
                return (
                  <tr key={dept} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stats.totalStudents}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        stats.avgMomentumScore >= 70 ? 'bg-green-100 text-green-800' :
                        stats.avgMomentumScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stats.avgMomentumScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stats.avgStreak} days</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stats.totalStudyHours}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DepartmentManagement;
