import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageLoadingSkeleton from './components/ui/PageLoadingSkeleton';
import RouteTransitionLoader from './components/ui/RouteTransitionLoader';
import './App.css';

// Lazy load page components to enable code splitting and Suspense loading states
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboardPage'));
const InstructorRegisterPage = lazy(() => import('./pages/instructor/InstructorRegisterPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#0a0101', minHeight: '100vh' }}>
        <RouteTransitionLoader />
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* OAuth callback — receives JWT from Google redirect */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Instructor registration (public — token validated on mount) */}
            <Route path="/instructor/register" element={<InstructorRegisterPage />} />

            {/* Instructor dashboard */}
            <Route path="/instructor/*" element={<InstructorDashboard />} />

            {/* Admin dashboard */}
            <Route path="/admin/*" element={<AdminDashboardPage />} />

            {/* Student dashboard */}
            <Route path="/student/*" element={<StudentDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
