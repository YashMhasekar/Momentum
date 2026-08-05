import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash, FaGoogle, FaGithub, FaBrain, FaSun, FaMoon } from 'react-icons/fa';

function Login() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'college'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);

      // Navigate based on active tab
      if (activeTab === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/college/dashboard');
      }
    } catch (error) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle(activeTab === 'student' ? 'student' : 'college_admin');

      if (activeTab === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/college/dashboard');
      }
    } catch (error) {
      setError('Failed to sign in with Google.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGithub(activeTab === 'student' ? 'student' : 'college_admin');

      if (activeTab === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/college/dashboard');
      }
    } catch (error) {
      setError('Failed to sign in with GitHub.');
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
          className="w-full max-w-md"
        >
          {/* Login Card */}
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
                  Welcome back
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  {activeTab === 'student'
                    ? 'Sign in to your student account'
                    : 'Access your institutional dashboard'}
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {activeTab === 'student' ? 'Email' : 'Admin Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDark
                        ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border border-gray-300 text-black placeholder-gray-400'
                      }`}
                    placeholder={activeTab === 'student' ? 'your.email@example.com' : 'admin@college.edu'}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div className="flex items-center justify-between text-sm">
                  <label className={`flex items-center transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className={`font-medium transition-colors duration-300 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/30"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </motion.button>
              </form>

              {activeTab === 'student' && (
                <>
                  <div className="mt-6">
                    <div className="relative">
                      <div className={`absolute inset-0 flex items-center`}>
                        <div className={`w-full border-t transition-colors duration-500 ${isDark ? 'border-gray-800' : 'border-gray-200'
                          }`}></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className={`px-4 transition-colors duration-500 ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-white text-gray-500'
                          }`}>
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
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
                        onClick={handleGithubLogin}
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
                </>
              )}

              <div className="mt-8 text-center">
                <p className={`transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className={`font-medium transition-colors duration-300 ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                      }`}
                  >
                    Sign up
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

export default Login;