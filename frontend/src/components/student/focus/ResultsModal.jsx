import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes, FaTrophy, FaStar, FaCheckCircle, FaTimesCircle, 
  FaFire, FaBrain, FaChartLine 
} from 'react-icons/fa';

function ResultsModal({ result, topic, onClose, onRetake }) {
  const { totalScore, confidence, learningQuality, feedback, passed, evaluations, totalQuestions, correctAnswers } = result;

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 75) return 'from-blue-500 to-indigo-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getConfidenceLabel = (conf) => {
    const labels = {
      'excellent': '🌟 Excellent',
      'high': '💪 High',
      'medium': '👍 Medium',
      'low': '📚 Low',
      'very-low': '💡 Very Low'
    };
    return labels[conf] || conf;
  };

  const getLearningQualityLabel = (quality) => {
    const labels = {
      'excellent': '🎯 Excellent Understanding',
      'good': '✅ Good Understanding',
      'fair': '📖 Fair Understanding',
      'needs-improvement': '📚 Needs Improvement'
    };
    return labels[quality] || quality;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl border-2 border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${getScoreColor(totalScore)} p-6 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"
                >
                  {passed ? (
                    <FaTrophy className="text-4xl" />
                  ) : (
                    <FaBrain className="text-4xl" />
                  )}
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold">
                    {passed ? 'Test Passed! 🎉' : 'Test Complete'}
                  </h2>
                  <p className="text-white/90 text-sm mt-1">Topic: {topic}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center my-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 150, delay: 0.3 }}
                className="relative"
              >
                <svg className="w-48 h-48" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - totalScore / 100)}`}
                    transform="rotate(-90 100 100)"
                    initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - totalScore / 100) }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-6xl font-bold"
                  >
                    {totalScore}
                  </motion.p>
                  <p className="text-xl font-medium text-white/90">out of 100</p>
                </div>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</p>
                <p className="text-sm text-white/80">Correct</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{getConfidenceLabel(confidence)}</p>
                <p className="text-sm text-white/80">Confidence</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{getLearningQualityLabel(learningQuality).split(' ')[0]}</p>
                <p className="text-sm text-white/80">Quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
          {/* Feedback */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <FaStar className="text-2xl text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Overall Feedback</h3>
                <p className="text-gray-700 leading-relaxed">{feedback}</p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <FaChartLine className="text-purple-600" />
              <span>Question-by-Question Results</span>
            </h3>

            {evaluations.map((evaluation, index) => (
              <motion.div
                key={evaluation.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-xl p-4 ${
                  evaluation.correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    evaluation.correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {evaluation.correct ? (
                      <FaCheckCircle className="text-white" />
                    ) : (
                      <FaTimesCircle className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">Question {index + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        evaluation.correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {evaluation.score}/20 points
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{evaluation.feedback}</p>
                    {evaluation.explanation && (
                      <p className="text-sm text-gray-600 italic">💡 {evaluation.explanation}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Momentum Earned */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaFire className="text-3xl text-orange-500" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Momentum Earned</h3>
                  <p className="text-sm text-gray-600">Your focus score has been updated!</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-600">
                  +{totalScore >= 90 ? 50 : totalScore >= 75 ? 35 : totalScore >= 60 ? 20 : 10}
                </p>
                <p className="text-sm text-gray-600">points</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white border-2 border-gray-300 hover:bg-gray-100 rounded-xl text-gray-900 font-bold transition-all"
            >
              Close
            </button>
            {!passed && onRetake && (
              <button
                onClick={onRetake}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
              >
                Retake Test
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ResultsModal;
