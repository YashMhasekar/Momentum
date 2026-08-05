import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes, FaCheckCircle, FaTimesCircle, FaStar, FaLink, FaExternalLinkAlt
} from 'react-icons/fa';
import { verifyTaskCompletion } from '../../services/collaborativeTaskService';

function TaskVerificationModal({ task, onClose, onVerify, currentUserId }) {
  const [approved, setApproved] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!approved && !reviewComment.trim()) {
      setError('Please provide feedback when requesting revision');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await verifyTaskCompletion(task.id, currentUserId, {
        approved,
        reviewComment: reviewComment.trim(),
        rating: approved ? rating : 0
      });

      onVerify();
      onClose();
    } catch (err) {
      console.error('Error verifying task:', err);
      setError(err.message || 'Failed to verify task');
    } finally {
      setSubmitting(false);
    }
  };

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
        className="bg-white rounded-3xl border-2 border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-3xl p-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Review Task Submission</h2>
              <p className="text-white/80 text-sm">{task.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Details */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Task Details</h3>
            <p className="text-sm text-gray-700 mb-3">{task.description}</p>
            <div className="flex items-center space-x-4 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {task.category}
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                {task.priority}
              </span>
              <span className="text-gray-600">
                Submitted by: <span className="font-medium">{task.assignedToName}</span>
              </span>
            </div>
          </div>

          {/* Student's Submission */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center space-x-2">
              <span>📝</span>
              <span>Student's Submission</span>
            </h3>
            
            {/* Submission Text */}
            <div className="bg-white rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {task.submission?.text || 'No description provided'}
              </p>
            </div>

            {/* Submission Links */}
            {task.submission?.links && task.submission.links.length > 0 && (
              <div>
                <p className="text-xs font-bold text-blue-900 mb-2 flex items-center space-x-1">
                  <FaLink />
                  <span>Proof Links:</span>
                </p>
                <div className="space-y-2">
                  {task.submission.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-blue-50 rounded-lg text-sm text-blue-600 hover:text-blue-700 transition-all group"
                    >
                      <FaExternalLinkAlt className="text-xs" />
                      <span className="flex-1 truncate">{link}</span>
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Time */}
            <p className="text-xs text-blue-700 mt-3">
              Submitted: {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : 'N/A'}
            </p>
          </div>

          {/* Approval Toggle */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Review Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApproved(true)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  approved
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <FaCheckCircle className="text-2xl mx-auto mb-2" />
                <p className="font-bold">Approve</p>
                <p className="text-xs mt-1">Award momentum points</p>
              </button>
              <button
                type="button"
                onClick={() => setApproved(false)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !approved
                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <FaTimesCircle className="text-2xl mx-auto mb-2" />
                <p className="font-bold">Request Revision</p>
                <p className="text-xs mt-1">Send back for changes</p>
              </button>
            </div>
          </div>

          {/* Rating (only if approved) */}
          {approved && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Quality Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-110"
                  >
                    <FaStar
                      className={`text-3xl ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {rating === 5 && '⭐ Excellent!'}
                  {rating === 4 && '👍 Great work!'}
                  {rating === 3 && '✓ Good'}
                  {rating === 2 && '📝 Needs improvement'}
                  {rating === 1 && '⚠️ Poor'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {rating >= 4 ? '20% bonus momentum for high quality!' : 'Rate the quality of work'}
              </p>
            </div>
          )}

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Feedback {!approved && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                approved
                  ? 'Great work! (Optional feedback)'
                  : 'Explain what needs to be improved...'
              }
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              required={!approved}
            />
            <p className="text-xs text-gray-600 mt-1">
              {approved
                ? 'Provide encouragement or suggestions (optional)'
                : 'Explain what needs to be changed or improved'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Momentum Info (if approved) */}
          {approved && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="text-sm font-bold text-yellow-900 mb-1">Momentum Reward</p>
                  <p className="text-sm text-yellow-800">
                    Student will earn momentum points based on task priority and completion timing.
                    {rating >= 4 && ' Plus 20% bonus for excellent work!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                approved
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {approved ? <FaCheckCircle /> : <FaTimesCircle />}
                  <span>{approved ? 'Approve & Award Points' : 'Request Revision'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default TaskVerificationModal;
