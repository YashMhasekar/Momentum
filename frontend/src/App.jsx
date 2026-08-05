import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Student Dashboard
import StudentDashboardLayout from './components/student/StudentDashboardLayout';
import StudentDashboard from './components/student/StudentDashboard';
import Tasks from './components/student/Tasks';
import CollaborativeTasks from './components/student/CollaborativeTasks';
import FocusRoom from './components/student/FocusRoom';
import AIMentor from './components/student/AIMentor';
import Planner from './components/student/Planner';
import Analytics from './components/student/Analytics';
import HabitTracker from './components/student/HabitTracker';
import Profile from './components/student/Profile';
import Settings from './components/student/Settings';
import MoodTracker from './components/student/MoodTracker';
import SmartStudyReels from './components/student/SmartStudyReels';
import Calendar from './components/calendar/Calendar';
import Leaderboard from './components/student/Leaderboard';
import EmotionDetection from './components/student/EmotionDetection';
import CounselorBooking from './pages/student/CounselorBooking';
import AnonymousSupport from './pages/student/AnonymousSupport';

// College Dashboard
import CollegeDashboardLayout from './components/college/CollegeDashboardLayout';
import CollegeDashboard from './components/college/CollegeDashboard';
import StudentAnalytics from './components/college/StudentAnalytics';
import DepartmentManagement from './components/college/DepartmentManagement';
import StressMonitoring from './components/college/StressMonitoring';
import Reports from './components/college/Reports';
import AdminLeaderboard from './components/college/AdminLeaderboard';
import TaskReview from './components/college/TaskReview';
import SupportModeration from './components/college/SupportModeration';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route element={<StudentDashboardLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/tasks" element={<Tasks />} />
              <Route path="/student/collaborative-tasks" element={<CollaborativeTasks />} />
              <Route path="/student/focus" element={<FocusRoom />} />
              <Route path="/student/study-reels" element={<SmartStudyReels />} />
              <Route path="/student/calendar" element={<Calendar />} />
              <Route path="/student/mentor" element={<AIMentor />} />
              <Route path="/student/mood" element={<MoodTracker />} />
              <Route path="/student/emotion-detection" element={<EmotionDetection />} />
              <Route path="/student/planner" element={<Planner />} />
              <Route path="/student/analytics" element={<Analytics />} />
              <Route path="/student/habits" element={<HabitTracker />} />
              <Route path="/student/leaderboard" element={<Leaderboard />} />
              <Route path="/student/counselor" element={<CounselorBooking />} />
              <Route path="/student/anonymous-support" element={<AnonymousSupport />} />
              <Route path="/student/profile" element={<Profile />} />
              <Route path="/student/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* College Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['college_admin']} />}>
            <Route element={<CollegeDashboardLayout />}>
              <Route path="/college/dashboard" element={<CollegeDashboard />} />
              <Route path="/college/students" element={<StudentAnalytics />} />
              <Route path="/college/departments" element={<DepartmentManagement />} />
              <Route path="/college/stress-monitoring" element={<StressMonitoring />} />
              <Route path="/college/task-review" element={<TaskReview />} />
              <Route path="/college/reports" element={<Reports />} />
              <Route path="/college/leaderboard" element={<AdminLeaderboard />} />
              <Route path="/college/support-moderation" element={<SupportModeration />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast Notification Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
