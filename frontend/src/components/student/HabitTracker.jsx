import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaCheckCircle, FaCircle, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserHabits,
  createHabit,
  completeHabit,
  uncompleteHabit,
  deleteHabit,
  isCompletedToday,
  getCompletionRate
} from '../../services/habitService';
import Toast from '../Toast';

function HabitTracker() {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'study',
    targetDays: 30
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (currentUser) {
      loadHabits();
    }
  }, [currentUser]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  const loadHabits = async () => {
    try {
      setLoading(true);
      const userHabits = await getUserHabits(currentUser.uid);
      setHabits(userHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      showToast('Failed to load habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) {
      showToast('Please enter a habit name', 'error');
      return;
    }

    try {
      await createHabit(currentUser.uid, newHabit);
      showToast('Habit created successfully! 🎉', 'success');
      setShowAddModal(false);
      setNewHabit({ name: '', description: '', category: 'study', targetDays: 30 });
      loadHabits();
    } catch (error) {
      console.error('Error creating habit:', error);
      showToast('Failed to create habit', 'error');
    }
  };

  const handleToggleComplete = async (habit) => {
    try {
      if (isCompletedToday(habit)) {
        await uncompleteHabit(habit.id, habit);
        showToast('Habit unmarked', 'info');
      } else {
        await completeHabit(habit.id, habit);
        showToast('Great job! Keep it up! 🔥', 'success');
      }
      loadHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      showToast('Failed to update habit', 'error');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) {
      return;
    }

    try {
      await deleteHabit(habitId);
      showToast('Habit deleted', 'info');
      loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      showToast('Failed to delete habit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Habit Tracker</h1>
        <p className="text-gray-600">Build consistent study habits</p>
      </motion.div>

      {habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-12 text-center"
        >
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
          <p className="text-gray-600 mb-6">Start building positive study habits today!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all"
          >
            Create Your First Habit
          </button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {habits.map((habit, index) => {
            const completed = isCompletedToday(habit);
            const completionRate = getCompletionRate(habit);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow relative"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <FaTrash />
                </button>

                <div className="flex items-center justify-between mb-4 pr-8">
                  <h3 className="text-xl font-semibold text-gray-900">{habit.name}</h3>
                  <button
                    onClick={() => handleToggleComplete(habit)}
                    className="flex-shrink-0"
                  >
                    {completed ? (
                      <FaCheckCircle className="text-3xl text-green-600 hover:scale-110 transition-transform" />
                    ) : (
                      <FaCircle className="text-3xl text-gray-300 hover:text-gray-400 hover:scale-110 transition-all" />
                    )}
                  </button>
                </div>

                {habit.description && (
                  <p className="text-sm text-gray-600 mb-4">{habit.description}</p>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <FaFire className="text-orange-500" />
                  <span className="text-gray-700 font-medium">{habit.streak} day streak</span>
                  {habit.longestStreak > 0 && (
                    <span className="text-xs text-gray-500">(Best: {habit.longestStreak})</span>
                  )}
                </div>

                <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min((habit.streak / habit.targetDays) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">{habit.streak} / {habit.targetDays} days</p>
                  <p className="text-xs text-gray-500">{completionRate}% completion rate</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add New Habit Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowAddModal(true)}
        className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
      >
        <FaPlus />
        <span>Add New Habit</span>
      </motion.button>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Habit</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Study 2 hours daily"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    placeholder="Add more details about this habit..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="study">Study</option>
                    <option value="health">Health</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Days
                  </label>
                  <input
                    type="number"
                    value={newHabit.targetDays}
                    onChange={(e) => setNewHabit({ ...newHabit, targetDays: parseInt(e.target.value) || 30 })}
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHabit}
                  className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all"
                >
                  Create Habit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HabitTracker;
