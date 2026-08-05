import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaGithub, FaBell, FaUser } from 'react-icons/fa';

function DashboardNavbar() {
  const { currentUser } = useAuth();

  return (
    <header className="bg-white shadow-sm z-40 relative">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <FaGithub className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">OSS Matchmaker</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
              <FaBell className="h-6 w-6" />
            </button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || "User"} 
                    className="w-8 h-8 rounded-full" 
                  />
                ) : (
                  <FaUser className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <span className="text-gray-800 font-medium hidden md:block">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardNavbar; 