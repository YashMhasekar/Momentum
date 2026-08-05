import React from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes, FaTrophy, FaFire, FaClock, FaBrain, FaChartLine,
  FaTasks, FaGraduationCap, FaHeart, FaAward, FaStar, FaGem
} from 'react-icons/fa';

function StudentProfileModal({ student, onClose }) {
  if (!student) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl border-2 border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Cover */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-3xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
          >
            <FaTimes />
          </button>

          {/* Rank Badge */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
            <p className="text-white text-sm font-medium">Rank</p>
            <p className="text-white text-3xl font-bold">#{student.rank}</p>
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-32 rounded-full bg-white shadow-2xl overflow-hidden border-4 border-white">
              {student.photoURL ? (
                <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold">
                  {student.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Podium Medal */}
            {student.podiumMedal && (
              <div className="absolute -top-2 -right-2 text-4xl">
                {student.podiumMedal}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-8 pb-8">
          {/* Name and Department */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h2>
            <p className="text-gray-600 text-lg">{student.department}</p>
            <p className="text-gray-500 text-sm">{student.email}</p>
          </div>

          {/* Achievement Badges */}
          {student.badges && student.badges.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FaAward className="text-yellow-500" />
                <span>Achievement Badges</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {student.badges.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 text-center"
                    style={{ borderColor: badge.color + '40', backgroundColor: badge.color + '10' }}
                  >
                    <div className="text-4xl mb-2">{badge.emoji}</div>
                    <p className="text-sm font-bold text-gray-900">{badge.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Momentum Score */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <FaChartLine className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Momentum Score</p>
                    <p className="text-3xl font-bold text-blue-900">{student.momentumScore}</p>
                  </div>
                </div>
                {student.momentumGrowth > 0 && (
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    +{student.momentumGrowth}
                  </div>
                )}
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${student.momentumScore}%` }}
                />
              </div>
            </div>

            {/* Study Hours */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <FaClock className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Total Study Hours</p>
                  <p className="text-3xl font-bold text-green-900">{student.totalStudyHours}h</p>
                </div>
              </div>
              <p className="text-sm text-green-700">
                {(student.totalStudyHours / 7).toFixed(1)}h per day average
              </p>
            </div>

            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <FaFire className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-900">{student.streak} days</p>
                </div>
              </div>
              <p className="text-sm text-orange-700">Keep the momentum going! 🔥</p>
            </div>

            {/* Productive Score */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <FaBrain className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Productive Score</p>
                  <p className="text-3xl font-bold text-purple-900">{student.focusScore}%</p>
                </div>
              </div>
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${student.focusScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={FaTasks}
              label="Tasks Completed"
              value={student.completedTasks}
              color="blue"
            />
            <StatCard
              icon={FaTrophy}
              label="Completion Rate"
              value={`${Math.round(student.completionRate)}%`}
              color="green"
            />
            <StatCard
              icon={FaGraduationCap}
              label="Focus Sessions"
              value={student.focusSessions}
              color="purple"
            />
            <StatCard
              icon={FaStar}
              label="Percentile"
              value={`Top ${100 - Math.round((student.rank / 100) * 100)}%`}
              color="yellow"
            />
          </div>

          {/* Momentum Breakdown */}
          {student.momentumBreakdown && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FaGem className="text-blue-500" />
                <span>Momentum Breakdown</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(student.momentumBreakdown).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">+{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-xl p-4 text-center`}>
      <Icon className="text-2xl mx-auto mb-2" />
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default StudentProfileModal;
