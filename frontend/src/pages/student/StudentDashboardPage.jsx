import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import StudentSidebar from '../../features/student/shared/StudentSidebar';
import StudentDashboardView from '../../features/student/dashboard/views/StudentDashboardView';
import StudentPerformanceView from '../../features/student/performance/views/StudentPerformanceView';
import StudentGitHubView from '../../features/student/github/views/StudentGitHubView';
import StudentCareerView from '../../features/student/career-coach/views/StudentCareerView';
import EnrolledClassesView from '../../features/student/classes/views/EnrolledClassesView';
import useStudentData from '../../features/student/dashboard/hooks/useStudentData';

/* ─── Page Root ─── */
export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const { classes, loading: classesLoading, refetch } = useStudentData();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="h-screen flex bg-[#f8f9fb] font-sans overflow-hidden">
      <StudentSidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-[#f8f9fb] h-full">
        {activeView === 'dashboard'        && <StudentDashboardView user={user} onNavigate={setActiveView} />}
        {activeView === 'my-performance'   && <StudentPerformanceView user={user} />}
        {activeView === 'github-analytics' && <StudentGitHubView user={user} />}
        {activeView === 'enrolled-classes'  && <EnrolledClassesView classes={classesLoading ? null : classes} onRefresh={refetch} />}
        {activeView === 'career-coach'     && <StudentCareerView user={user} />}
      </main>
    </div>
  );
}
