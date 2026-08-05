import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPopup from './LoginPopup';
import { FaGithub, FaCode, FaChartLine, FaRocket } from 'react-icons/fa';

function Home() {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-600 mb-6 leading-tight">
            Open Source Contribution Matchmaker
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            Find the perfect open-source projects that match your skills and interests,
            powered by AI-driven recommendations and GitHub integration.
          </p>
          
          <div className="flex flex-wrap gap-5 justify-center mb-16">
            {currentUser ? (
              <Link 
                to="/dashboard" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => setShowLoginPopup(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  Sign In
                </button>
                <Link 
                  to="/register" 
                  className="bg-white hover:bg-gray-100 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* GitHub Integration Showcase */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-800 to-indigo-900 p-10 text-white mb-20 shadow-2xl">
          <div className="absolute top-0 right-0 opacity-10">
            <FaGithub className="w-60 h-60" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">Powered by GitHub Integration</h2>
            <p className="text-xl mb-8 max-w-2xl leading-relaxed">
              Seamlessly connect with GitHub to find issues that match your skills, 
              track your contributions, and build your open source portfolio.
            </p>
            <div className="inline-flex items-center gap-3 bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-blue-50 hover:shadow-lg">
              <FaGithub className="w-5 h-5" />
              <span>Connect with GitHub</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">Our Platform Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:border-blue-100 hover:transform hover:scale-105">
            <div className="p-4 bg-blue-50 rounded-full inline-block mb-4">
              <FaCode className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Smart Matching</h3>
            <p className="text-gray-600 leading-relaxed">Our AI analyzes your GitHub history and skills to find the perfect issues for you, ensuring they match your experience level.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:border-blue-100 hover:transform hover:scale-105">
            <div className="p-4 bg-blue-50 rounded-full inline-block mb-4">
              <FaRocket className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">GitHub Integration</h3>
            <p className="text-gray-600 leading-relaxed">Seamless connection with GitHub for real-time issue tracking, updates, and contribution management in one place.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl hover:border-blue-100 hover:transform hover:scale-105">
            <div className="p-4 bg-blue-50 rounded-full inline-block mb-4">
              <FaChartLine className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Progress Tracking</h3>
            <p className="text-gray-600 leading-relaxed">Monitor your open-source journey with detailed analytics and insights to help you grow as a contributor.</p>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-10 md:p-14 shadow-lg border border-blue-100">
          <h2 className="text-3xl font-bold mb-10 text-gray-800 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Create Your Account</h3>
                  <p className="text-gray-600">Sign up and connect your GitHub profile to get started on your open source journey.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Define Your Skills</h3>
                  <p className="text-gray-600">Select your programming languages, frameworks, and areas of interest.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Get Recommendations</h3>
                  <p className="text-gray-600">Receive personalized GitHub issue recommendations based on your skills and interests.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mr-4">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Start Contributing</h3>
                  <p className="text-gray-600">Begin your open source journey and track your progress with detailed analytics.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <button 
              onClick={() => setShowLoginPopup(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
      
      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

export default Home; 