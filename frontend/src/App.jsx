import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/landing/components/LandingPage';
import InstructorDashboard from './features/instructor/components/InstructorDashboard';
import StudentDashboard from './features/student/components/StudentDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Navigation is removed from here - each feature has its own structure */}
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
      </div>
    </Router>
  );
}

export default App;
