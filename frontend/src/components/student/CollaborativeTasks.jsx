import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTasks, FaUserGraduate, FaUserFriends, FaPlus, FaCheck, FaTimes,
  FaClock, FaFire, FaTrophy, FaChartLine, FaFilter, FaBell, FaEye,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaExclamationTriangle, FaPaperPlane
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAssignedTasks,
  acceptPeerTask,
  rejectPeerTask,
  completeAssignedTask,
  getTaskStatistics,
  getTasksPendingVerification,
  TASK_TYPES,
  TASK_STATUS,
  PRIORITY_LEVELS
} from '../../services/collaborativeTaskService';
import Toast from '../Toast';
import AssignTaskModal from './AssignTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import TaskSubmissionModal from './TaskSubmissionModal';
import TaskVerificationModal from './TaskVerificationModal';

function CollaborativeTasks() {
  const { currentUser, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [pendingVerification, setPendingVerification] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadStatistics();
      loadPendingVerification();
    }
  }, [currentUser]);

  useEffect(() => {
    applyFilter();
  }, [tasks, activeFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const assignedTasks = await getAssignedTasks(currentUser.uid);
      setTasks(assignedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getTaskStatistics(currentUser.uid);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadPendingVerification = async () => {
    try {
      const pending = await getTasksPendingVerification(currentUser.uid);
      setPendingVerification(pending);
    } catch (error) {
      console.error('Error loading pending verification:', error);
    }
  };

  const applyFilter = () => {
    let filtered = [...tasks];

    switch (activeFilter) {
      case 'pending':
        filtered = tasks.filter(t => t.status === TASK_STATUS.PENDING);
        break;
      case 'accepted':
        filtered = tasks.filter(t => t.status === TASK_STATUS.ACCEPTED && !t.completed);
        break;
      case 'completed':
        filtered = tasks.filter(t => t.completed);
        break;
      case 'teacher':
        filtered = tasks.filter(t => t.taskType === TASK_TYPES.TEACHER_ASSIGNED);
        break;
      case 'peer':
        filtered = tasks.filter(t => t.taskType === TASK_TYPES.PEER_CHALLENGE);
        break;
      case 'overdue':
        filtered = tasks.filter(t => t.isOverdue && !t.completed);
        break;
      default:
        filtered = tasks;
    }

    setFilteredTasks(filtered);
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await acceptPeerTask(taskId, currentUser.uid);
      showToast('Task accepted! 🎯', 'success');
      loadTasks();
      loadStatistics();
    } catch (error) {
      console.error('Error accepting task:', error);
      showToast('Failed to accept task', 'error');
    }
  };

  const handleRejectTask = async (taskId) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await rejectPeerTask(taskId, currentUser.uid, reason || '');
      showToast('Task rejected', 'info');
      loadTasks();
      loadStatistics();
    } catch (error) {
      console.error('Error rejecting task:', error);
      showToast('Failed to reject task', 'error');
    }
  };

  const handleCompleteTask = (task) => {
    // Open submission modal instead of directly completing
    setSelectedTask(task);
    setShowSubmissionModal(true);
  };

  const handleSubmitTask = () => {
    showToast('Task submitted for review! 📝', 'success');
    loadTasks();
    loadStatistics();
  };

  const handleVerifyTask = (task) => {
    setSelectedTask(task);
    setShowVerificationModal(true);
  };

  const handleTaskVerified = () => {
    showToast('Task reviewed successfully! ✅', 'success');
    loadTasks();
    loadStatistics();
    loadPendingVerification();
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
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

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return '🚨';
    if (priority === 'high') return '⚠️';
    if (priority === 'medium') return '📌';
    return '📋';
  };

  const getTaskTypeIcon = (taskType) => {
    if (taskType === TASK_TYPES.TEACHER_ASSIGNED) return <FaUserGraduate className="text-blue-600" />;
    if (taskType === TASK_TYPES.PEER_CHALLENGE) return <FaUserFriends className="text-purple-600" />;
    return <FaTasks className="text-gray-600" />;
  };

  const getStatusBadge = (task) => {
    if (task.completed) {
      return (
        <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <FaCheckCircle />
          <span>Completed</span>
        </span>
      );
    }

    if (task.isOverdue) {
      return (
        <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <FaExclamationTriangle />
          <span>Overdue</span>
        </span>
      );
    }

    if (task.status === TASK_STATUS.PENDING) {
      return (
        <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
          <FaHourglassHalf />
          <span>Pending</span>
        </span>
      );
    }

    if (task.status === TASK_STATUS.ACCEPTED) {
      return (
        <span className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <FaClock />
          <span>In Progress</span>
        </span>
      );
    }

    return null;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaborative Tasks</h1>
          <p className="text-gray-600">Tasks assigned by teachers and peers</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <FaPlus />
          <span>Assign Task</span>
        </button>
      </motion.div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaTasks className="text-3xl text-blue-600" />
              <span className="text-3xl font-bold text-blue-900">{statistics.total}</span>
            </div>
            <p className="text-sm text-blue-700 font-medium">Total Tasks</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaCheckCircle className="text-3xl text-green-600" />
              <span className="text-3xl font-bold text-green-900">{statistics.completed}</span>
            </div>
            <p className="text-sm text-green-700 font-medium">Completed</p>
            <p className="text-xs text-green-600 mt-1">{statistics.completionRate}% completion rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaFire className="text-3xl text-orange-600" />
              <span className="text-3xl font-bold text-orange-900">{statistics.totalMomentumEarned}</span>
            </div>
            <p className="text-sm text-orange-700 font-medium">Momentum Earned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaUserGraduate className="text-3xl text-purple-600" />
              <span className="text-3xl font-bold text-purple-900">{statistics.byType.teacher}</span>
            </div>
            <p className="text-sm text-purple-700 font-medium">Teacher Tasks</p>
            <p className="text-xs text-purple-600 mt-1">{statistics.byType.peer} peer challenges</p>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-gray-200 rounded-xl p-4"
      >
        <div className="flex items-center space-x-2 overflow-x-auto">
          <FaFilter className="text-gray-600" />
          {[
            { id: 'all', label: 'All Tasks', icon: FaTasks },
            { id: 'pending', label: 'Pending', icon: FaHourglassHalf },
            { id: 'accepted', label: 'In Progress', icon: FaClock },
            { id: 'completed', label: 'Completed', icon: FaCheckCircle },
            { id: 'teacher', label: 'Teacher', icon: FaUserGraduate },
            { id: 'peer', label: 'Peer', icon: FaUserFriends },
            { id: 'overdue', label: 'Overdue', icon: FaExclamationTriangle }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <filter.icon className="text-sm" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-12 text-center"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {activeFilter === 'all'
                ? 'No tasks assigned yet. Ask your teacher or friends to assign you tasks!'
                : `No ${activeFilter} tasks at the moment.`}
            </p>
          </motion.div>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Task Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getTaskTypeIcon(task.taskType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                        <span className="text-xl">{getPriorityIcon(task.priority)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Assigned by <span className="font-semibold">{task.assignedByName}</span>
                        {task.assignedByRole === 'teacher' && ' (Teacher)'}
                        {task.assignedByRole === 'admin' && ' (Admin)'}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Task Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getStatusBadge(task)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {task.category && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {task.category}
                      </span>
                    )}
                    {task.subject && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {task.subject}
                      </span>
                    )}
                  </div>

                  {/* Task Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {task.dueDate && (
                      <span className={`flex items-center space-x-1 ${task.isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                        <FaClock />
                        <span>{formatDueDate(task.dueDate)}</span>
                      </span>
                    )}
                    {task.estimatedTime && (
                      <span className="flex items-center space-x-1">
                        <FaHourglassHalf />
                        <span>{task.estimatedTime} min</span>
                      </span>
                    )}
                    {task.momentumReward && !task.completed && (
                      <span className="flex items-center space-x-1 text-orange-600 font-semibold">
                        <FaFire />
                        <span>+{task.momentumReward} Momentum</span>
                      </span>
                    )}
                    {task.momentumEarned > 0 && (
                      <span className="flex items-center space-x-1 text-green-600 font-semibold">
                        <FaTrophy />
                        <span>Earned {task.momentumEarned} points</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(task)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>

                  {task.status === TASK_STATUS.PENDING && (
                    <>
                      <button
                        onClick={() => handleAcceptTask(task.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                      >
                        <FaCheck />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectTask(task.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                      >
                        <FaTimes />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {task.status === TASK_STATUS.ACCEPTED && !task.completed && (
                    <button
                      onClick={() => handleCompleteTask(task)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                    >
                      <FaPaperPlane />
                      <span>Submit</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignTaskModal
            onClose={() => setShowAssignModal(false)}
            onSuccess={() => {
              setShowAssignModal(false);
              loadTasks();
              loadStatistics();
            }}
          />
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedTask(null);
            }}
            onComplete={() => {
              handleCompleteTask(selectedTask);
              setShowDetailsModal(false);
              setSelectedTask(null);
            }}
            onAccept={() => {
              handleAcceptTask(selectedTask.id);
              setShowDetailsModal(false);
              setSelectedTask(null);
            }}
            onReject={() => {
              handleRejectTask(selectedTask.id);
              setShowDetailsModal(false);
              setSelectedTask(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Task Submission Modal */}
      <AnimatePresence>
        {showSubmissionModal && selectedTask && (
          <TaskSubmissionModal
            task={selectedTask}
            onClose={() => {
              setShowSubmissionModal(false);
              setSelectedTask(null);
            }}
            onSubmit={handleSubmitTask}
          />
        )}
      </AnimatePresence>

      {/* Task Verification Modal */}
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

      {/* Pending Verification Badge */}
      {pendingVerification.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button
            onClick={() => {
              if (pendingVerification[0]) {
                handleVerifyTask(pendingVerification[0]);
              }
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center space-x-3 transition-all"
          >
            <FaBell className="text-xl animate-bounce" />
            <div className="text-left">
              <p className="text-sm font-bold">Tasks to Review</p>
              <p className="text-xs">{pendingVerification.length} pending</p>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default CollaborativeTasks;
