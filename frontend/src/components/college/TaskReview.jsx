import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaClipboardCheck, FaHourglassHalf, FaCheckCircle, FaTimesCircle,
  FaUser, FaClock, FaFire, FaFilter, FaSearch, FaTimes, FaEye,
  FaStar, FaExclamationTriangle, FaChartLine
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTasksPendingVerification,
  getCreatedTasks,
  TASK_STATUS,
  PRIORITY_LEVELS
} from '../../services/collaborativeTaskService';
import TaskVerificationModal from '../student/TaskVerificationModal';
import Toast from '../Toast';

function TaskReview() {
  const { currentUser } = useAuth();
  const [pendingTasks, setPendingTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, all, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [statistics, setStatistics] = useState({
    pending: 0,
    completed: 0,
    revisionRequested: 0,
    avgRating: 0
  });

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  useEffect(() => {
    applyFilters();
  }, [allTasks, activeTab, searchTerm, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      console.log('Loading tasks for admin:', currentUser.uid);
      
      // Get tasks pending verification (tasks assigned BY this admin that are SUBMITTED)
      const pending = await getTasksPendingVerification(currentUser.uid);
      console.log('Pending verification tasks:', pending);
      setPendingTasks(pending);

      // Get all tasks created/assigned BY current user (admin/teacher)
      const assignedByMe = await getCreatedTasks(currentUser.uid);
      console.log('All tasks assigned by me:', assignedByMe);
      setAllTasks(assignedByMe);

      // Calculate statistics
      calculateStatistics(assignedByMe);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (tasks) => {
    const pending = tasks.filter(t => t.status === TASK_STATUS.SUBMITTED).length;
    const completed = tasks.filter(t => t.completed).length;
    const revisionRequested = tasks.filter(t => t.status === TASK_STATUS.REVISION_REQUESTED).length;
    
    const completedWithRating = tasks.filter(t => t.completed && t.review?.rating);
    const avgRating = completedWithRating.length > 0
      ? completedWithRating.reduce((sum, t) => sum + (t.review?.rating || 0), 0) / completedWithRating.length
      : 0;

    setStatistics({
      pending,
      completed,
      revisionRequested,
      avgRating: Math.round(avgRating * 10) / 10
    });
  };

  const applyFilters = () => {
    let filtered = [...allTasks];

    // Tab filter
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(t => t.status === TASK_STATUS.SUBMITTED);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'revision':
        filtered = filtered.filter(t => t.status === TASK_STATUS.REVISION_REQUESTED);
        break;
      default:
        // all tasks
        break;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.assignedToName.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }

    setFilteredTasks(filtered);
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  const handleReviewTask = (task) => {
    setSelectedTask(task);
    setShowVerificationModal(true);
  };

  const handleTaskVerified = () => {
    showToast('Task reviewed successfully! ✅', 'success');
    setShowVerificationModal(false);
    setSelectedTask(null);
    loadTasks();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-700 border-green-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusBadge = (task) => {
    if (task.completed) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center space-x-1">
          <FaCheckCircle />
          <span>Completed</span>
        </span>
      );
    }
    if (task.status === TASK_STATUS.SUBMITTED) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse">
          <FaHourglassHalf />
          <span>Pending Review</span>
        </span>
      );
    }
    if (task.status === TASK_STATUS.REVISION_REQUESTED) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center space-x-1">
          <FaExclamationTriangle />
          <span>Revision Requested</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
        {task.status}
      </span>
    );
  };

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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <FaClipboardCheck className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Task Review Center
              </h1>
              <p className="text-gray-600 mt-1">Review and approve student submissions</p>
            </div>
          </div>

          {/* Urgent Badge */}
          {statistics.pending > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg"
            >
              <p className="text-sm font-medium">Pending Review</p>
              <p className="text-3xl font-bold">{statistics.pending}</p>
            </motion.div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FaHourglassHalf}
            label="Pending Review"
            value={statistics.pending}
            color="blue"
            highlight={statistics.pending > 0}
          />
          <StatCard
            icon={FaCheckCircle}
            label="Completed"
            value={statistics.completed}
            color="green"
          />
          <StatCard
            icon={FaExclamationTriangle}
            label="Needs Revision"
            value={statistics.revisionRequested}
            color="orange"
          />
          <StatCard
            icon={FaStar}
            label="Avg Rating"
            value={statistics.avgRating > 0 ? `${statistics.avgRating}/5` : 'N/A'}
            color="yellow"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by task, student, or category..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg"
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

          {/* Priority Filter */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-12 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-lg appearance-none cursor-pointer font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-6 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-lg">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaHourglassHalf className="inline mr-2" />
          Pending ({statistics.pending})
        </button>
        <button
          onClick={() => setActiveTab('revision')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'revision'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaExclamationTriangle className="inline mr-2" />
          Revision ({statistics.revisionRequested})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaCheckCircle className="inline mr-2" />
          Completed ({statistics.completed})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaChartLine className="inline mr-2" />
          All Tasks
        </button>
      </div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl"
      >
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <FaClipboardCheck className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No tasks found</p>
            <p className="text-gray-500 mt-2">
              {activeTab === 'pending' && 'No tasks pending review'}
              {activeTab === 'completed' && 'No completed tasks yet'}
              {activeTab === 'revision' && 'No tasks need revision'}
              {activeTab === 'all' && 'No tasks assigned yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onReview={handleReviewTask}
                getPriorityColor={getPriorityColor}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </AnimatePresence>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && selectedTask && (
          <TaskVerificationModal
            task={selectedTask}
            currentUserId={currentUser.uid}
            onClose={() => {
              setShowVerificationModal(false);
              setSelectedTask(null);
            }}
            onVerify={handleTaskVerified}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, color, highlight }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`bg-white border-2 rounded-2xl p-6 shadow-lg transition-all ${
        highlight ? 'border-red-300 ring-2 ring-red-200' : 'border-gray-200'
      }`}
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
// TASK CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TaskCard({ task, index, onReview, getPriorityColor, getStatusBadge }) {
  const isUrgent = task.status === TASK_STATUS.SUBMITTED;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
        isUrgent
          ? 'bg-blue-50 border-blue-300 hover:border-blue-400'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-3">
            {getStatusBadge(task)}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {task.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">{task.title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{task.description}</p>

          {/* Student Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-2">
              <FaUser className="text-blue-600" />
              <span className="font-medium">{task.assignedToName}</span>
            </div>
            {task.submittedAt && (
              <div className="flex items-center space-x-2">
                <FaClock className="text-orange-600" />
                <span>Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center space-x-2">
                <FaClock className="text-gray-600" />
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Submission Preview */}
          {task.submission && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-gray-700 mb-1">Submission:</p>
              <p className="text-sm text-gray-600 line-clamp-2">{task.submission.text}</p>
              {task.submission.links && task.submission.links.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {task.submission.links.length} proof link(s) attached
                </p>
              )}
            </div>
          )}

          {/* Review Info (if completed) */}
          {task.completed && task.review && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-xs font-bold text-green-700">Reviewed:</p>
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`text-sm ${
                      i < (task.review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              {task.review.comment && (
                <p className="text-sm text-green-700 line-clamp-1">{task.review.comment}</p>
              )}
              {task.momentumEarned && (
                <div className="flex items-center space-x-1 mt-1">
                  <FaFire className="text-orange-500" />
                  <span className="text-xs font-bold text-orange-700">
                    +{task.momentumEarned} momentum awarded
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="ml-4">
          {task.status === TASK_STATUS.SUBMITTED && (
            <button
              onClick={() => onReview(task)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2"
            >
              <FaEye />
              <span>Review Now</span>
            </button>
          )}
          {task.completed && (
            <button
              onClick={() => onReview(task)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all flex items-center space-x-2"
            >
              <FaEye />
              <span>View Details</span>
            </button>
          )}
          {task.status === TASK_STATUS.REVISION_REQUESTED && (
            <div className="text-center">
              <p className="text-xs text-orange-700 font-medium mb-2">Waiting for resubmission</p>
              <button
                onClick={() => onReview(task)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                <FaEye className="inline mr-1" />
                View
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TaskReview;
