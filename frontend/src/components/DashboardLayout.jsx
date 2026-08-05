import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import { FaBars, FaBell, FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function DashboardLayout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setReconnecting(true);
      // Add a short delay to allow connections to reestablish
      setTimeout(() => {
        setIsOffline(false);
        setReconnecting(false);
      }, 2000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Fetch notifications for the current user
  useEffect(() => {
    if (!currentUser) return;
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('recipientId', '==', currentUser.uid), where('read', '==', false));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsList = [];
      querySnapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setNotifications(notificationsList);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to messages for message notifications
    if (notification.type === 'new_message') {
      navigate('/messages');
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.read).length;
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white z-50 py-2 px-4 flex items-center justify-center shadow-md">
          <FaExclamationTriangle className="mr-2" />
          <span>You are currently offline. Some features may not work properly.</span>
        </div>
      )}
      
      {/* Reconnecting Banner */}
      {reconnecting && !isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white z-50 py-2 px-4 flex items-center justify-center shadow-md">
          <FaWifi className="mr-2" />
          <span>Connection restored. Reconnecting to services...</span>
        </div>
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isOffline || reconnecting ? 'mt-10' : ''}`}>
        {/* Top navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {/* Notification indicator */}
            <div className="flex items-center">
              {notifications.length > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs mr-2">
                  {notifications.length}
                </span>
              )}
              <div className="h-8 w-8 rounded-full bg-gray-200">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout; 