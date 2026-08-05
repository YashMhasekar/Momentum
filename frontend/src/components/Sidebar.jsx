import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FaTachometerAlt, 
  FaProjectDiagram, 
  FaSearch, 
  FaHistory, 
  FaRegChartBar, 
  FaUserEdit, 
  FaCog, 
  FaSignOutAlt,
  FaGithub,
  FaUser,
  FaEnvelope,
  FaSpinner
} from 'react-icons/fa';

function Sidebar({ isOpen, toggleSidebar }) {
  const { currentUser, logout, loginWithGithub } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState({
    githubConnected: false,
    githubUsername: ''
  });

  // Define sidebar menu items
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaTachometerAlt className="w-5 h-5" /> },
    { path: '/projects', name: 'My Projects', icon: <FaProjectDiagram className="w-5 h-5" /> },
    { path: '/match-issues', name: 'Find Projects', icon: <FaSearch className="w-5 h-5" /> },
    { path: '/messages', name: 'Messages', icon: <FaEnvelope className="w-5 h-5" /> },
    { path: '/my-contributions', name: 'My Contributions', icon: <FaHistory className="w-5 h-5" /> },
    { path: '/analytics', name: 'Analytics', icon: <FaRegChartBar className="w-5 h-5" /> },
    { path: '/profile', name: 'Profile', icon: <FaUserEdit className="w-5 h-5" /> },
    { path: '/settings', name: 'Settings', icon: <FaCog className="w-5 h-5" /> },
  ];

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile({
            githubConnected: userData.githubConnected || false,
            githubUsername: userData.githubUsername || ''
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);

  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle GitHub connection
  const handleConnectGithub = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Attempt to sign in with GitHub
      const result = await loginWithGithub();
      
      if (result.user) {
        // Get GitHub profile info from user info
        const githubUser = result.user.providerData.find(
          provider => provider.providerId === 'github.com'
        );
        
        if (githubUser) {
          // Update user document with GitHub info
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            githubConnected: true,
            githubUsername: githubUser.displayName || '',
            githubPhotoURL: githubUser.photoURL || '',
            githubEmail: githubUser.email || '',
            githubUID: githubUser.uid || '',
            updatedAt: new Date()
          });
          
          // Update local state
          setUserProfile({
            githubConnected: true,
            githubUsername: githubUser.displayName || ''
          });
        }
      }
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setError("Failed to connect GitHub account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`bg-white shadow-lg fixed inset-y-0 pt-16 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 w-64 overflow-y-auto`}>
        {/* Sidebar Content */}
        <div className="p-5">
          {/* User Profile */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "User"} 
                  className="w-10 h-10 rounded-full" 
                />
              ) : (
                <FaUser className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-gray-800 text-lg truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-500 text-sm truncate">{currentUser.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center space-x-3 ${isActive(item.path) 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-100'} rounded-lg px-4 py-3 font-medium transition-colors`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          {/* Connect GitHub Button */}
          <div className="mt-8 mb-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {userProfile.githubConnected ? (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-3">
                <FaGithub className="flex-shrink-0 w-5 h-5 text-gray-800" />
                <div className="overflow-hidden">
                  <span className="text-gray-800 font-medium">Connected to GitHub</span>
                  {userProfile.githubUsername && (
                    <p className="text-gray-500 text-sm truncate">@{userProfile.githubUsername}</p>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleConnectGithub}
                disabled={loading}
                className="flex w-full items-center space-x-3 bg-gray-800 hover:bg-black text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:bg-gray-600"
              >
                {loading ? (
                  <FaSpinner className="flex-shrink-0 w-5 h-5 animate-spin" />
                ) : (
                  <FaGithub className="flex-shrink-0 w-5 h-5" />
                )}
                <span>{loading ? 'Connecting...' : 'Connect GitHub'}</span>
              </button>
            )}
          </div>
          
          {/* Logout Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button 
              onClick={logout}
              className="flex w-full items-center space-x-3 text-red-600 hover:bg-red-50 rounded-lg px-4 py-3 font-medium transition-colors"
            >
              <FaSignOutAlt className="flex-shrink-0 w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

export default Sidebar; 