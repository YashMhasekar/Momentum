import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaCode, FaGithub, FaCheckCircle, FaSearch } from 'react-icons/fa';

function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg text-white">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-4">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "User"} 
                className="w-12 h-12 rounded-full" 
              />
            ) : (
              <FaUser className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}!</h1>
            <p className="text-blue-100 mt-1">Ready to find your next open source contribution?</p>
          </div>
        </div>
        
        <div className="bg-blue-700 bg-opacity-40 rounded-xl p-4 mt-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <p className="text-blue-100 text-sm">Your contribution status</p>
            <p className="font-semibold text-lg">No active contributions yet</p>
          </div>
          <button className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg inline-flex items-center gap-2">
            <FaSearch className="w-4 h-4" />
            <span>Find Projects</span>
          </button>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Getting Started */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Getting Started
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaGithub className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">Connect Your GitHub Account</h3>
                  <p className="text-gray-600 mb-3">Link your GitHub account to help us find better project matches for you.</p>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
                    <FaGithub className="w-4 h-4" />
                    <span>Connect GitHub</span>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">Add Your Skills</h3>
                  <p className="text-gray-600 mb-3">Tell us what programming languages and frameworks you're comfortable with.</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Add Skills
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommended Projects */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Recommended Projects</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
              <FaSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-semibold text-gray-700 mb-2">No recommendations yet</h3>
              <p className="text-gray-500 mb-4">Add your skills or connect GitHub to get personalized project recommendations.</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                Complete Your Profile
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6 lg:space-y-8">
          {/* Profile Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Profile Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-800">{currentUser.email}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">GitHub</span>
                <span className="text-blue-600 font-medium">Not connected</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Skills</span>
                <span className="text-gray-800">None added</span>
              </div>
            </div>
            
            <button className="mt-6 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Edit Profile
            </button>
          </div>
          
          {/* Activity */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h2>
            
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 mb-4">No activity to show yet.</p>
              <p className="text-sm text-gray-400">Your GitHub activity will appear here once you start contributing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 