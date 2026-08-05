import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGlobe, FaYoutube, FaGithub, FaStackOverflow, FaBook } from 'react-icons/fa';
import { SiLeetcode, SiGeeksforgeeks, SiChatbot } from 'react-icons/si';
import { useAuth } from '../../contexts/AuthContext';
import { getTopPlatforms } from '../../services/extensionService';
import { formatStudyTime, secondsToHours } from '../../utils/timeFormatter';

function TopPlatforms() {
  const { currentUser } = useAuth();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTopPlatforms();
    }
  }, [currentUser]);

  const loadTopPlatforms = async () => {
    try {
      const data = await getTopPlatforms(currentUser.uid, 5);
      setPlatforms(data);
    } catch (error) {
      console.error('Error loading top platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('leetcode')) return <SiLeetcode className="text-orange-500" />;
    if (urlLower.includes('geeksforgeeks')) return <SiGeeksforgeeks className="text-green-600" />;
    if (urlLower.includes('youtube')) return <FaYoutube className="text-red-600" />;
    if (urlLower.includes('github')) return <FaGithub className="text-gray-800" />;
    if (urlLower.includes('stackoverflow')) return <FaStackOverflow className="text-orange-600" />;
    if (urlLower.includes('chatgpt') || urlLower.includes('openai')) return <SiChatbot className="text-teal-600" />;
    if (urlLower.includes('docs') || urlLower.includes('documentation')) return <FaBook className="text-blue-600" />;
    return <FaGlobe className="text-gray-600" />;
  };

  const getPlatformName = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('leetcode')) return 'LeetCode';
    if (urlLower.includes('geeksforgeeks')) return 'GeeksforGeeks';
    if (urlLower.includes('youtube')) return 'YouTube';
    if (urlLower.includes('github')) return 'GitHub';
    if (urlLower.includes('stackoverflow')) return 'Stack Overflow';
    if (urlLower.includes('chatgpt')) return 'ChatGPT';
    if (urlLower.includes('openai')) return 'OpenAI';
    if (urlLower.includes('w3schools')) return 'W3Schools';
    if (urlLower.includes('mdn')) return 'MDN Web Docs';
    
    // Extract domain name
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const maxTime = platforms.length > 0 ? Math.max(...platforms.map(p => p.totalTime)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl p-6"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Most Used Study Platforms</h2>
        <p className="text-sm text-gray-600">Your top learning resources this week</p>
      </div>

      {platforms.length > 0 ? (
        <div className="space-y-4">
          {platforms.map((platform, index) => {
            const percentage = (platform.totalTime / maxTime) * 100;
            const timeFormatted = formatStudyTime(platform.totalTime * 3600); // Convert hours to seconds
            
            return (
              <motion.div
                key={platform.url}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      {getPlatformIcon(platform.url)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getPlatformName(platform.url)}</p>
                      <p className="text-xs text-gray-500">{platform.visitCount} visit{platform.visitCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{timeFormatted}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                      index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      index === 2 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      index === 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-pink-500 to-rose-500'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <FaGlobe className="text-4xl mb-3 text-gray-300" />
          <p className="text-sm font-medium mb-1">No platform data yet</p>
          <p className="text-xs text-center">Your most visited study websites will appear here</p>
        </div>
      )}

      {platforms.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total tracked time</span>
            <span className="font-bold text-gray-900">
              {formatStudyTime(platforms.reduce((sum, p) => sum + p.totalTime, 0) * 3600)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default TopPlatforms;
