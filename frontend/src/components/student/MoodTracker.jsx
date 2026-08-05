import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { FaSmile, FaMeh, FaFrown, FaTired, FaAngry, FaHeart, FaSpinner, FaCheckCircle } from 'react-icons/fa';

const moods = [
  { id: 'great', label: 'Great', emoji: '😄', icon: FaSmile, color: '#10b981', stressScore: 10 },
  { id: 'good', label: 'Good', emoji: '🙂', icon: FaSmile, color: '#3b82f6', stressScore: 25 },
  { id: 'okay', label: 'Okay', emoji: '😐', icon: FaMeh, color: '#f59e0b', stressScore: 50 },
  { id: 'bad', label: 'Bad', emoji: '😟', icon: FaFrown, color: '#ef4444', stressScore: 70 },
  { id: 'terrible', label: 'Terrible', emoji: '😫', icon: FaTired, color: '#991b1b', stressScore: 90 }
];

const stressLevels = [
  { id: 'none', label: 'No Stress', value: 0 },
  { id: 'low', label: 'Low Stress', value: 25 },
  { id: 'moderate', label: 'Moderate Stress', value: 50 },
  { id: 'high', label: 'High Stress', value: 75 },
  { id: 'extreme', label: 'Extreme Stress', value: 95 }
];

const activities = [
  'Studying', 'Exams', 'Assignments', 'Projects', 'Social Life', 
  'Family', 'Health', 'Sleep', 'Work', 'Finances', 'Relationships', 'Other'
];

