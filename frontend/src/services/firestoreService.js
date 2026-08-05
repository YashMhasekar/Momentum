import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// User Profile Operations
export const getUserProfile = async (uid) => {
  if (!uid) {
    console.error('getUserProfile: No UID provided');
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      console.log('getUserProfile: User document does not exist for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    console.error('Error details:', error.message, error.code);
    throw error;
  }
};

export const createUserProfile = async (uid, profileData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, profileData) => {
  if (!uid) {
    console.error('updateUserProfile: No UID provided');
    throw new Error('User ID is required');
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    
    // Check if document exists first
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create the document if it doesn't exist
      console.log('updateUserProfile: Creating new user document');
      await setDoc(userDocRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing document
      await updateDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    console.error('Error details:', error.message, error.code);
    throw error;
  }
};

// College and Department data
export const colleges = [
  'AITM (Army Institute of Technology)',
  'KIT (Kolhapur Institute of Technology)',
  'DY Patil College of Engineering',
  'MIT (Maharashtra Institute of Technology)',
  'COEP (College of Engineering Pune)',
  'VIT (Vishwakarma Institute of Technology)',
  'PICT (Pune Institute of Computer Technology)',
  'Other'
];

export const departments = [
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence & Machine Learning (AIML)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Information Technology (IT)',
  'Data Science',
  'Other'
];

export const semesters = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8'
];

// Get all registered colleges from Firestore
export const getRegisteredColleges = async () => {
  try {
    const collegesRef = collection(db, 'users');
    const q = query(
      collegesRef,
      where('role', '==', 'college_admin')
    );
    
    const querySnapshot = await getDocs(q);
    const colleges = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.collegeName && !colleges.includes(data.collegeName)) {
        colleges.push(data.collegeName);
      }
    });
    
    // Sort alphabetically
    return colleges.sort();
  } catch (error) {
    console.error('Error fetching registered colleges:', error);
    throw error;
  }
};

// Get departments for a specific college
export const getDepartmentsByCollege = async (collegeName) => {
  try {
    const studentsRef = collection(db, 'users');
    const q = query(
      studentsRef,
      where('role', '==', 'student'),
      where('college', '==', collegeName)
    );
    
    const querySnapshot = await getDocs(q);
    const departments = new Set();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.department) {
        departments.add(data.department);
      }
    });
    
    return Array.from(departments).sort();
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

export const getStudentsByCollege = async (collegeName) => {
  try {
    const studentsRef = collection(db, 'users');
    const q = query(
      studentsRef, 
      where('role', '==', 'student'),
      where('college', '==', collegeName)
    );
    
    const querySnapshot = await getDocs(q);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    return students;
  } catch (error) {
    console.error('Error fetching students by college:', error);
    throw error;
  }
};

export const getStudentsByCollegeAndDepartment = async (collegeName, department) => {
  try {
    const studentsRef = collection(db, 'users');
    const q = query(
      studentsRef,
      where('role', '==', 'student'),
      where('college', '==', collegeName),
      where('department', '==', department)
    );
    
    const querySnapshot = await getDocs(q);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    return students;
  } catch (error) {
    console.error('Error fetching students by college and department:', error);
    throw error;
  }
};

export const getDepartmentStats = async (collegeName) => {
  try {
    const students = await getStudentsByCollege(collegeName);
    
    // Group by department
    const departmentStats = {};
    
    students.forEach(student => {
      const dept = student.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          totalStudents: 0,
          avgMomentumScore: 0,
          avgStreak: 0,
          totalStudyHours: 0
        };
      }
      
      departmentStats[dept].totalStudents += 1;
      departmentStats[dept].avgMomentumScore += student.momentumScore || 0;
      departmentStats[dept].avgStreak += student.streak || 0;
      departmentStats[dept].totalStudyHours += student.totalStudyHours || 0;
    });
    
    // Calculate averages
    Object.keys(departmentStats).forEach(dept => {
      const count = departmentStats[dept].totalStudents;
      if (count > 0) {
        departmentStats[dept].avgMomentumScore = Math.round(departmentStats[dept].avgMomentumScore / count);
        departmentStats[dept].avgStreak = Math.round(departmentStats[dept].avgStreak / count);
      }
    });
    
    return departmentStats;
  } catch (error) {
    console.error('Error calculating department stats:', error);
    throw error;
  }
};
