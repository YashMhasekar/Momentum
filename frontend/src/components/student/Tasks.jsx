import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaCheck, FaTimes, FaEdit, FaTrash, FaClock,
  FaCalendar, FaFlag, FaRedo, FaSpinner, FaLightbulb,
  FaFire, FaChartLine, FaBell, FaGoogle, FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserTasks,
  getTodayTasks,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  calculateTaskStats,
  getTaskInsights,
  taskCategories,
  priorityLevels,
  recurringTypes
} from '../../services/taskService';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createRecurringCalendarEvent
} from '../../services/calendarService';
import { showSuccess, showError, showLoading, updateToast } from '../../services/toastService';

function Tasks() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, today, pending, completed
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'study',
    subject: '',
    priority: 'medium',
    estimatedTime: 30,
    recurring: false,
    recurringType: 'none',
    dueDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    syncToCalendar: false,
    reminderType: []
  });

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [allTasks, today] = await Promise.all([
        getUserTasks(currentUser.uid),
        getTodayTasks(currentUser.uid)
      ]);
      setTasks(allTasks);
      setTodayTasks(today);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const toastId = showLoading('Creating task...');

    try {
      // Create task in Firestore
      const task = await createTask(currentUser.uid, newTask);

      // Sync to Google Calendar if enabled
      if (newTask.syncToCalendar && userProfile?.googleAccessToken) {
        updateToast(toastId, 'info', 'Syncing to Google Calendar...');

        try {
          let calendarData;

          if (newTask.recurring && newTask.recurringType !== 'none') {
            // Create recurring event
            calendarData = await createRecurringCalendarEvent(
              userProfile.googleAccessToken,
              {
                title: newTask.title,
                description: newTask.description,
                subject: newTask.subject,
                dueDate: newTask.dueDate,
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                reminderType: newTask.reminderType,
                priority: newTask.priority,
                category: newTask.category,
                recurringType: newTask.recurringType
              }
            );
          } else {
            // Create single event
            calendarData = await createCalendarEvent(
              userProfile.googleAccessToken,
              {
                title: newTask.title,
                description: newTask.description,
                subject: newTask.subject,
                dueDate: newTask.dueDate,
                startTime: newTask.startTime,
                endTime: newTask.endTime,
                reminderType: newTask.reminderType,
                priority: newTask.priority,
                category: newTask.category
              }
            );
          }

          // Update task with calendar info
          await updateTask(task.id, {
            googleEventId: calendarData.googleEventId,
            calendarLink: calendarData.calendarLink,
            isCalendarSynced: true
          });

          updateToast(toastId, 'success', '✅ Task created and synced to Google Calendar!');
        } catch (calendarError) {
          console.error('Calendar sync error:', calendarError);
          updateToast(toastId, 'warning', 'Task created but calendar sync failed');
        }
      } else {
        updateToast(toastId, 'success', '✅ Task created successfully!');
      }

      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        category: 'study',
        subject: '',
        priority: 'medium',
        estimatedTime: 30,
        recurring: false,
        recurringType: 'none',
        dueDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        syncToCalendar: false,
        reminderType: []
      });
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      updateToast(toastId, 'error', '❌ Failed to create task');
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    const task = tasks.find(t => t.id === taskId);
    const toastId = showLoading('Updating task...');

    try {
      await toggleTaskCompletion(taskId, !completed, currentUser?.uid);

      // Update calendar event if synced
      if (task?.isCalendarSynced && task?.googleEventId && userProfile?.googleAccessToken) {
        try {
          await updateCalendarEvent(
            userProfile.googleAccessToken,
            task.googleEventId,
            {
              ...task,
              completed: !completed
            }
          );
          updateToast(toastId, 'success', !completed ? '✅ Task completed!' : '⏳ Task marked as incomplete');
        } catch (calendarError) {
          console.error('Calendar update error:', calendarError);
          updateToast(toastId, 'warning', 'Task updated but calendar sync failed');
        }
      } else {
        updateToast(toastId, 'success', !completed ? '✅ Task completed!' : '⏳ Task marked as incomplete');
      }

      loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
      updateToast(toastId, 'error', '❌ Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    const toastId = showLoading('Deleting task...');

    try {
      // Delete from calendar if synced
      if (task?.isCalendarSynced && task?.googleEventId && userProfile?.googleAccessToken) {
        try {
          await deleteCalendarEvent(userProfile.googleAccessToken, task.googleEventId);
        } catch (calendarError) {
          console.error('Calendar delete error:', calendarError);
          // Continue with task deletion even if calendar delete fails
        }
      }

      await deleteTask(taskId);
      updateToast(toastId, 'success', '✅ Task deleted successfully!');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      updateToast(toastId, 'error', '❌ Failed to delete task');
    }
  };

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Apply status filter
    switch (filter) {
      case 'today':
        filtered = todayTasks;
        break;
      case 'pending':
        filtered = tasks.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = tasks.filter(t => t.completed);
        break;
      default:
        filtered = tasks;
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const stats = calculateTaskStats(tasks);
  const insights = getTaskInsights(tasks);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600">Manage your daily tasks and build productive habits</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
        >
          <FaPlus />
          <span>Add Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Tasks</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheck className="text-2xl text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.completed}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-2xl text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaFire className="text-2xl text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{stats.completionRate}%</p>
          <p className="text-sm text-gray-600">Completion Rate</p>
        </motion.div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaLightbulb className="text-blue-600 text-xl" />
            <h3 className="font-semibold text-blue-900">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm text-blue-700">
                • {insight.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex space-x-2">
            {['all', 'today', 'pending', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1"></div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="all">All Categories</option>
            {taskCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <FaClock className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-600 mb-2">No tasks found</p>
            <p className="text-sm text-gray-500">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTask}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <TaskModal
            task={newTask}
            setTask={setNewTask}
            onSubmit={handleCreateTask}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onToggle, onDelete }) {
  const category = taskCategories.find(c => c.id === task.category);
  const priority = priorityLevels.find(p => p.id === task.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          {task.completed && <FaCheck className="text-white text-xs" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className={`font-semibold text-gray-900 ${task.completed ? 'line-through opacity-50' : ''}`}>
                {task.title}
              </h3>
              {task.isCalendarSynced && task.calendarLink && (
                <a
                  href={task.calendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  <FaGoogle className="text-xs" />
                  <span>View in Google Calendar</span>
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              )}
            </div>
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <FaTrash />
            </button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Badge */}
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${category?.color}20`,
                color: category?.color
              }}
            >
              {category?.name}
            </span>

            {/* Priority Badge */}
            <span
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${priority?.color}20`,
                color: priority?.color
              }}
            >
              <FaFlag className="text-xs" />
              <span>{priority?.name}</span>
            </span>

            {/* Calendar Sync Badge */}
            {task.isCalendarSynced && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <FaGoogle className="text-xs" />
                <span>Synced</span>
              </span>
            )}

            {/* Recurring Badge */}
            {task.recurring && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                <FaRedo className="text-xs" />
                <span>{task.recurringType}</span>
              </span>
            )}

            {/* Time Badge */}
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              <FaClock className="text-xs" />
              <span>{task.estimatedTime}min</span>
            </span>

            {/* Time Range */}
            {task.startTime && task.endTime && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                <FaClock className="text-xs" />
                <span>{task.startTime} - {task.endTime}</span>
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                <FaCalendar className="text-xs" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </span>
            )}

            {/* Subject */}
            {task.subject && (
              <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {task.subject}
              </span>
            )}

            {/* Reminders */}
            {task.reminderType && task.reminderType.length > 0 && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                <FaBell className="text-xs" />
                <span>{task.reminderType.length} reminder{task.reminderType.length > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Task Modal Component
function TaskModal({ task, setTask, onSubmit, onClose }) {
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
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Task</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Complete DSA assignment"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Add more details..."
            />
          </div>

          {/* Category and Subject */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={task.category}
                onChange={(e) => setTask({ ...task, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {taskCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={task.subject}
                onChange={(e) => setTask({ ...task, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., Data Structures"
              />
            </div>
          </div>

          {/* Priority and Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {priorityLevels.map(pri => (
                  <option key={pri.id} value={pri.id}>{pri.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={task.estimatedTime}
                onChange={(e) => setTask({ ...task, estimatedTime: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                min="5"
                step="5"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Time Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={task.startTime}
                onChange={(e) => setTask({ ...task, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={task.endTime}
                onChange={(e) => setTask({ ...task, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Google Calendar Sync */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={task.syncToCalendar}
                onChange={(e) => setTask({ ...task, syncToCalendar: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <FaGoogle className="text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Add to Google Calendar</span>
              </div>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              Automatically sync this task to your Google Calendar with reminders
            </p>
          </div>

          {/* Reminders */}
          {task.syncToCalendar && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <FaBell className="inline mr-2" />
                Reminders
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: '10min', label: '10 minutes before' },
                  { id: '30min', label: '30 minutes before' },
                  { id: '1hour', label: '1 hour before' },
                  { id: '1day', label: '1 day before' },
                  { id: 'email', label: 'Email reminder' }
                ].map((reminder) => (
                  <label key={reminder.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.reminderType?.includes(reminder.id) || false}
                      onChange={(e) => {
                        const currentReminders = task.reminderType || [];
                        if (e.target.checked) {
                          setTask({ ...task, reminderType: [...currentReminders, reminder.id] });
                        } else {
                          setTask({ ...task, reminderType: currentReminders.filter(r => r !== reminder.id) });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{reminder.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Recurring */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={task.recurring}
                onChange={(e) => setTask({ ...task, recurring: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-medium text-gray-700">Make this a recurring task</span>
            </label>
          </div>

          {/* Recurring Type */}
          {task.recurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat
              </label>
              <select
                value={task.recurringType}
                onChange={(e) => setTask({ ...task, recurringType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {recurringTypes.filter(r => r.id !== 'none').map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default Tasks;
