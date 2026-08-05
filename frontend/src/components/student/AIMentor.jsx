import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain,
  FaPaperPlane,
  FaLightbulb,
  FaSpinner,
  FaTrash,
  FaHistory,
  FaExclamationTriangle,
  FaRedo
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  sendMessageToAI,
  sendMessageWithStressAnalysis,
  saveChatMessage,
  loadChatHistory,
  clearChatHistory
} from '../../services/aiMentorService';

function AIMentor() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #9333ea, #3b82f6);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #7e22ce, #2563eb);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const quickPrompts = [
    { icon: '📚', text: 'Create my study plan' },
    { icon: '🎯', text: 'Help me focus better' },
    { icon: '💪', text: 'Motivate me to study' },
    { icon: '🧠', text: 'Explain difficult concepts' },
    { icon: '⚡', text: 'Improve productivity' },
    { icon: '🚀', text: 'Help with procrastination' }
  ];

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      if (!currentUser) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const history = await loadChatHistory(currentUser.uid);
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Welcome message if no history
          setMessages([{
            role: 'assistant',
            content: "Hello! I'm your AI Study Mentor. I'm here to help you with study planning, motivation, productivity tips, and more. How can I assist you today?"
          }]);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [currentUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (messageText = input) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    setInput('');
    setError(null);

    // Add user message
    const userMessage = { role: 'user', content: trimmedMessage };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to Firestore
    if (currentUser) {
      await saveChatMessage(currentUser.uid, userMessage);
    }

    setIsLoading(true);

    try {
      // Send to AI backend WITH stress analysis
      const result = await sendMessageWithStressAnalysis(
        currentUser.uid,
        trimmedMessage,
        messages.slice(-5) // Last 5 messages for context
      );

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: result.response
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save AI response to Firestore with stress data
      if (currentUser) {
        await saveChatMessage(currentUser.uid, assistantMessage, result.stressAnalysis);
      }

      // Log stress analysis for debugging
      if (result.hasStressData) {
        console.log('✅ Stress analysis saved:', {
          score: result.stressAnalysis.stressScore,
          level: result.stressAnalysis.stressLevel,
          urgency: result.stressAnalysis.urgencyLevel
        });
      }
    } catch (err) {
      console.error('AI Error:', err);
      setError('Failed to get response from AI. Please try again.');

      // Remove the user message if AI failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;

    const confirmed = window.confirm('Are you sure you want to clear all chat history? This cannot be undone.');
    if (!confirmed) return;

    try {
      await clearChatHistory(currentUser.uid);
      setMessages([{
        role: 'assistant',
        content: "Chat history cleared. How can I help you today?"
      }]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear chat history.');
    }
  };

  const handleRetry = () => {
    setError(null);
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1].content;
      handleSend(lastUserMessage);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading your chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Enhanced Header with Gradient Background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaBrain className="text-3xl text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Study Mentor
                </h1>
                <p className="text-gray-600 mt-1 flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Your 24/7 intelligent study companion</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm"
                title="Toggle chat statistics"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHistory className={`text-lg ${showHistory ? 'text-purple-600' : 'text-gray-600'}`} />
              </motion.button>
              <motion.button
                onClick={handleClearHistory}
                className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all shadow-sm"
                title="Clear chat history"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTrash className="text-lg text-gray-600 hover:text-red-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Chat Area with Enhanced Design */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 280px)', minHeight: '500px', maxHeight: '700px' }}
          >
            {/* Messages Container with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <EmptyState onPromptClick={(prompt) => setInput(prompt)} prompts={quickPrompts} />
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} index={index} />
                  ))}
                </AnimatePresence>
              )}

              {/* Loading Indicator */}
              {isLoading && <TypingIndicator />}

              {/* Error Message with Better Design */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <FaExclamationTriangle className="text-red-600 text-lg" />
                    </div>
                    <div>
                      <p className="text-red-800 text-sm font-semibold">Oops! Something went wrong</p>
                      <p className="text-red-600 text-xs">{error}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleRetry}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium transition-all shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaRedo className="text-xs" />
                    <span>Retry</span>
                  </motion.button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Area */}
            <div className="border-t-2 border-gray-200 p-5 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="💭 Ask me anything about studying... (Shift+Enter for new line)"
                    className="w-full px-5 py-4 pr-16 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all shadow-sm bg-white"
                    rows="1"
                    style={{ maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                    {input.length}/2000
                  </div>
                </div>
                <motion.button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-4 rounded-2xl font-medium transition-all shadow-lg ${input.trim() && !isLoading
                    ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  whileHover={input.trim() && !isLoading ? { scale: 1.05, rotate: 5 } : {}}
                  whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin text-2xl" />
                  ) : (
                    <FaPaperPlane className="text-2xl" />
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Tip: Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Shift+Enter</kbd> for new line
              </p>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Quick Prompts with Better Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <FaLightbulb className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Quick Prompts</h3>
            </div>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSend(prompt.text)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl text-gray-700 hover:text-gray-900 transition-all text-left text-sm font-medium flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  whileHover={!isLoading ? { scale: 1.02, x: 4 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  <span className="text-2xl">{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* AI Features with Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <FaLightbulb className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI Capabilities</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">Personalized study plans</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">Motivation & guidance</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">Smart revision strategies</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">Weak subject analysis</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">Stress & burnout prevention</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 mt-0.5 font-bold">✓</span>
                <span className="font-medium">24/7 instant availability</span>
              </li>
            </ul>
          </motion.div>

          {/* Chat Stats with Better Design */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-5">📊 Chat Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Total Messages</span>
                  <span className="text-2xl font-bold text-gray-900">{messages.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <span className="text-sm font-medium text-gray-700">Your Questions</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {messages.filter(m => m.role === 'user').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <span className="text-sm font-medium text-gray-700">AI Responses</span>
                  <span className="text-2xl font-bold text-green-600">
                    {messages.filter(m => m.role === 'assistant').length}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Message Bubble Component
function MessageBubble({ message, index }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Enhanced Avatar */}
        <motion.div
          className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${isUser
            ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600'
            : 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900'
            }`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {isUser ? (
            <span className="text-white text-xs font-bold">You</span>
          ) : (
            <FaBrain className="text-white text-base" />
          )}
        </motion.div>

        {/* Enhanced Message Content */}
        <div
          className={`px-5 py-4 rounded-3xl shadow-lg ${isUser
            ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white rounded-tr-md'
            : 'bg-white border-2 border-gray-200 text-gray-900 rounded-tl-md'
            }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Typing Indicator Component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start space-x-3"
    >
      <motion.div
        className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <FaBrain className="text-white text-base" />
      </motion.div>
      <div className="px-5 py-4 bg-white border-2 border-gray-200 rounded-3xl rounded-tl-md shadow-lg">
        <div className="flex space-x-2">
          <motion.div
            className="w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Empty State Component
function EmptyState({ onPromptClick, prompts }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <motion.div
        className="w-24 h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <FaBrain className="text-5xl text-white" />
      </motion.div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
        Welcome to AI Study Mentor
      </h2>
      <p className="text-gray-600 mb-8 max-w-md text-lg">
        I'm your intelligent study companion, ready to help with planning, motivation, and productivity.
        <span className="block mt-2 font-semibold text-purple-600">Let's start your learning journey! 🚀</span>
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {prompts.slice(0, 4).map((prompt, index) => (
          <motion.button
            key={index}
            onClick={() => onPromptClick(prompt.text)}
            className="px-5 py-4 bg-gradient-to-br from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 border-2 border-gray-200 hover:border-purple-300 rounded-2xl text-gray-700 hover:text-gray-900 transition-all text-sm font-semibold shadow-sm"
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="text-3xl mb-2">{prompt.icon}</div>
            <div>{prompt.text}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default AIMentor;
