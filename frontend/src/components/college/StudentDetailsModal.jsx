import React from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes, FaUser, FaEnvelope, FaGraduationCap, FaCalendar,
  FaFire, FaClock, FaChartLine, FaTasks, FaBook, FaPhone
} from 'react-icons/fa';

function StudentDetailsModal({ student, onClose, onAssignTask }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {student.fullName?.[0] || student.email?.[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.fullName || 'Unknown Student'}</h2>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Basic Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaGraduationCap />
                <span className="text-sm font-medium">Department</span>
              </div>
              <p className="text-gray-900 font-semibold">{student.department || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaBook />
                <span className="text-sm font-medium">Semester</span>
              </div>
              <p className="text-gray-900 font-semibold">{student.semester || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaCalendar />
                <span className="text-sm font-medium">Roll Number</span>
              </div>
              <p className="text-gray-900 font-semibold">{student.rollNumber || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-1">
                <FaPhone />
                <span className="text-sm font-medium">Phone</span>
              </div>
              <p className="text-gray-900 font-semibold">{student.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-2">
                <FaFire className="text-xl" />
                <span className="text-sm font-medium">Momentum Score</span>
              </div>
              <p className="text-3xl font-bold text-orange-900">{student.momentumScore || 0}</p>
              <p className="text-xs text-orange-600 mt-1">
                {(student.momentumScore || 0) >= 70 ? 'Excellent!' : 
                 (student.momentumScore || 0) >= 40 ? 'Good' : 
                 'Needs Improvement'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <FaFire className="text-xl" />
                <span className="text-sm font-medium">Current Streak</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{student.streak || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Days consecutive</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-green-600 mb-2">
                <FaClock className="text-xl" />
                <span className="text-sm font-medium">Study Hours</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{(student.totalStudyHours || 0).toFixed(1)}h</p>
              <p className="text-xs text-green-600 mt-1">Total tracked</p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        {(student.interests || student.githubSkills || student.bio) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
            
            {student.bio && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Bio</p>
                <p className="text-gray-600 text-sm">{student.bio}</p>
              </div>
            )}

            {student.interests && student.interests.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {student.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {student.githubSkills && student.githubSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {student.githubSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="text-gray-900 font-mono text-xs">{student.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">College:</span>
              <span className="text-gray-900 font-medium">{student.collegeName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Joined:</span>
              <span className="text-gray-900 font-medium">{formatDate(student.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Active:</span>
              <span className="text-gray-900 font-medium">{formatDate(student.lastActive)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onAssignTask}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <FaTasks />
            <span>Assign Task</span>
          </button>
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

export default StudentDetailsModal;
