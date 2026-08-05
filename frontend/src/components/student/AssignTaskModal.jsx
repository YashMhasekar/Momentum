import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUserFriends, FaSearch, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { assignTaskToStudent, PRIORITY_LEVELS } from '../../services/collaborativeTaskService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';

function AssignTaskModal({ onClose, onSuccess }) {
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'study',
    subject: '',
    priority: PRIORITY_LEVELS.MEDIUM,
    dueDate: '',
    estimatedTime: 60
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setError('');

      // Search by email or name
      const usersRef = collection(db, 'users');
      
      // Search by email
      const emailQuery = query(
        usersRef,
        where('email', '>=', searchQuery.toLowerCase()),
        where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        where('role', '==', 'student'),
        limit(10)
      );

      const emailSnapshot = await getDocs(emailQuery);
      const results = [];

      emailSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentUser.uid) { // Don't show current user
          results.push({
            id: doc.id,
            ...data
          });
        }
      });

      // If no email results, try searching by name
      if (results.length === 0) {
        const nameQuery = query(
          usersRef,
          where('fullName', '>=', searchQuery),
          where('fullName', '<=', searchQuery + '\uf8ff'),
          where('role', '==', 'student'),
          limit(10)
        );

        const nameSnapshot = await getDocs(nameQuery);
        nameSnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== currentUser.uid) {
            results.push({
              id: doc.id,
              ...data
            });
          }
        });
      }

      setSearchResults(results);

      if (results.length === 0) {
        setError('No students found. Try searching by email or full name.');
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setError('Failed to search students');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('Please select a student to assign the task to');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await assignTaskToStudent({
        assignedBy: currentUser.uid,
        assignedByName: userProfile?.fullName || currentUser.displayName || 'Unknown',
        assignedByRole: userProfile?.role || 'peer',
        assignedTo: selectedStudent.id,
        assignedToName: selectedStudent.fullName || selectedStudent.email,
        ...formData,
        requiresApproval: true // Peer tasks always require approval
      });

      onSuccess();
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Failed to assign task. Please try again.');
      setSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Assign Task to Friend</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </label>
            
            {selectedStudent ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {selectedStudent.fullName?.charAt(0) || selectedStudent.email?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedStudent.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                    {selectedStudent.department && (
                      <p className="text-xs text-gray-500">{selectedStudent.department}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-all"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    placeholder="Search by email or name..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center space-x-2"
                  >
                    {searching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                    <span>Search</span>
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {student.fullName?.charAt(0) || student.email?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{student.fullName}</p>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                          {student.department && (
                            <p className="text-xs text-gray-500">{student.department}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete DSA Assignment"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add task details..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category and Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="study">Study</option>
                <option value="assignment">Assignment</option>
                <option value="revision">Revision</option>
                <option value="coding">Coding</option>
                <option value="exam-prep">Exam Prep</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Data Structures"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={PRIORITY_LEVELS.LOW}>Low</option>
                <option value={PRIORITY_LEVELS.MEDIUM}>Medium</option>
                <option value={PRIORITY_LEVELS.HIGH}>High</option>
                <option value={PRIORITY_LEVELS.URGENT}>Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 60 })}
              min="15"
              max="480"
              step="15"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={submitting || !selectedStudent}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <FaUserFriends />
                  <span>Assign Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AssignTaskModal;
