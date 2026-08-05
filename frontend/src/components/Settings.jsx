import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheck, FaBell, FaUser, FaEnvelope, FaGlobe, FaMoon, FaSun, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Settings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    browserNotifications: true,
    notifyOnNewMessage: true,
    notifyOnProjectInterest: true,
    
    // Display settings
    darkMode: false,
    compactView: false,
    fontSize: 'medium',
    
    // Messaging settings
    autoReplyEnabled: false,
    autoReplyMessage: "Thanks for your message! I'll get back to you as soon as possible.",
    messagePrivacy: 'all', // 'all', 'collaborators', 'none'
    
    // Privacy settings
    showEmail: true,
    showProjects: true,
    profileVisibility: 'public' // 'public', 'contributors', 'private'
  });
  
  // Fetch user settings from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const settingsRef = doc(db, 'user_settings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...settingsSnap.data()
          }));
        } else {
          // If no settings exist yet, create default settings
          await setDoc(settingsRef, settings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError("Failed to load settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Save settings to Firestore
  const saveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const settingsRef = doc(db, 'user_settings', currentUser.uid);
      await updateDoc(settingsRef, settings);
      
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg flex items-center">
          <FaCheck className="mr-2" />
          {success}
        </div>
      )}
      
      <div className="space-y-8">
        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaBell className="mr-2 text-blue-600" />
            Notification Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                Receive email notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="browserNotifications"
                name="browserNotifications"
                checked={settings.browserNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="browserNotifications" className="ml-2 block text-sm text-gray-700">
                Enable browser notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnNewMessage"
                name="notifyOnNewMessage"
                checked={settings.notifyOnNewMessage}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifyOnNewMessage" className="ml-2 block text-sm text-gray-700">
                Notify me when I receive a new message
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnProjectInterest"
                name="notifyOnProjectInterest"
                checked={settings.notifyOnProjectInterest}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifyOnProjectInterest" className="ml-2 block text-sm text-gray-700">
                Notify me when someone expresses interest in my project
              </label>
            </div>
          </div>
        </div>
        
        {/* Display Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaGlobe className="mr-2 text-blue-600" />
            Display Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="darkMode"
                name="darkMode"
                checked={settings.darkMode}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700 flex items-center">
                Dark Mode 
                {settings.darkMode ? <FaMoon className="ml-2" /> : <FaSun className="ml-2" />}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compactView"
                name="compactView"
                checked={settings.compactView}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="compactView" className="ml-2 block text-sm text-gray-700">
                Compact View (reduced spacing)
              </label>
            </div>
            <div className="flex flex-col">
              <label htmlFor="fontSize" className="block text-sm text-gray-700 mb-1">
                Font Size
              </label>
              <select
                id="fontSize"
                name="fontSize"
                value={settings.fontSize}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Messaging Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaEnvelope className="mr-2 text-blue-600" />
            Messaging Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoReplyEnabled"
                name="autoReplyEnabled"
                checked={settings.autoReplyEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoReplyEnabled" className="ml-2 block text-sm text-gray-700">
                Enable auto-reply for new messages
              </label>
            </div>
            
            {settings.autoReplyEnabled && (
              <div className="flex flex-col">
                <label htmlFor="autoReplyMessage" className="block text-sm text-gray-700 mb-1">
                  Auto-reply Message
                </label>
                <textarea
                  id="autoReplyMessage"
                  name="autoReplyMessage"
                  value={settings.autoReplyMessage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                />
              </div>
            )}
            
            <div className="flex flex-col">
              <label htmlFor="messagePrivacy" className="block text-sm text-gray-700 mb-1">
                Who can message you?
              </label>
              <select
                id="messagePrivacy"
                name="messagePrivacy"
                value={settings.messagePrivacy}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Everyone</option>
                <option value="collaborators">Only collaborators</option>
                <option value="none">Nobody (disable messaging)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Privacy Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaUserShield className="mr-2 text-blue-600" />
            Privacy Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showEmail"
                name="showEmail"
                checked={settings.showEmail}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showEmail" className="ml-2 block text-sm text-gray-700">
                Display my email to other users
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showProjects"
                name="showProjects"
                checked={settings.showProjects}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showProjects" className="ml-2 block text-sm text-gray-700">
                List my public projects in discovery
              </label>
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="profileVisibility" className="block text-sm text-gray-700 mb-1">
                Profile Visibility
              </label>
              <select
                id="profileVisibility"
                name="profileVisibility"
                value={settings.profileVisibility}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public (visible to everyone)</option>
                <option value="contributors">Contributors only</option>
                <option value="private">Private (only visible to you)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="mt-8">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {saving ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}

export default Settings; 