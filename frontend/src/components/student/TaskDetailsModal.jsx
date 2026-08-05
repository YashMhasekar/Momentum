import React from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes, FaUserGraduate, FaUserFriends, FaClock, FaFire,
  FaCheckCircle, FaTimesCircle, FaCalendar, FaBook, FaFlag
} from 'react-icons/fa';
import { TASK_TYPES, TASK_STATUS } from '../../services/collaborativeTaskService';

function TaskDetailsModal({ task, onClose, onComplete, onAccept, onReject }) {
  const getTaskTypeInfo = () => {
    if (task.taskType === TASK_TYPES.TEACHER_ASSIGNED) {
      return {
        icon: <FaUserGraduate className="text-blue-600" />,
        label: 'Teacher Assignment',
        color: 'bg-blue-100 text-blue-700 border-blue-300'
      };
    }
    return {
      icon: <FaUserFriends className="text-purple-600" />,
      label: 'Peer Challenge',
      color: 'bg-purple-100 text-purple-700 border-purple-300'
    };
  };

  const getPriorityInfo = () => {
    const priorities = {
      low: { label: 'Low Priority', color: 'bg-green-100 text-green-700', emoji: '📋' },
      medium: { label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700', emoji: '📌' },
      high: { label: 'High Priority', color: 'bg-orange-100 text-orange-700', emoji: '⚠️' },
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', emoji: '🚨' }
    };
    return priorities[task.priority] || priorities.medium;
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const taskTypeInfo = getTaskTypeInfo();
  const priorityInfo = getPriorityInfo();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                {taskTypeInfo.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                <p className="text-sm text-gray-600">
                  Assigned by <span className="font-semibold">{task.assignedByName}</span>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0 ml-4"
          >
            <FaTimes />
          </button>
        </div>

        {/* Status and Type Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${taskTypeInfo.color}`}>
            {taskTypeInfo.icon}
            <span className="font-medium">{taskTypeInfo.label}</span>
          </span>
          
          <span className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${priorityInfo.color}`}>
            <span>{priorityInfo.emoji}</span>
            <span className="font-medium">{priorityInfo.label}</span>
          </span>

          {task.completed && (
            <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
              <FaCheckCircle />
              <span className="font-medium">Completed</span>
            </span>
          )}

          {task.isOverdue && !task.completed && (
            <span className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
              <FaClock />
              <span className="font-medium">Overdue</span>
            </span>
          )}

          {task.status === TASK_STATUS.PENDING && (
            <span className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
              <FaClock />
              <span className="font-medium">Pending Approval</span>
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {task.category && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaBook />
                <span className="text-sm font-medium">Category</span>
              </div>
              <p className="text-gray-900 font-semibold capitalize">{task.category}</p>
            </div>
          )}

          {task.subject && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaBook />
                <span className="text-sm font-medium">Subject</span>
              </div>
              <p className="text-gray-900 font-semibold">{task.subject}</p>
            </div>
          )}

          {task.dueDate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaCalendar />
                <span className="text-sm font-medium">Due Date</span>
              </div>
              <p className={`font-semibold ${task.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(task.dueDate)}
              </p>
            </div>
          )}

          {task.estimatedTime && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaClock />
                <span className="text-sm font-medium">Estimated Time</span>
              </div>
              <p className="text-gray-900 font-semibold">{formatTime(task.estimatedTime)}</p>
            </div>
          )}

          {task.momentumReward && !task.completed && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-1">
                <FaFire />
                <span className="text-sm font-medium">Momentum Reward</span>
              </div>
              <p className="text-orange-900 font-bold text-lg">+{task.momentumReward} points</p>
            </div>
          )}

          {task.momentumEarned > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <FaCheckCircle />
                <span className="text-sm font-medium">Momentum Earned</span>
              </div>
              <p className="text-green-900 font-bold text-lg">{task.momentumEarned} points</p>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned:</span>
              <span className="text-gray-900 font-medium">
                {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
            {task.acceptedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Accepted:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(task.acceptedAt).toLocaleString()}
                </span>
              </div>
            )}
            {task.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="text-green-600 font-medium">
                  {new Date(task.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {task.status === TASK_STATUS.PENDING && (
            <>
              <button
                onClick={onAccept}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <FaCheckCircle />
                <span>Accept Task</span>
              </button>
              <button
                onClick={onReject}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <FaTimesCircle />
                <span>Reject Task</span>
              </button>
            </>
          )}

          {task.status === TASK_STATUS.ACCEPTED && !task.completed && (
            <button
              onClick={onComplete}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <FaCheckCircle />
              <span>Mark as Complete</span>
            </button>
          )}

          {task.completed && (
            <div className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center justify-center space-x-2">
              <FaCheckCircle />
              <span>Task Completed</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TaskDetailsModal;
