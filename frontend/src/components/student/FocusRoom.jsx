import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaStop, FaClock, FaFire, FaBrain, 
  FaCheckCircle, FaCoffee, FaMoon, FaSun, FaTrophy, FaBook,
  FaClipboardCheck, FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { triggerMomentumUpdate } from '../../services/momentumScoreEngine';
import { normalizeStudyTopic, generateQuizQuestions } from '../../services/aiQuestionGenerator';
import { evaluateAnswers } from '../../services/focusEvaluationService';
import { createFocusTest, submitFocusTest } from '../../services/focusTestService';
import AmbientSounds from './focus/AmbientSounds';
import QuizModal from './focus/QuizModal';
import ResultsModal from './focus/ResultsModal';

function FocusRoom() {
  const { currentUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [sessions, setSession] = useState(0);
  const [subject, setSubject] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [normalizedTopicData, setNormalizedTopicData] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [canTakeTest, setCanTakeTest] = useState(false);

  const modes = {
    pomodoro: { time: 25 * 60, label: 'Focus Time', color: 'from-purple-600 to-blue-600', icon: FaBrain },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'from-green-600 to-emerald-600', icon: FaCoffee },
    longBreak: { time: 15 * 60, label: 'Long Break', color: 'from-orange-600 to-red-600', icon: FaMoon }
  };

  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, time]);

  const handleSessionComplete = () => {
    setIsActive(false);
    if (mode === 'pomodoro') {
      setSession(sessions + 1);
      setShowReflection(true);
      setCanTakeTest(true); // Enable test after session completes
      
      // Trigger momentum score recalculation after completing a focus session
      if (currentUser) {
        triggerMomentumUpdate(currentUser.uid).catch(err => 
          console.error('Failed to update momentum after focus session:', err)
        );
      }
    }
    // Play notification sound here
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // QUIZ FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTakeTest = async () => {
    if (!subject.trim()) {
      alert('Please enter what you studied before taking the test!');
      return;
    }

    try {
      setIsGeneratingQuiz(true);

      // Step 1: Normalize topic
      console.log('🔍 Normalizing topic:', subject);
      const topicData = await normalizeStudyTopic(subject);
      setNormalizedTopicData(topicData);
      console.log('✅ Normalized:', topicData);

      // Step 2: Generate questions
      console.log('📝 Generating questions...');
      const questions = await generateQuizQuestions(topicData.normalizedTopic, 5);
      setQuizQuestions(questions);
      console.log('✅ Generated', questions.length, 'questions');

      // Step 3: Create test in Firestore
      const focusDuration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
      const testId = await createFocusTest({
        userId: currentUser.uid,
        sessionId: null,
        studyTopic: subject,
        normalizedTopic: topicData.normalizedTopic,
        category: topicData.category,
        difficulty: topicData.difficulty,
        questions: questions,
        focusDuration: focusDuration
      });
      setCurrentTestId(testId);
      console.log('✅ Test created:', testId);

      // Step 4: Show quiz modal
      setShowQuiz(true);
      setIsGeneratingQuiz(false);

    } catch (error) {
      console.error('❌ Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (answers) => {
    try {
      setIsEvaluating(true);
      setShowQuiz(false);

      // Evaluate answers
      console.log('🎯 Evaluating answers...');
      const evaluation = await evaluateAnswers(
        quizQuestions,
        answers,
        normalizedTopicData.normalizedTopic
      );
      console.log('✅ Evaluation complete:', evaluation);

      // Submit to Firestore
      await submitFocusTest(currentTestId, answers, evaluation);
      console.log('✅ Test submitted to Firestore');

      // Show results
      setQuizResult(evaluation);
      setIsEvaluating(false);

    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      alert('Failed to evaluate quiz. Please try again.');
      setIsEvaluating(false);
    }
  };

  const handleCloseResults = () => {
    setQuizResult(null);
    setQuizQuestions([]);
    setCurrentTestId(null);
    setNormalizedTopicData(null);
  };

  const handleRetakeTest = () => {
    setQuizResult(null);
    handleTakeTest();
  };

  const toggleTimer = () => {
    if (!isActive) {
      if (!subject.trim()) {
        alert('Please enter what you are studying before starting the timer!');
        return;
      }
      setIsActive(true);
      setIsPaused(false);
      setSessionStartTime(Date.now());
      setCanTakeTest(true); // Allow test immediately for hackathon demo
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(modes[mode].time);
    setSessionStartTime(null);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTime(modes[newMode].time);
    setIsActive(false);
    setIsPaused(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((modes[mode].time - time) / modes[mode].time) * 100;
  const ModeIcon = modes[mode].icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Enhanced Header */}
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
                className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${modes[mode].color} rounded-2xl shadow-xl`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ModeIcon className="text-3xl text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Focus Room
                </h1>
                <p className="text-gray-600 mt-1 flex items-center space-x-2">
                  <FaClock className="text-sm" />
                  <span>Deep work with Pomodoro technique</span>
                </p>
              </div>
            </div>

            {/* Session Counter */}
            <div className="flex items-center space-x-4">
              <div className="px-6 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <FaFire className="text-2xl text-orange-500" />
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Today's Sessions</p>
                    <p className="text-2xl font-bold text-orange-900">{sessions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Timer Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-8 shadow-xl"
          >
            {/* Mode Selector */}
            <div className="flex justify-center space-x-3 mb-8">
              <motion.button
                onClick={() => switchMode('pomodoro')}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                  mode === 'pomodoro'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                whileHover={{ scale: mode === 'pomodoro' ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaBrain className="inline mr-2" />
                Pomodoro
              </motion.button>
              <motion.button
                onClick={() => switchMode('shortBreak')}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                  mode === 'shortBreak'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                whileHover={{ scale: mode === 'shortBreak' ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaCoffee className="inline mr-2" />
                Short Break
              </motion.button>
              <motion.button
                onClick={() => switchMode('longBreak')}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                  mode === 'longBreak'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
                whileHover={{ scale: mode === 'longBreak' ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaMoon className="inline mr-2" />
                Long Break
              </motion.button>
            </div>

            {/* Circular Timer Display */}
            <div className="relative mb-8 flex items-center justify-center">
              <svg className="w-full max-w-md h-auto" viewBox="0 0 400 400">
                {/* Background Circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="16"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="200"
                  cy="200"
                  r="180"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 180}`}
                  strokeDashoffset={`${2 * Math.PI * 180 * (1 - progress / 100)}`}
                  transform="rotate(-90 200 200)"
                  initial={{ strokeDashoffset: 2 * Math.PI * 180 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 180 * (1 - progress / 100) }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={mode === 'pomodoro' ? '#9333ea' : mode === 'shortBreak' ? '#059669' : '#ea580c'} />
                    <stop offset="100%" stopColor={mode === 'pomodoro' ? '#3b82f6' : mode === 'shortBreak' ? '#10b981' : '#dc2626'} />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Timer Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.p 
                  className="text-8xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2"
                  key={time}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatTime(time)}
                </motion.p>
                <p className={`text-xl font-semibold bg-gradient-to-r ${modes[mode].color} bg-clip-text text-transparent`}>
                  {modes[mode].label}
                </p>
                {isActive && !isPaused && (
                  <motion.p 
                    className="text-sm text-gray-500 mt-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Stay focused...
                  </motion.p>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              <motion.button
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${modes[mode].color} hover:shadow-2xl flex items-center justify-center text-white text-3xl transition-all shadow-xl`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && !isPaused ? <FaPause /> : <FaPlay className="ml-1" />}
              </motion.button>
              <motion.button
                onClick={resetTimer}
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-300 flex items-center justify-center text-gray-700 text-2xl transition-all shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaStop />
              </motion.button>
            </div>

            {/* Subject Input */}
            {!isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                  <FaBook className="text-purple-600" />
                  <span>What are you studying? *</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., webdevlopment, dsa arrays, os sched, dbms normalization..."
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Enter any format - AI will understand abbreviations and correct spelling
                </p>
              </motion.div>
            )}

            {/* Active Session Topic Display */}
            {isActive && subject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-4"
              >
                <div className="flex items-center space-x-3">
                  <FaBook className="text-2xl text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Currently Studying</p>
                    <p className="text-lg font-bold text-gray-900">{subject}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${modes[mode].color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Focus Check Section */}
          {canTakeTest && subject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <FaClipboardCheck className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">📘 Quick Focus Check</h3>
                  <p className="text-sm text-gray-600">Verify what you learned</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm border border-indigo-200 rounded-2xl p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>AI-Powered Learning Validation:</strong> Take a quick 5-question test to verify your understanding. 
                  The AI will evaluate your answers and update your momentum score based on performance.
                </p>
              </div>

              <button
                onClick={handleTakeTest}
                disabled={isGeneratingQuiz}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-3 ${
                  isGeneratingQuiz
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700'
                }`}
              >
                {isGeneratingQuiz ? (
                  <>
                    <FaSpinner className="animate-spin text-xl" />
                    <span>Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <FaBrain className="text-xl" />
                    <span>Take Quick Test</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                ⚡ For hackathon demo: Test available immediately
              </p>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-5 text-center"
            >
              <FaFire className="text-3xl text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{sessions}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 text-center"
            >
              <FaClock className="text-3xl text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Focus Time</p>
              <p className="text-3xl font-bold text-gray-900">{sessions * 25}m</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 text-center"
            >
              <FaTrophy className="text-3xl text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Streak</p>
              <p className="text-3xl font-bold text-gray-900">7d</p>
            </motion.div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ambient Sounds - New Component */}
          <AmbientSounds />

          {/* Focus Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-lg"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <FaSun className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">💡 Focus Tips</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="font-medium">Remove all distractions from your workspace</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="font-medium">Keep water nearby to stay hydrated</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="font-medium">Take breaks seriously - they boost productivity</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="font-medium">Track your progress to stay motivated</span>
              </li>
              <li className="flex items-start space-x-3 p-2 bg-white/60 rounded-lg">
                <span className="text-purple-600 font-bold">✓</span>
                <span className="font-medium">Use ambient sounds to enhance concentration</span>
              </li>
            </ul>
          </motion.div>

          {/* Pomodoro Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">🍅 Pomodoro Technique</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-600">1</div>
                <p>Work for 25 minutes</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-600">2</div>
                <p>Take a 5-minute break</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">3</div>
                <p>Repeat 4 times</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center font-bold text-orange-600">4</div>
                <p>Take a 15-minute break</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Session Reflection Modal */}
      <AnimatePresence>
        {showReflection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowReflection(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl border-2 border-gray-200 p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <FaCheckCircle className="text-4xl text-white" />
                </motion.div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Session Complete! 🎉</h3>
                <p className="text-gray-600">Great work! Let's reflect on your session.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">What did you study?</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Topics covered..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Confidence Level</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <motion.button
                        key={level}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white rounded-xl text-gray-900 transition-all font-bold border-2 border-gray-200 hover:border-transparent"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {level}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <motion.button
                    onClick={() => setShowReflection(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-bold transition-all border-2 border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Skip
                  </motion.button>
                  <motion.button
                    onClick={() => setShowReflection(false)}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-bold transition-all shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && quizQuestions.length > 0 && (
          <QuizModal
            questions={quizQuestions}
            onSubmit={handleSubmitQuiz}
            onClose={() => setShowQuiz(false)}
            topic={normalizedTopicData?.normalizedTopic || subject}
          />
        )}
      </AnimatePresence>

      {/* Evaluating Overlay */}
      <AnimatePresence>
        {isEvaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <FaBrain className="text-4xl text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Your Answers...</h3>
              <p className="text-gray-600">AI is analyzing your responses and calculating your score</p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-3 h-3 bg-purple-600 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 bg-blue-600 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 bg-indigo-600 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {quizResult && (
          <ResultsModal
            result={quizResult}
            topic={normalizedTopicData?.normalizedTopic || subject}
            onClose={handleCloseResults}
            onRetake={handleRetakeTest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default FocusRoom;
