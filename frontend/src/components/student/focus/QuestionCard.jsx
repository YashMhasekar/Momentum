import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

function QuestionCard({ question, answer, onAnswer, questionNumber }) {
  const handleMCQAnswer = (option) => {
    onAnswer(question.id, option);
  };

  const handleTrueFalseAnswer = (value) => {
    onAnswer(question.id, value);
  };

  const handleShortAnswer = (e) => {
    onAnswer(question.id, e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {questionNumber}
        </div>
        <div className="flex-1">
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold mb-3">
            {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'truefalse' ? 'True/False' : 'Short Answer'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
            {question.question}
          </h3>
        </div>
      </div>

      {/* Answer Options */}
      <div className="ml-14">
        {question.type === 'mcq' && (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = answer === option;
              return (
                <motion.button
                  key={index}
                  onClick={() => handleMCQAnswer(option)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center space-x-3 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
                  }`}>
                    {isSelected && <FaCheckCircle className="text-white text-sm" />}
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
                    {option}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {question.type === 'truefalse' && (
          <div className="flex space-x-4">
            <motion.button
              onClick={() => handleTrueFalseAnswer(true)}
              className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                answer === true
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  answer === true ? 'border-green-600 bg-green-600' : 'border-gray-400'
                }`}>
                  {answer === true && <FaCheckCircle className="text-white" />}
                </div>
                <span className={`text-lg font-bold ${answer === true ? 'text-green-900' : 'text-gray-700'}`}>
                  True
                </span>
              </div>
            </motion.button>

            <motion.button
              onClick={() => handleTrueFalseAnswer(false)}
              className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                answer === false
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  answer === false ? 'border-red-600 bg-red-600' : 'border-gray-400'
                }`}>
                  {answer === false && <FaCheckCircle className="text-white" />}
                </div>
                <span className={`text-lg font-bold ${answer === false ? 'text-red-900' : 'text-gray-700'}`}>
                  False
                </span>
              </div>
            </motion.button>
          </div>
        )}

        {question.type === 'short' && (
          <div>
            <textarea
              value={answer || ''}
              onChange={handleShortAnswer}
              placeholder="Type your answer here..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 Tip: Explain your answer clearly and include key concepts
            </p>
          </div>
        )}
      </div>

      {/* Answer Status Indicator */}
      {answer !== undefined && answer !== '' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-14 flex items-center space-x-2 text-green-600"
        >
          <FaCheckCircle />
          <span className="text-sm font-medium">Answer recorded</span>
        </motion.div>
      )}
    </div>
  );
}

export default QuestionCard;
