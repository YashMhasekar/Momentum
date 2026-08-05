import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../firebase';
import { createDefaultTasks } from '../services/taskService';
import { scheduleUserStatsUpdates } from '../services/userStatsUpdater';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const statsUpdateCleanupRef = useRef(null);

  // Signup with role
  async function signup(email, password, role = 'student', additionalData = {}) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore with complete structure
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: role,
      fullName: additionalData.displayName || '',
      college: additionalData.college || '',
      department: additionalData.department || '',
      semester: additionalData.semester || '',
      bio: additionalData.bio || '',
      githubUsername: additionalData.githubUsername || '',
      skills: additionalData.skills || [],
      interests: additionalData.interests || [],
      profileImage: additionalData.profileImage || '',
      momentumScore: additionalData.momentumScore || 0,
      streak: additionalData.streak || 0,
      totalStudyHours: additionalData.totalStudyHours || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalData
    });

    // Create default tasks for new user (only for students)
    if (role === 'student') {
      try {
        await createDefaultTasks(user.uid);
      } catch (error) {
        console.error('Error creating default tasks:', error);
        // Don't fail signup if default tasks fail
      }
    }

    return userCredential;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Login with role and Calendar access
  const loginWithGoogle = async (role = 'student') => {
    try {
      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get OAuth access token for Google Calendar
      const credential = result._tokenResponse;
      const accessToken = credential.oauthAccessToken || null;
      const refreshToken = credential.refreshToken || null;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create new user profile with complete structure
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          fullName: user.displayName || '',
          college: '',
          department: '',
          semester: '',
          bio: '',
          githubUsername: '',
          skills: [],
          interests: [],
          profileImage: user.photoURL || '',
          momentumScore: 0,
          streak: 0,
          totalStudyHours: 0,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          calendarSyncEnabled: true,
          lastCalendarSync: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Create default tasks for new user (only for students)
        if (role === 'student') {
          try {
            await createDefaultTasks(user.uid);
          } catch (error) {
            console.error('Error creating default tasks:', error);
            // Don't fail login if default tasks fail
          }
        }
      } else {
        // Update existing user with calendar tokens
        await setDoc(doc(db, 'users', user.uid), {
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          calendarSyncEnabled: true,
          lastCalendarSync: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const loginWithGithub = async (role = 'student') => {
    try {
      githubProvider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create new user profile with complete structure
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          fullName: user.displayName || '',
          college: '',
          department: '',
          semester: '',
          bio: '',
          githubUsername: '',
          skills: [],
          interests: [],
          profileImage: user.photoURL || '',
          momentumScore: 0,
          streak: 0,
          totalStudyHours: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Create default tasks for new user (only for students)
        if (role === 'student') {
          try {
            await createDefaultTasks(user.uid);
          } catch (error) {
            console.error('Error creating default tasks:', error);
            // Don't fail login if default tasks fail
          }
        }
      }

      return result;
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      throw error;
    }
  };

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function updateUserProfile(profile) {
    return updateProfile(auth.currentUser, profile);
  }

  // Update user data in Firestore
  async function updateUserData(data) {
    if (!currentUser) return;

    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
    setUserProfile({ ...userProfile, ...data });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Cleanup previous stats update schedule
      if (statsUpdateCleanupRef.current) {
        statsUpdateCleanupRef.current();
        statsUpdateCleanupRef.current = null;
      }

      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || 'student');
          setUserProfile(userData);

          // Schedule periodic stats updates for students
          if (userData.role === 'student') {
            statsUpdateCleanupRef.current = scheduleUserStatsUpdates(user.uid, 30);
          }
        } else {
          // Default to student if no profile exists
          setUserRole('student');
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (statsUpdateCleanupRef.current) {
        statsUpdateCleanupRef.current();
      }
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 