import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageLoadingSkeleton from './components/ui/PageLoadingSkeleton';
import './App.css';

// Lazy load page components to enable code splitting and Suspense loading states
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboardPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboardPage'));

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#0a0101', minHeight: '100vh' }}>
        {/* Navigation is removed from here - each feature has its own structure */}
        <Suspense fallback={<PageLoadingSkeleton />}>
          <Routes>
            {/* Landing page where users select their role */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Dashboard Routes - They will each have their own internal navigation */}
            {/* Note: The * allows these components to manage their own sub-routes later */}
            <Route path="/instructor/*" element={<InstructorDashboard />} />
            <Route path="/student/*" element={<StudentDashboard />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