function MoodTracker() {
  const { currentUser } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedStress, setSelectedStress] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentMoods, setRecentMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadRecentMoods();
    }
  }, [currentUser]);

  const loadRecentMoods = async () => {
    try {
      setLoading(true);
      const moodsRef = collection(db, 'moodTracking');
      const q = query(
        moodsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(7)
      );
      
      const snapshot = await getDocs(q);
      const moodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setRecentMoods(moodsData);
    } catch (error) {
      console.error('Error loading recent moods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || selectedStress === null) {
      alert('Please select both mood and stress level');
      return;
    }

    try {
      setSaving(true);
      
      const moodData = moods.find(m => m.id === selectedMood);
      const stressData = stressLevels.find(s => s.value === selectedStress);
      
      // Calculate combined stress score (mood + stress level + activities)
      const activityStressBonus = selectedActivities.length * 5; // Each stressor adds 5 points
      const combinedStressScore = Math.min(
        Math.round((moodData.stressScore + stressData.value + activityStressBonus) / 2),
        100
      );

      const moodEntry = {
        userId: currentUser.uid,
        mood: selectedMood,
        moodLabel: moodData.label,
        moodEmoji: moodData.emoji,
        stressLevel: selectedStress,
        stressLabel: stressData.label,
        stressScore: combinedStressScore,
        activities: selectedActivities,
        notes: notes.trim(),
        createdAt: new Date(),
        source: 'mood_tracker'
      };

      await addDoc(collection(db, 'moodTracking'), moodEntry);
      
      // Also save to stressAnalytics for unified stress tracking
      const stressEntry = {
        userId: currentUser.uid,
        stressScore: combinedStressScore,
        moodScore: 100 - moodData.stressScore, // Invert for mood score
        sentiment: selectedMood === 'great' || selectedMood === 'good' ? 'positive' : 
                   selectedMood === 'okay' ? 'neutral' : 'negative',
        keywords: selectedActivities,
        topics: selectedActivities,
        behavioralIndicators: [
          `Mood: ${moodData.label}`,
          `Stress: ${stressData.label}`,
          ...selectedActivities.map(a => `Concern: ${a}`)
        ],
        recommendations: generateRecommendations(combinedStressScore, selectedActivities),
        detailedAnalysis: `User reported feeling ${moodData.label.toLowerCase()} with ${stressData.label.toLowerCase()}. ${
          selectedActivities.length > 0 ? `Main concerns: ${selectedActivities.join(', ')}.` : ''
        } ${notes ? `Additional notes: ${notes}` : ''}`,
        source: 'mood_tracker',
        analysisMethod: 'mood-tracker',
        urgencyLevel: combinedStressScore >= 70 ? 'high' : combinedStressScore >= 50 ? 'medium' : 'low',
        supportiveMessage: `Thank you for tracking your mood. ${combinedStressScore >= 70 ? 'Consider talking to someone if you need support.' : 'Keep taking care of yourself!'}`,
        timestamp: new Date(),
        createdAt: new Date()
      };

      await addDoc(collection(db, 'stressAnalytics'), stressEntry);

      setSaved(true);
      setTimeout(() => {
        // Reset form
        setSelectedMood(null);
        setSelectedStress(null);
        setSelectedActivities([]);
        setNotes('');
        setSaved(false);
        loadRecentMoods();
      }, 2000);

    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const generateRecommendations = (stressScore, activities) => {
    const recs = [];
    
    if (stressScore >= 70) {
      recs.push({
        icon: '🧘',
        title: 'Take a Break',
        description: 'Consider taking a 10-minute break to relax and recharge'
      });
    }
    
    if (activities.includes('Sleep')) {
      recs.push({
        icon: '😴',
        title: 'Improve Sleep',
        description: 'Try to maintain a consistent sleep schedule'
      });
    }
    
    if (activities.includes('Studying') || activities.includes('Exams')) {
      recs.push({
        icon: '📚',
        title: 'Study Smart',
        description: 'Break study sessions into 25-minute focused intervals'
      });
    }
    
    if (activities.includes('Social Life') || activities.includes('Relationships')) {
      recs.push({
        icon: '💬',
        title: 'Connect',
        description: 'Reach out to friends or family for support'
      });
    }
    
    if (recs.length === 0) {
      recs.push({
        icon: '✨',
        title: 'Keep Going',
        description: 'You\'re doing great! Keep up the good work'
      });
    }
    
    return recs;
  };

  const toggleActivity = (activity) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  const getMoodColor = (moodId) => {
    return moods.find(m => m.id === moodId)?.color || '#gray';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mood Tracker</h1>
        <p className="text-gray-600">Track your daily mood and stress levels to improve your wellness</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How are you feeling today?</h2>
            <div className="grid grid-cols-5 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedMood === mood.id
                      ? 'border-gray-900 bg-gray-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{mood.emoji}</div>
                  <p className="text-sm font-medium text-gray-900">{mood.label}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stress Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's your stress level?</h2>
            <div className="space-y-3">
              {stressLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedStress(level.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedStress === level.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{level.label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${level.value}%`,
                            backgroundColor: level.value >= 75 ? '#ef4444' : 
                                           level.value >= 50 ? '#f59e0b' : 
                                           level.value >= 25 ? '#3b82f6' : '#10b981'
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{level.value}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Activities/Stressors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's affecting you? (Optional)</h2>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => toggleActivity(activity)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedActivities.includes(activity)
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="How are you feeling? What's on your mind?"
            />
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleSaveMood}
              disabled={saving || saved || !selectedMood || selectedStress === null}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <FaCheckCircle />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <FaHeart />
                  <span>Save Mood</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Sidebar - Recent Moods */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Moods</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : recentMoods.length > 0 ? (
              <div className="space-y-3">
                {recentMoods.map((mood) => (
                  <div
                    key={mood.id}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{mood.moodEmoji}</span>
                      <span className="text-xs text-gray-500">
                        {mood.createdAt?.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{mood.moodLabel}</p>
                    <p className="text-xs text-gray-600">{mood.stressLabel}</p>
                    {mood.activities && mood.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mood.activities.slice(0, 2).map((activity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {activity}
                          </span>
                        ))}
                        {mood.activities.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{mood.activities.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No mood entries yet</p>
                <p className="text-gray-400 text-xs mt-1">Start tracking your mood today!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default MoodTracker;
