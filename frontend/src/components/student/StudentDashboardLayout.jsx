import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaHome, FaBrain, FaChartLine, FaCalendar, FaFire,
  FaUser, FaCog, FaBars, FaTimes, FaSignOutAlt, FaBell, FaClock, FaCheckSquare, FaSmile, FaYoutube, FaUserFriends, FaTrophy, FaCamera, FaHeart, FaUserSecret
} from 'react-icons/fa';

function StudentDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const menuItems = [
    { path: '/student/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/student/tasks', icon: FaCheckSquare, label: 'My Tasks' },
    { path: '/student/collaborative-tasks', icon: FaUserFriends, label: 'Assigned Tasks' },
    { path: '/student/calendar', icon: FaCalendar, label: 'Calendar' },
    { path: '/student/focus', icon: FaClock, label: 'Focus Room' },
    { path: '/student/study-reels', icon: FaYoutube, label: 'Study Reels' },
    { path: '/student/mentor', icon: FaBrain, label: 'AI Mentor' },
    { path: '/student/mood', icon: FaSmile, label: 'Mood Tracker' },
    { path: '/student/emotion-detection', icon: FaCamera, label: 'Emotion Detection' },
    { path: '/student/planner', icon: FaCalendar, label: 'Planner' },
    { path: '/student/analytics', icon: FaChartLine, label: 'Analytics' },
    { path: '/student/habits', icon: FaFire, label: 'Habits' },
    { path: '/student/leaderboard', icon: FaTrophy, label: 'Leaderboard' },
    { path: '/student/counselor', icon: FaHeart, label: 'Counselor' },
    { path: '/student/anonymous-support', icon: FaUserSecret, label: 'Anonymous Support' },
    { path: '/student/profile', icon: FaUser, label: 'Profile' },
    { path: '/student/settings', icon: FaCog, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50"
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-6 border-b border-gray-200">
                <Link to="/student/dashboard" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">Momentum</span>
                </Link>
              </div>

              {/* User Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser?.displayName?.[0] || currentUser?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser?.displayName || 'Student'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile?.momentumScore || 0} points
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          <item.icon className="text-base" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="text-base" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <FaBell />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {currentUser?.displayName?.[0] || currentUser?.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentDashboardLayout;
