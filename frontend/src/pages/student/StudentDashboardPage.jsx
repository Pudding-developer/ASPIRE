import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import StudentSidebar from '../../features/student/components/StudentSidebar';
import StudentDashboardView from '../../features/student/views/StudentDashboardView';

/* ─── Placeholder views ─── */
function PlaceholderView({ title }) {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">This section is coming soon.</p>
      </div>
    </div>
  );
}

/* ─── Page Root ─── */
export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="h-screen flex bg-[#f8f9fb] font-sans overflow-hidden">
      <StudentSidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-[#f8f9fb] h-full">
        {activeView === 'dashboard'        && <StudentDashboardView user={user} />}
        {activeView === 'my-performance'   && <PlaceholderView title="My Performance" />}
        {activeView === 'github-analytics' && <PlaceholderView title="GitHub Analytics" />}
        {activeView === 'career-coach'     && <PlaceholderView title="Career Coach" />}
      </main>
    </div>
  );
}
