import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaGithub, FaEdit, FaSave, FaTimes, FaSpinner, FaBrain, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import { getUserProfile, updateUserProfile, getRegisteredColleges, departments, semesters } from '../../services/firestoreService';
import { extractSkillsFromRepos, getGitHubStats } from '../../services/githubService';
import { getRecentStressAnalytics, calculateAverageStressScore, getStressTrend, getStressLevelInfo } from '../../services/stressDetectionService';

function Profile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fetchingGitHub, setFetchingGitHub] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const initialProfile = {
    fullName: '',
    email: currentUser?.email || '',
    college: '',
    department: '',
    semester: '',
    bio: '',
    githubUsername: '',
    skills: [],
    interests: [],
    profileImage: '',
    momentumScore: 0,
    streak: 0,
    totalStudyHours: 0
  };

  const [profile, setProfile] = useState(initialProfile);
  const [editedProfile, setEditedProfile] = useState(initialProfile);
  const [githubStats, setGithubStats] = useState(null);
  const [registeredColleges, setRegisteredColleges] = useState([]);
  const [stressData, setStressData] = useState(null);
  const [loadingStress, setLoadingStress] = useState(true);

  useEffect(() => {
    console.log('Profile component mounted, currentUser:', currentUser?.uid);
    if (currentUser) {
      loadProfile();
      loadRegisteredColleges();
      loadStressData();
    }
  }, [currentUser]);

  const loadRegisteredColleges = async () => {
    try {
      const colleges = await getRegisteredColleges();
      console.log('Registered colleges loaded:', colleges);
      setRegisteredColleges(colleges);
    } catch (error) {
      console.error('Error loading registered colleges:', error);
      // Fallback to empty array if error
      setRegisteredColleges([]);
    }
  };

  const loadStressData = async () => {
    if (!currentUser) {
      setLoadingStress(false);
      return;
    }

    try {
      setLoadingStress(true);
      const analytics = await getRecentStressAnalytics(currentUser.uid, 7);
      
      if (analytics.length > 0) {
        const avgStressScore = calculateAverageStressScore(analytics);
        const trend = getStressTrend(analytics);
        const latestAnalysis = analytics[0];
        
        // Get stress level from average score
        const stressLevel = avgStressScore >= 81 ? 'critical' : 
                           avgStressScore >= 61 ? 'high' : 
                           avgStressScore >= 31 ? 'medium' : 'low';
        
        const stressInfo = getStressLevelInfo(stressLevel);
        
        // Extract common keywords and topics
        const allKeywords = analytics.flatMap(a => a.keywords || []);
        const keywordFrequency = {};
        allKeywords.forEach(keyword => {
          keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });
        const topKeywords = Object.entries(keywordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([keyword]) => keyword);
        
        const allTopics = analytics.flatMap(a => a.topics || []);
        const uniqueTopics = [...new Set(allTopics)];
        
        setStressData({
          avgStressScore,
          stressLevel,
          stressInfo,
          trend,
          topKeywords,
          topics: uniqueTopics,
          latestAnalysis,
          totalAnalyses: analytics.length,
          recommendations: latestAnalysis.recommendations || []
        });
      } else {
        setStressData({
          avgStressScore: 0,
          stressLevel: 'low',
          stressInfo: getStressLevelInfo('low'),
          trend: 'insufficient_data',
          topKeywords: [],
          topics: [],
          latestAnalysis: null,
          totalAnalyses: 0,
          recommendations: []
        });
      }
    } catch (error) {
      console.error('Error loading stress data:', error);
      setStressData(null);
    } finally {
      setLoadingStress(false);
    }
  };

  const loadProfile = async () => {
    if (!currentUser) {
      console.log('loadProfile: No current user');
      setLoading(false);
      return;
    }

    try {
      console.log('loadProfile: Starting to load profile for user:', currentUser.uid);
      setLoading(true);
      const userData = await getUserProfile(currentUser.uid);
      console.log('loadProfile: Received user data:', userData);
      
      // Create default profile structure if no data exists
      const defaultProfile = {
        fullName: currentUser.displayName || '',
        email: currentUser.email || '',
        college: '',
        department: '',
        semester: '',
        bio: '',
        githubUsername: '',
        skills: [],
        interests: [],
        profileImage: currentUser.photoURL || '',
        momentumScore: 0,
        streak: 0,
        totalStudyHours: 0
      };

      const finalProfile = userData ? { ...defaultProfile, ...userData } : defaultProfile;
      console.log('loadProfile: Final profile:', finalProfile);
      
      setProfile(finalProfile);
      setEditedProfile(finalProfile);
      
      // Fetch GitHub stats if username exists
      if (finalProfile.githubUsername) {
        console.log('loadProfile: Fetching GitHub data for:', finalProfile.githubUsername);
        fetchGitHubData(finalProfile.githubUsername);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('error', 'Failed to load profile. Using default values.');
      
      // Set default profile on error
      const defaultProfile = {
        fullName: currentUser.displayName || '',
        email: currentUser.email || '',
        college: '',
        department: '',
        semester: '',
        bio: '',
        githubUsername: '',
        skills: [],
        interests: [],
        profileImage: currentUser.photoURL || '',
        momentumScore: 0,
        streak: 0,
        totalStudyHours: 0
      };
      setProfile(defaultProfile);
      setEditedProfile(defaultProfile);
    } finally {
      console.log('loadProfile: Loading complete');
      setLoading(false);
    }
  };

  const fetchGitHubData = async (username) => {
    try {
      setFetchingGitHub(true);
      const stats = await getGitHubStats(username);
      setGithubStats(stats);
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
    } finally {
      setFetchingGitHub(false);
    }
  };

  const handleExtractSkills = async () => {
    if (!editedProfile.githubUsername) {
      showMessage('error', 'Please enter a GitHub username first');
      return;
    }

    try {
      setFetchingGitHub(true);
      showMessage('info', 'Extracting skills from GitHub...');
      
      const skillsData = await extractSkillsFromRepos(editedProfile.githubUsername);
      const allSkills = [...skillsData.languages, ...skillsData.frameworks];
      
      setEditedProfile({
        ...editedProfile,
        skills: allSkills
      });
      
      showMessage('success', `Extracted ${allSkills.length} skills from GitHub!`);
    } catch (error) {
      console.error('Error extracting skills:', error);
      showMessage('error', 'Failed to extract skills from GitHub');
    } finally {
      setFetchingGitHub(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Check if college or department changed
      const collegeChanged = editedProfile.college !== profile.college;
      const departmentChanged = editedProfile.department !== profile.department;
      
      if (collegeChanged || departmentChanged) {
        const confirmChange = window.confirm(
          '⚠️ Important: Changing your college or department will affect which college admin can view your data.\n\n' +
          'Are you sure you want to make this change?'
        );
        
        if (!confirmChange) {
          setSaving(false);
          return;
        }
      }
      
      await updateUserProfile(currentUser.uid, editedProfile);
      setProfile(editedProfile);
      setEditMode(false);
      showMessage('success', 'Profile updated successfully!');
      
      // Fetch GitHub stats if username changed
      if (editedProfile.githubUsername !== profile.githubUsername) {
        fetchGitHubData(editedProfile.githubUsername);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setEditMode(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const addSkill = (skill) => {
    if (skill && !editedProfile.skills.includes(skill)) {
      setEditedProfile({
        ...editedProfile,
        skills: [...editedProfile.skills, skill]
      });
    }
  };

  const removeSkill = (skillToRemove) => {
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills.filter(s => s !== skillToRemove)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
          >
            <FaEdit />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
            >
              <FaTimes />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Message Toast */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {editedProfile.fullName?.[0] || currentUser?.email?.[0].toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {editMode ? (
                <input
                  type="text"
                  value={editedProfile.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                  placeholder="Your Name"
                />
              ) : (
                profile.fullName || 'Student'
              )}
            </h2>
            <p className="text-gray-600 mb-4">{profile.email}</p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-2xl font-bold text-gray-900">{profile.momentumScore || 0}</p>
                <p className="text-xs text-gray-600">Momentum</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{profile.streak || 0}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
            </div>
          </div>

          {/* GitHub Stats */}
          {githubStats && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
              <div className="flex items-center space-x-2 mb-4">
                <FaGithub className="text-xl text-gray-900" />
                <h3 className="font-semibold text-gray-900">GitHub Stats</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Repositories</span>
                  <span className="font-medium text-gray-900">{githubStats.publicRepos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-medium text-gray-900">{githubStats.followers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Stars</span>
                  <span className="font-medium text-gray-900">{githubStats.totalStars}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            {editMode && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Your college and department determine which college admin can view your analytics data. 
                  Make sure to select the correct institution.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  {editMode ? (
                    <select
                      value={editedProfile.college}
                      onChange={(e) => handleInputChange('college', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select College</option>
                      {registeredColleges.length > 0 ? (
                        registeredColleges.map(college => (
                          <option key={college} value={college}>{college}</option>
                        ))
                      ) : (
                        <option value="" disabled>Loading colleges...</option>
                      )}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.college || 'Not set'}</p>
                  )}
                  {editMode && registeredColleges.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No colleges registered yet. Please contact admin.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  {editMode ? (
                    <select
                      value={editedProfile.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.department || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                {editMode ? (
                  <select
                    value={editedProfile.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.semester || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {editMode ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.bio || 'No bio added yet'}</p>
                )}
              </div>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GitHub Integration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Username</label>
                {editMode ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editedProfile.githubUsername}
                      onChange={(e) => handleInputChange('githubUsername', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="your-github-username"
                    />
                    <button
                      onClick={handleExtractSkills}
                      disabled={fetchingGitHub || !editedProfile.githubUsername}
                      className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {fetchingGitHub ? <FaSpinner className="animate-spin" /> : 'Extract Skills'}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-900">{profile.githubUsername || 'Not connected'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            {editMode ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {editedProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSkill(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Type a skill and press Enter"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-600">No skills added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Study Analytics */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Analytics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profile.totalStudyHours || 0}h</p>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profile.momentumScore || 0}</p>
                <p className="text-sm text-gray-600">Momentum</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profile.streak || 0}</p>
                <p className="text-sm text-gray-600">Streak</p>
              </div>
            </div>
          </div>

          {/* Wellness & Stress Level */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FaBrain className="text-xl text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Wellness & Stress Level</h3>
            </div>

            {loadingStress ? (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-2xl text-gray-400" />
              </div>
            ) : stressData && stressData.totalAnalyses > 0 ? (
              <div className="space-y-6">
                {/* Stress Level Indicator */}
                <div 
                  className="p-6 rounded-xl border-2"
                  style={{ 
                    backgroundColor: stressData.stressInfo.bgColor,
                    borderColor: stressData.stressInfo.color
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{stressData.stressInfo.emoji}</span>
                      <div>
                        <h4 className="text-xl font-bold" style={{ color: stressData.stressInfo.color }}>
                          {stressData.stressInfo.label}
                        </h4>
                        <p className="text-sm text-gray-700">
                          Average Stress Score: {stressData.avgStressScore}/100
                        </p>
                      </div>
                    </div>
                    {stressData.trend !== 'insufficient_data' && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {stressData.trend === 'increasing' ? '📈 Increasing' :
                           stressData.trend === 'decreasing' ? '📉 Decreasing' :
                           '➡️ Stable'}
                        </p>
                        <p className="text-xs text-gray-600">Last 7 days</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-3 mb-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stressData.avgStressScore}%`,
                        backgroundColor: stressData.stressInfo.color
                      }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-700">
                    {stressData.stressInfo.description}
                  </p>
                </div>

                {/* Why This Stress Level */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaExclamationTriangle className="text-orange-500" />
                    <h4 className="font-semibold text-gray-900">Why This Stress Level?</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Common Stressors */}
                    {stressData.topKeywords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Common Stressors Detected:</p>
                        <div className="flex flex-wrap gap-2">
                          {stressData.topKeywords.map((keyword, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Topics */}
                    {stressData.topics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Main Concerns:</p>
                        <div className="flex flex-wrap gap-2">
                          {stressData.topics.map((topic, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis Summary */}
                    {stressData.latestAnalysis?.detailedAnalysis && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Latest Analysis:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {stressData.latestAnalysis.detailedAnalysis}
                        </p>
                      </div>
                    )}

                    {/* Data Source */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Based on {stressData.totalAnalyses} AI conversation{stressData.totalAnalyses !== 1 ? 's' : ''} in the last 7 days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {stressData.recommendations.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <FaLightbulb className="text-green-600" />
                      <h4 className="font-semibold text-gray-900">Wellness Recommendations</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {stressData.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-white rounded-lg p-3">
                          <span className="text-2xl flex-shrink-0">{rec.icon}</span>
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">{rec.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="text-center">
                  <button
                    onClick={() => window.location.href = '/student/mentor'}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all"
                  >
                    Talk to AI Mentor
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaBrain className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No stress data available yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Chat with the AI Mentor to start tracking your wellness
                </p>
                <button
                  onClick={() => window.location.href = '/student/mentor'}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all"
                >
                  Start Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
