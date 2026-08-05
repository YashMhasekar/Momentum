import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaBook, FaGamepad, FaYoutube, FaCode } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayActivities } from '../../services/extensionService';
import { formatStudyTime } from '../../utils/timeFormatter';

function ActivityTimeline() {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadActivities();
    }
  }, [currentUser]);

  const loadActivities = async () => {
    try {
      const data = await getTodayActivities(currentUser.uid);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    if (type === 'study') return <FaBook className="text-green-600" />;
    if (type === 'distraction') return <FaGamepad className="text-red-600" />;
    return <FaClock className="text-gray-600" />;
  };

  const getActivityColor = (type) => {
    if (type === 'study') return 'border-green-200 bg-green-50';
    if (type === 'distraction') return 'border-red-200 bg-red-50';
    return 'border-gray-200 bg-gray-50';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (minutes) => {
    // Convert minutes to seconds for formatStudyTime
    return formatStudyTime(minutes * 60);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white border border-gray-200 rounded-xl p-6"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Today's Activity Timeline</h2>
        <p className="text-sm text-gray-600">Chronological view of your browsing sessions</p>
      </div>

      {activities.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-14"
              >
                {/* Timeline dot */}
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  activity.type === 'study' 
                    ? 'bg-green-500 border-green-600' 
                    : 'bg-red-500 border-red-600'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>

                <div className={`border rounded-lg p-4 ${getActivityColor(activity.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.url}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      activity.type === 'study' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {activity.type === 'study' ? 'Study' : 'Distraction'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <FaClock className="text-gray-400" />
                        <span>{formatTime(activity.timestamp)}</span>
                      </span>
                      <span className="font-medium">{formatDuration(activity.duration)}</span>
                    </div>
                    {activity.subject && (
                      <span className="px-2 py-0.5 bg-white rounded text-gray-700">
                        {activity.subject}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FaClock className="text-4xl mb-3 text-gray-300" />
          <p className="text-sm font-medium mb-1">No activities tracked today</p>
          <p className="text-xs text-center">Your browsing activity will appear here when you use the extension</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Study sessions</span>
              <span className="font-bold text-green-600">
                {activities.filter(a => a.type === 'study').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Distractions</span>
              <span className="font-bold text-red-600">
                {activities.filter(a => a.type === 'distraction').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default ActivityTimeline;
