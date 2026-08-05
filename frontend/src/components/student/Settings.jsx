import React from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaBell, FaLock, FaPalette } from 'react-icons/fa';

function Settings() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-gray-900 mb-8">Settings</h1>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaBell className="text-2xl text-purple-500" />
              <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Study reminders</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Break notifications</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaPalette className="text-2xl text-pink-500" />
              <h3 className="text-xl font-bold text-gray-900">Appearance</h3>
            </div>
            <p className="text-gray-600">Theme customization coming soon</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaLock className="text-2xl text-blue-500" />
              <h3 className="text-xl font-bold text-gray-900">Privacy & Security</h3>
            </div>
            <button className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-medium transition-all">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
