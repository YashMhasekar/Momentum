import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes, FaPaperPlane, FaFileUpload, FaLink, FaCheckCircle
} from 'react-icons/fa';
import { submitTaskForVerification } from '../../services/collaborativeTaskService';

function TaskSubmissionModal({ task, onClose, onSubmit }) {
  const [submissionText, setSubmissionText] = useState('');
  const [submissionLinks, setSubmissionLinks] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddLink = () => {
    setSubmissionLinks([...submissionLinks, '']);
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...submissionLinks];
    newLinks[index] = value;
    setSubmissionLinks(newLinks);
  };

  const handleRemoveLink = (index) => {
    const newLinks = submissionLinks.filter((_, i) => i !== index);
    setSubmissionLinks(newLinks.length > 0 ? newLinks : ['']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submissionText.trim()) {
      setError('Please provide a description of what you completed');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const validLinks = submissionLinks.filter(link => link.trim() !== '');

      console.log('Submitting task:', {
        taskId: task.id,
        userId: task.assignedTo,
        assignedBy: task.assignedBy,
        submissionText: submissionText.trim(),
        validLinks
      });

      await submitTaskForVerification(task.id, task.assignedTo, {
        submissionText: submissionText.trim(),
        submissionLinks: validLinks,
        submissionFiles: [] // Can be extended for file uploads
      });

      console.log('Task submitted successfully');
      onSubmit();
      onClose();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError(err.message || 'Failed to submit task');
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
        className="bg-white rounded-3xl border-2 border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-3xl p-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Submit Task</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Details */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Task Details</h3>
            <p className="text-sm text-gray-700 mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {task.category}
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                {task.priority}
              </span>
              {task.dueDate && (
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Submission Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              What did you complete? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe what you completed, how you approached it, and any challenges you faced..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Provide detailed information about your work
            </p>
          </div>

          {/* Proof Links */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <FaLink />
              <span>Proof Links (Optional)</span>
            </label>
            <div className="space-y-2">
              {submissionLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="https://github.com/yourrepo or https://drive.google.com/..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {submissionLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="px-3 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all"
            >
              + Add Another Link
            </button>
            <p className="text-xs text-gray-600 mt-2">
              Add links to GitHub repos, Google Drive files, screenshots, or any proof of completion
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <FaCheckCircle className="text-blue-600 text-xl mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">What happens next?</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your submission will be sent to {task.assignedByName} for review</li>
                  <li>• They will verify your work and provide feedback</li>
                  <li>• Once approved, you'll earn momentum points!</li>
                  <li>• If revision is needed, you'll be notified with feedback</li>
                </ul>
              </div>
            </div>
          </div>

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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default TaskSubmissionModal;
