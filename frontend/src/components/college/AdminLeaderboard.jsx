import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaTrophy, FaChartLine, FaFire, FaUsers, FaGraduationCap,
  FaFilter, FaSearch, FaTimes, FaArrowUp, FaArrowDown,
  FaClock, FaBrain, FaTasks, FaStar
} from 'react-icons/fa';
import {
  fetchLeaderboard,
  getDepartmentLeaderboard,
  getMostImprovedStudents,
  getLeaderboardAnalytics,
  searchStudents,
  TIME_PERIODS
} from '../../services/leaderboardService';
import StudentProfileModal from '../student/StudentProfileModal';

function AdminLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState([]);
  const [departmentLeaderboard, setDepartmentLeaderboard] = useState([]);
  const [mostImproved, setMostImproved] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.ALL_TIME);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overall'); // overall, department, improved

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedPeriod, selectedDepartment]);

  useEffect(() => {
    if (leaderboard.length > 0) {
      const filtered = searchStudents(searchTerm, leaderboard);
      setFilteredLeaderboard(filtered);
    }
  }, [searchTerm, leaderboard]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      const dept = selectedDepartment === 'all' ? null : selectedDepartment;

      const [leaderboardData, deptData, improvedData] = await Promise.all([
        fetchLeaderboard(selectedPeriod, dept, 100),
        getDepartmentLeaderboard(selectedPeriod),
        getMostImprovedStudents(selectedPeriod, 10)
      ]);

      setLeaderboard(leaderboardData);
      setFilteredLeaderboard(leaderboardData);
      setDepartmentLeaderboard(deptData);
      setMostImproved(improvedData);
      setAnalytics(getLeaderboardAnalytics(leaderboardData));
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  const departments = ['all', ...new Set(leaderboard.map(s => s.department))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
              <FaTrophy className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                Student Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">Monitor top performers and productivity trends</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-lg">
            {Object.entries(TIME_PERIODS).map(([key, value]) => (
              <button
                key={value}
                onClick={() => setSelectedPeriod(value)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedPeriod === value
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <AnalyticsCard
              icon={FaUsers}
              label="Total Students"
              value={analytics.totalStudents}
              color="blue"
            />
            <AnalyticsCard
              icon={FaChartLine}
              label="Avg Momentum"
              value={analytics.avgMomentum}
              color="purple"
            />
            <AnalyticsCard
              icon={FaClock}
              label="Avg Study Hours"
              value={`${analytics.avgStudyHours}h`}
              color="green"
            />
            <AnalyticsCard
              icon={FaBrain}
              label="Avg Productive Score"
              value={`${analytics.avgFocusScore}%`}
              color="orange"
            />
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex items-center space-x-4">
          {/* Department Filter */}
          <div className="relative flex-shrink-0">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all shadow-lg appearance-none cursor-pointer font-medium"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name, email, or department..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all shadow-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-6 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-lg">
        <button
          onClick={() => setActiveTab('overall')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'overall'
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <FaTrophy className="inline mr-2" />
          Overall Rankings
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'department'
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <FaGraduationCap className="inline mr-2" />
          Department Rankings
        </button>
        <button
          onClick={() => setActiveTab('improved')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'improved'
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <FaFire className="inline mr-2" />
          Most Improved
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overall' && (
        <OverallRankings
          students={filteredLeaderboard}
          onStudentClick={handleStudentClick}
        />
      )}

      {activeTab === 'department' && (
        <DepartmentRankings
          departments={departmentLeaderboard}
          onStudentClick={handleStudentClick}
        />
      )}

      {activeTab === 'improved' && (
        <MostImprovedRankings
          students={mostImproved}
          onStudentClick={handleStudentClick}
        />
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="text-white text-xl" />
        </div>
      </div>
      <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERALL RANKINGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function OverallRankings({ students, onStudentClick }) {
  if (students.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-3xl p-12 text-center shadow-xl">
        <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-xl text-gray-600">No students found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
        <FaTrophy className="text-yellow-500" />
        <span>Overall Rankings</span>
      </h2>

      <div className="space-y-3">
        {students.map((student) => (
          <AdminLeaderboardRow
            key={student.id}
            student={student}
            onClick={() => onStudentClick(student)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPARTMENT RANKINGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DepartmentRankings({ departments, onStudentClick }) {
  return (
    <div className="space-y-6">
      {departments.map((dept, idx) => (
        <motion.div
          key={dept.department}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{dept.department}</h3>
              <p className="text-gray-600">{dept.studentCount} students</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Momentum</p>
                <p className="text-2xl font-bold text-gray-900">{dept.avgMomentum}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Avg Study Hours</p>
                <p className="text-2xl font-bold text-gray-900">{dept.avgStudyHours}h</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dept.students.map((student) => (
              <AdminLeaderboardRow
                key={student.id}
                student={student}
                onClick={() => onStudentClick(student)}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOST IMPROVED RANKINGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function MostImprovedRankings({ students, onStudentClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
        <FaFire className="text-orange-500" />
        <span>Most Improved Students</span>
      </h2>

      <div className="space-y-3">
        {students.map((student, idx) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onStudentClick(student)}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                #{idx + 1}
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-white">
                {student.photoURL ? (
                  <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-600">{student.department}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Momentum</p>
                <p className="text-lg font-bold text-gray-900">{student.momentumScore}</p>
              </div>
              <div className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold flex items-center space-x-2">
                <FaArrowUp />
                <span>+{student.momentumGrowth}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN LEADERBOARD ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function AdminLeaderboardRow({ student, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 5 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-xl cursor-pointer transition-all"
    >
      <div className="flex items-center space-x-4 flex-1">
        {/* Rank */}
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-bold text-gray-900 shadow-md">
          #{student.rank}
        </div>

        {/* Profile Image */}
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-white">
          {student.photoURL ? (
            <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
              {student.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Student Info */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-600">{student.department} • {student.email}</p>
        </div>

        {/* Badges */}
        {student.badges && student.badges.length > 0 && (
          <div className="flex items-center space-x-1">
            {student.badges.slice(0, 3).map((badge, idx) => (
              <span key={idx} className="text-lg" title={badge.name}>
                {badge.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <p className="text-xs text-gray-600">Momentum</p>
            <p className="text-lg font-bold text-gray-900">{student.momentumScore}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Study Hours</p>
            <p className="text-lg font-bold text-gray-900">{student.totalStudyHours}h</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Focus</p>
            <p className="text-lg font-bold text-gray-900">{student.focusScore}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Tasks</p>
            <p className="text-lg font-bold text-gray-900">{student.completedTasks}</p>
          </div>
        </div>

        {/* Rank Change */}
        {student.rankChange !== 0 && (
          <div className={`flex items-center space-x-1 ${student.rankChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
            {student.rankChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
            <span className="text-sm font-bold">{Math.abs(student.rankChange)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AdminLeaderboard;
