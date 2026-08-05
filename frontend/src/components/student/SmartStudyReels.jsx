import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay, FaSearch, FaTimes, FaFire, FaBrain, FaGithub, FaTasks,
  FaClock, FaChartLine, FaLightbulb, FaGraduationCap, FaArrowLeft,
  FaExclamationTriangle, FaCheckCircle, FaHistory, FaStar
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  validateSearchQuery,
  generatePersonalizedRecommendations,
  trackVideoWatch,
  getWatchHistory,
  getTrendingTopics,
  DEFAULT_TOPICS
} from '../../services/studyReelsRecommendationService';
import { validateSearchWithGroq } from '../../services/groqSearchValidationService';
import { optimizeSearchQuery } from '../../services/studySearchAIService';
import { searchVideos, searchLectures } from '../../utils/youtubeApi';
import ReelsContainer from '../focused_yt/ReelsContainer';
import LecturesGrid from '../focused_yt/LecturesGrid';
import LoadingSpinner from '../focused_yt/LoadingSpinner';
import './SmartStudyReels.css';

function SmartStudyReels() {
  const { currentUser } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('shorts'); // 'shorts' or 'lectures'
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [validatingSearch, setValidatingSearch] = useState(false);
  const [optimizedQuery, setOptimizedQuery] = useState('');

  // Load recommendations on mount
  useEffect(() => {
    if (currentUser) {
      loadRecommendations();
      loadTrendingTopics();
      loadWatchHistory();
    }
  }, [currentUser]);

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const recommendations = await generatePersonalizedRecommendations(currentUser.uid);
      setRecommendedTopics(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommendedTopics(DEFAULT_TOPICS);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadTrendingTopics = async () => {
    try {
      const trending = await getTrendingTopics();
      setTrendingTopics(trending);
    } catch (error) {
      console.error('Error loading trending topics:', error);
    }
  };

  const loadWatchHistory = async () => {
    try {
      const history = await getWatchHistory(currentUser.uid, 10);
      setWatchHistory(history);
    } catch (error) {
      console.error('Error loading watch history:', error);
    }
  };

  const handleTopicClick = async (topic) => {
    setCurrentTopic(topic.label);
    await loadVideosForTopic(topic.label, topic.category);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    try {
      // Show validating state
      setValidatingSearch(true);
      setSearchError('');
      setOptimizedQuery('');

      console.log('🔍 AI-Powered Search - Raw Query:', searchQuery);

      // Step 1: AI-powered query optimization and validation
      const aiResult = await optimizeSearchQuery(searchQuery);
      
      console.log('🤖 AI Optimization Result:', aiResult);

      if (!aiResult.valid) {
        // Search rejected by AI
        setSearchError(aiResult.reason);
        setValidatingSearch(false);
        return;
      }

      // AI approved and optimized the query
      const optimized = aiResult.improvedQuery;
      setOptimizedQuery(optimized);
      
      console.log('✅ Search approved and optimized');
      console.log('   Original:', searchQuery);
      console.log('   Optimized:', optimized);

      // Step 2: Additional validation with GROQ (backup layer)
      const groqValidation = await validateSearchWithGroq(optimized);
      
      if (!groqValidation.isValid) {
        // Double-check validation failed
        setSearchError(groqValidation.reason);
        setValidatingSearch(false);
        return;
      }

      // Step 3: Additional keyword validation (backup layer)
      const keywordValidation = validateSearchQuery(optimized);
      
      if (!keywordValidation.isValid) {
        // Keyword validation failed
        setSearchError(keywordValidation.reason);
        setValidatingSearch(false);
        return;
      }

      // All validations passed - proceed with optimized search
      console.log('✅ All validations passed - loading videos with optimized query');
      setSearchError('');
      setValidatingSearch(false);
      setCurrentTopic(optimized); // Use optimized query
      await loadVideosForTopic(optimized, keywordValidation.category);

    } catch (error) {
      console.error('❌ Error during AI search:', error);
      setSearchError('An error occurred while processing your search. Please try again.');
      setValidatingSearch(false);
    }
  };

  const loadVideosForTopic = async (topic, category) => {
    try {
      setLoading(true);
      setShowContent(false);

      let results;
      if (activeTab === 'shorts') {
        results = await searchVideos(topic);
      } else {
        results = await searchLectures(topic);
      }

      // Add topic and category to video data
      const videosWithMetadata = results.map(video => ({
        ...video,
        topic,
        category,
        contentType: activeTab
      }));

      setVideos(videosWithMetadata);
      setShowContent(true);

      // Track that user searched for this topic
      if (videosWithMetadata.length > 0) {
        await trackVideoWatch(currentUser.uid, {
          id: 'search',
          title: `Searched: ${topic}`,
          channel: 'Search',
          topic,
          category,
          contentType: activeTab,
          duration: 0
        });
      }

      // Refresh watch history
      loadWatchHistory();
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
      setShowContent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowContent(false);
    setVideos([]);
    setCurrentTopic('');
    setSearchQuery('');
    setSearchError('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (showContent) {
      // Reload content for new tab
      loadVideosForTopic(currentTopic, null);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show video content
  if (showContent) {
    if (videos.length === 0) {
      return (
        <div className="smart-study-reels">
          <div className="empty-state">
            <FaExclamationTriangle className="empty-icon" />
            <h2>No videos found</h2>
            <p>Try searching for a different topic</p>
            <button onClick={handleBack} className="back-button">
              <FaArrowLeft /> Back to Topics
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'shorts') {
      return <ReelsContainer videos={videos} onBack={handleBack} />;
    } else {
      return <LecturesGrid videos={videos} onBack={handleBack} />;
    }
  }

  // Main recommendation interface
  return (
    <div className="smart-study-reels">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="reels-header"
      >
        <div className="header-content">
          <div className="header-title">
            <div className="title-icon">
              <FaGraduationCap />
            </div>
            <div>
              <h1>Smart Study Reels</h1>
              <p>AI-Powered Controlled Learning Content</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              onClick={() => handleTabChange('shorts')}
              className={`tab-button ${activeTab === 'shorts' ? 'active' : ''}`}
            >
              <FaPlay />
              <span>Short Reels</span>
            </button>
            <button
              onClick={() => handleTabChange('lectures')}
              className={`tab-button ${activeTab === 'lectures' ? 'active' : ''}`}
            >
              <FaGraduationCap />
              <span>Long Lectures</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="search-section"
      >
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError('');
              }}
              placeholder="Search educational topics... (e.g., React Hooks, DSA, Python)"
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchError('');
                }}
                className="clear-button"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className="search-submit-button"
            disabled={validatingSearch || loading}
          >
            {validatingSearch ? (
              <>
                <div className="button-spinner"></div>
                <span>Validating...</span>
              </>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Search Error */}
        <AnimatePresence>
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="search-error"
            >
              <FaExclamationTriangle />
              <span>{searchError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Info */}
        {validatingSearch ? (
          <div className="search-validating">
            <div className="validating-spinner"></div>
            <span>🤖 AI is optimizing your learning search...</span>
          </div>
        ) : optimizedQuery && optimizedQuery !== searchQuery ? (
          <div className="search-optimized">
            <FaCheckCircle className="info-icon" />
            <div>
              <span className="optimized-label">AI Optimized:</span>
              <span className="optimized-query">"{optimizedQuery}"</span>
            </div>
          </div>
        ) : (
          <div className="search-info">
            <FaCheckCircle className="info-icon" />
            <span>🤖 AI-powered search • Corrects spelling • Expands abbreviations</span>
          </div>
        )}
      </motion.div>

      {/* Recommended Topics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="topics-section"
      >
        <div className="section-header">
          <div className="section-title">
            <FaBrain className="section-icon" />
            <h2>Recommended For You</h2>
          </div>
          <p className="section-subtitle">Based on your tasks, timetable, and learning activity</p>
        </div>

        {loadingRecommendations ? (
          <div className="topics-loading">
            <div className="spinner"></div>
            <p>Generating personalized recommendations...</p>
          </div>
        ) : (
          <div className="topics-grid">
            {recommendedTopics.map((topic, index) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTopicClick(topic)}
                className="topic-card"
              >
                <div className="topic-icon">{topic.icon}</div>
                <div className="topic-label">{topic.label}</div>
                {topic.sources && topic.sources.length > 0 && (
                  <div className="topic-sources">
                    {topic.sources.includes('tasks') && <FaTasks title="From Tasks" />}
                    {topic.sources.includes('github') && <FaGithub title="From GitHub" />}
                    {topic.sources.includes('weakSubjects') && <FaChartLine title="Weak Subject" />}
                    {topic.sources.includes('focusSessions') && <FaClock title="From Focus Sessions" />}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="topics-section"
        >
          <div className="section-header">
            <div className="section-title">
              <FaFire className="section-icon trending" />
              <h2>Trending Skills</h2>
            </div>
            <p className="section-subtitle">Popular topics among students</p>
          </div>

          <div className="trending-grid">
            {trendingTopics.map((topic, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleTopicClick({ label: topic.topic, category: topic.category, icon: topic.icon })}
                className="trending-card"
              >
                <div className="trending-icon">{topic.icon}</div>
                <div className="trending-info">
                  <div className="trending-label">{topic.topic}</div>
                  <div className="trending-count">{topic.count} students watching</div>
                </div>
                <FaFire className="trending-flame" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="topics-section"
        >
          <div className="section-header">
            <div className="section-title">
              <FaHistory className="section-icon" />
              <h2>Continue Learning</h2>
            </div>
            <p className="section-subtitle">Recently watched topics</p>
          </div>

          <div className="history-grid">
            {watchHistory.slice(0, 6).map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTopicClick({ label: item.topic, category: item.category })}
                className="history-card"
              >
                <div className="history-icon">
                  <FaPlay />
                </div>
                <div className="history-info">
                  <div className="history-topic">{item.topic}</div>
                  <div className="history-meta">
                    <span>{item.contentType === 'shorts' ? 'Short Reel' : 'Lecture'}</span>
                    <span>•</span>
                    <span>{item.watchedAt ? new Date(item.watchedAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Access Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="topics-section"
      >
        <div className="section-header">
          <div className="section-title">
            <FaLightbulb className="section-icon" />
            <h2>Quick Access</h2>
          </div>
          <p className="section-subtitle">Popular learning categories</p>
        </div>

        <div className="quick-access-grid">
          {DEFAULT_TOPICS.slice(0, 8).map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleTopicClick(topic)}
              className="quick-access-card"
            >
              <div className="quick-icon">{topic.icon}</div>
              <div className="quick-label">{topic.label}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Educational Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="educational-notice"
      >
        <FaStar className="notice-icon" />
        <div className="notice-content">
          <h3>Focused Learning Environment</h3>
          <p>
            This platform is optimized for educational content only. 
            All recommendations are AI-generated based on your learning goals, 
            tasks, and study patterns to maximize productivity.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default SmartStudyReels;
