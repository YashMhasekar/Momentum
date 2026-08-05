import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { FaUser, FaGithub, FaEdit, FaPlus, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    skills: [],
    githubUsername: '',
    twitterUsername: '',
    linkedinUrl: '',
  });
  
  const [skillInput, setSkillInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User document exists, use its data
          const userData = userSnap.data();
          setProfileData({
            displayName: userData.displayName || currentUser.displayName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            company: userData.company || '',
            skills: userData.skills || [],
            githubUsername: userData.githubUsername || '',
            twitterUsername: userData.twitterUsername || '',
            linkedinUrl: userData.linkedinUrl || '',
          });
        } else {
          // Create a new user document if it doesn't exist
          const newUserData = {
            displayName: currentUser.displayName || '',
            email: currentUser.email,
            createdAt: new Date(),
            skills: [],
            bio: '',
            location: '',
            website: '',
            company: '',
            githubUsername: '',
            twitterUsername: '',
            linkedinUrl: '',
          };
          
          await setDoc(userRef, newUserData);
          setProfileData(newUserData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle adding skills
  const handleAddSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };
  
  // Handle removing skills
  const handleRemoveSkill = (skillToRemove) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  // Handle file selection for profile picture
  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Upload profile picture to Firebase Storage
  const uploadProfilePicture = async () => {
    if (!selectedFile) return null;
    
    const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };
  
  // Save profile data to Firestore
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setUpdating(true);
      setSuccessMessage('');
      setErrorMessage('');
      
      let photoURL = currentUser.photoURL;
      
      // Upload new profile picture if selected
      if (selectedFile) {
        photoURL = await uploadProfilePicture();
        
        // Update user profile in Firebase Auth
        await updateUserProfile({
          displayName: profileData.displayName,
          photoURL: photoURL
        });
      } else if (profileData.displayName !== currentUser.displayName) {
        // Update display name if changed
        await updateUserProfile({
          displayName: profileData.displayName
        });
      }
      
      // Update user document in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });
      
      setSuccessMessage('Profile updated successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };
  
  // Connect GitHub account
  const handleConnectGithub = async () => {
    if (!profileData.githubUsername) {
      setErrorMessage("Please enter your GitHub username first");
      return;
    }
    
    try {
      setUpdating(true);
      
      // In a real app, you would implement OAuth with GitHub
      // For now, we'll just save the GitHub username
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        githubUsername: profileData.githubUsername,
        githubConnected: true,
        updatedAt: new Date()
      });
      
      setSuccessMessage("GitHub username saved! In a real app, this would connect via OAuth.");
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setErrorMessage("Failed to save GitHub username. Please try again.");
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile Picture & Basic Info */}
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 relative mb-4">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={profileData.displayName || "User"} 
                      className="w-full h-full rounded-full object-cover border-4 border-gray-200" 
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center">
                      <FaUser className="w-12 h-12 text-blue-600" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <FaEdit className="w-4 h-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                    />
                  </label>
                </div>
                
                {selectedFile && (
                  <div className="text-sm text-gray-600 mb-2">
                    Selected: {selectedFile.name}
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={profileData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Middle Column - Professional Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company/Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={profileData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={profileData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profileData.skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add a skill..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column - Social Links */}
            <div className="space-y-6">
              {/* GitHub Integration */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FaGithub className="mr-2" /> GitHub Integration
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Connect your GitHub account to sync your repositories and contributions.
                </p>
                <div className="flex mb-3">
                  <input
                    type="text"
                    name="githubUsername"
                    value={profileData.githubUsername}
                    onChange={handleChange}
                    placeholder="GitHub username"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleConnectGithub}
                    disabled={updating || !profileData.githubUsername}
                    className="bg-gray-800 text-white px-4 py-2 rounded-r-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400"
                  >
                    {updating ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Connect'}
                  </button>
                </div>
              </div>
              
              {/* Other Social Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter Username
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 text-gray-500 border border-r-0 border-gray-300 rounded-l-lg">
                    @
                  </span>
                  <input
                    type="text"
                    name="twitterUsername"
                    value={profileData.twitterUsername}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={profileData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
            >
              {updating ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile; 