import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaSpinner, FaUser, FaSync, FaEye, FaTasks } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getCollegeAnalytics } from '../../services/adminAnalyticsService';
import StudentDetailsModal from './StudentDetailsModal';
import AdminAssignTaskModal from './AdminAssignTaskModal';

function StudentAnalytics() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, momentum, streak, hours
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);

  useEffect(() => {
    if (userProfile?.collegeName) {
      loadCollegeData();
    }
  }, [userProfile]);

  useEffect(() => {
    filterAndSortStudents();
  }, [searchTerm, departmentFilter, sortBy, students]);

  const loadCollegeData = async () => {
    try {
      setLoading(true);
      const collegeAnalytics = await getCollegeAnalytics(userProfile.collegeName);
      setAnalytics(collegeAnalytics);
      setStudents(collegeAnalytics.students || []);
      setFilteredStudents(collegeAnalytics.students || []);
    } catch (error) {
      console.error('Error loading college data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCollegeData();
    } finally {
      setRefreshing(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'momentum':
          return (b.momentumScore || 0) - (a.momentumScore || 0);
        case 'streak':
          return (b.streak || 0) - (a.streak || 0);
        case 'hours':
          return (b.totalStudyHours || 0) - (a.totalStudyHours || 0);
        case 'name':
        default:
          return (a.fullName || '').localeCompare(b.fullName || '');
      }
    });

    setFilteredStudents(filtered);
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleAssignTask = (student) => {
    setSelectedStudent(student);
    setShowAssignTaskModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Analytics</h1>
          <p className="text-gray-600">View and analyze student performance data</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <FaSync className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </motion.div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none"
            >
              <option value="name">Sort by Name</option>
              <option value="momentum">Sort by Momentum</option>
              <option value="streak">Sort by Streak</option>
              <option value="hours">Sort by Study Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 text-sm font-medium">Total Students</p>
          <p className="text-3xl font-bold text-blue-900">{filteredStudents.length}</p>
          <p className="text-xs text-blue-600 mt-1">
            {students.length > filteredStudents.length ? `of ${students.length} total` : 'All students'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 text-sm font-medium">Avg Momentum</p>
          <p className="text-3xl font-bold text-green-900">
            {filteredStudents.length > 0
              ? Math.round(filteredStudents.reduce((sum, s) => sum + (s.momentumScore || 0), 0) / filteredStudents.length)
              : 0}
          </p>
          <p className="text-xs text-green-600 mt-1">Performance score</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
          <p className="text-orange-700 text-sm font-medium">Avg Streak</p>
          <p className="text-3xl font-bold text-orange-900">
            {filteredStudents.length > 0
              ? Math.round(filteredStudents.reduce((sum, s) => sum + (s.streak || 0), 0) / filteredStudents.length)
              : 0}
          </p>
          <p className="text-xs text-orange-600 mt-1">Days consecutive</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
          <p className="text-purple-700 text-sm font-medium">Total Study Hours</p>
          <p className="text-3xl font-bold text-purple-900">
            {filteredStudents.reduce((sum, s) => sum + (s.totalStudyHours || 0), 0).toFixed(1)}h
          </p>
          <p className="text-xs text-purple-600 mt-1">Combined time</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4">
          <p className="text-pink-700 text-sm font-medium">Active Today</p>
          <p className="text-3xl font-bold text-pink-900">
            {analytics?.activeToday || 0}
          </p>
          <p className="text-xs text-pink-600 mt-1">Currently active</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Momentum</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Streak</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Study Hours</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
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
                    <td className="px-6 py-4 text-gray-900">{student.semester || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          (student.momentumScore || 0) >= 70 ? 'bg-green-100 text-green-800' :
                          (student.momentumScore || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.momentumScore || 0}
                        </span>
                        {(student.momentumScore || 0) >= 70 && <span className="text-green-600">🔥</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-medium">{student.streak || 0}</span>
                        <span className="text-gray-500 text-sm">days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{(student.totalStudyHours || 0).toFixed(1)}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                        >
                          <FaEye />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleAssignTask(student)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                        >
                          <FaTasks />
                          <span>Assign</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FaUser className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-600">No students found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {searchTerm || departmentFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Students will appear here once they register'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedStudent(null);
            }}
            onAssignTask={() => {
              setShowDetailsModal(false);
              setShowAssignTaskModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Admin Assign Task Modal */}
      <AnimatePresence>
        {showAssignTaskModal && selectedStudent && (
          <AdminAssignTaskModal
            student={selectedStudent}
            onClose={() => {
              setShowAssignTaskModal(false);
              setSelectedStudent(null);
            }}
            onSuccess={() => {
              setShowAssignTaskModal(false);
              setSelectedStudent(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudentAnalytics;
