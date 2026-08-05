import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash, FaGoogle, FaGithub, FaBrain, FaSun, FaMoon } from 'react-icons/fa';

function Register() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'college'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const { signup, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

  // Student form data
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // College form data
  const [collegeData, setCollegeData] = useState({
    collegeName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('authTheme') || 'dark';
    setTheme(savedTheme);
  }, []);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('authTheme', newTheme);
  };

  const handleStudentChange = (e) => {
    setStudentData({
      ...studentData,
      [e.target.name]: e.target.value
    });
  };

  const handleCollegeChange = (e) => {
    setCollegeData({
      ...collegeData,
      [e.target.name]: e.target.value
    });
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    if (studentData.password !== studentData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (studentData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(studentData.email, studentData.password, 'student', {
        displayName: studentData.name,
        momentumScore: 0,
        streak: 0,
        totalStudyHours: 0
      });
      navigate('/student/dashboard');
    } catch (error) {
      setError('Failed to create account. Email may already be in use.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeSubmit = async (e) => {
    e.preventDefault();

    if (collegeData.password !== collegeData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (collegeData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(collegeData.email, collegeData.password, 'college_admin', {
        collegeName: collegeData.collegeName,
        adminName: collegeData.adminName,
        phone: collegeData.phone,
        displayName: collegeData.adminName
      });
      navigate('/college/dashboard');
    } catch (error) {
      setError('Failed to create account. Email may already be in use.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider) => {
    try {
      setError('');
      setLoading(true);

      if (provider === 'google') {
        await loginWithGoogle(activeTab === 'student' ? 'student' : 'college_admin');
      } else {
        await loginWithGithub(activeTab === 'student' ? 'student' : 'college_admin');
      }

      if (activeTab === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/college/dashboard');
      }
    } catch (error) {
      setError(`Failed to sign up with ${provider}.`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${isDark ? 'bg-black/80 border-gray-800' : 'bg-white/80 border-gray-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <FaBrain className="text-purple-500 text-2xl" />
              <span className={`text-xl font-bold transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'
                }`}>Momentum</span>
            </Link>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                aria-label="Toggle theme"
              >
                {isDark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
              </button>

              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium transition-colors duration-500 ${isDark ? 'text-gray-300 hover:text-purple-400' : 'text-gray-700 hover:text-purple-600'
                  }`}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          {/* Register Card */}
          <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 ${isDark
              ? 'bg-gray-900/50 border border-gray-800'
              : 'bg-white border border-gray-200'
            }`}>
            {/* Tab Switcher */}
            <div className={`flex border-b transition-colors duration-500 ${isDark ? 'border-gray-800' : 'border-gray-200'
              }`}>
              <button
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${activeTab === 'student'
                    ? isDark
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-black border-b-2 border-purple-600'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Student
              </button>
              <button
                onClick={() => setActiveTab('college')}
                className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${activeTab === 'college'
                    ? isDark
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-black border-b-2 border-purple-600'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                College Admin
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-3xl font-bold mb-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'
                    }`}
                >
                  {activeTab === 'student' ? 'Create your account' : 'Register your institution'}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  {activeTab === 'student'
                    ? 'Start building your study momentum today'
                    : 'Join the future of student productivity analytics'}
                </motion.p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-4 mb-6 ${isDark
                      ? 'bg-red-900/30 border border-red-800'
                      : 'bg-red-50 border border-red-200'
                    }`}
                >
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                </motion.div>
              )}

              {/* Student Form */}
              {activeTab === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={studentData.name}
                      onChange={handleStudentChange}
                      className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                          ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                        }`}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={studentData.email}
                      onChange={handleStudentChange}
                      className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                          ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                        }`}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={studentData.password}
                        onChange={handleStudentChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={studentData.confirmPassword}
                      onChange={handleStudentChange}
                      className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                          ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                          : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                        }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/30"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </motion.button>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t transition-colors duration-500 ${isDark ? 'border-gray-800' : 'border-gray-200'
                          }`}></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className={`px-4 transition-colors duration-500 ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-white text-gray-500'
                          }`}>
                          Or sign up with
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleSocialSignup('google')}
                        disabled={loading}
                        className={`flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <FaGoogle />
                        <span>Google</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleSocialSignup('github')}
                        disabled={loading}
                        className={`flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <FaGithub />
                        <span>GitHub</span>
                      </motion.button>
                    </div>
                  </div>
                </form>
              )}

              {/* College Form */}
              {activeTab === 'college' && (
                <form onSubmit={handleCollegeSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        College/University Name
                      </label>
                      <input
                        type="text"
                        name="collegeName"
                        value={collegeData.collegeName}
                        onChange={handleCollegeChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="MIT"
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Admin Name
                      </label>
                      <input
                        type="text"
                        name="adminName"
                        value={collegeData.adminName}
                        onChange={handleCollegeChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="Dr. John Smith"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Official Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={collegeData.email}
                        onChange={handleCollegeChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="admin@college.edu"
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={collegeData.phone}
                        onChange={handleCollegeChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="+1 234 567 8900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={collegeData.password}
                          onChange={handleCollegeChange}
                          className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                              ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                              : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                            }`}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={collegeData.confirmPassword}
                        onChange={handleCollegeChange}
                        className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                          }`}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 ${isDark
                      ? 'bg-blue-900/30 border border-blue-800'
                      : 'bg-blue-50 border border-blue-200'
                    }`}>
                    <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
                      <strong>Note:</strong> Your registration will be reviewed by our team.
                      You'll receive confirmation within 24-48 hours.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/30"
                  >
                    {loading ? 'Creating account...' : 'Register institution'}
                  </motion.button>
                </form>
              )}

              <div className="mt-8 text-center">
                <p className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className={`font-medium transition-colors duration-300 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;