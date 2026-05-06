import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import StudentSidebar from '../../features/student/shared/StudentSidebar';
import StudentDashboardView from '../../features/student/dashboard/views/StudentDashboardView';
import StudentPerformanceView from '../../features/student/performance/views/StudentPerformanceView';
import StudentGitHubView from '../../features/student/github/views/StudentGitHubView';
import StudentCareerView from '../../features/student/career-coach/views/StudentCareerView';
import StudentAIChatView from '../../features/student/ai-chat/views/StudentAIChatView';
import StudentFAQView from '../../features/student/faq/views/StudentFAQView';
import EnrolledClassesView from '../../features/student/classes/views/EnrolledClassesView';
import useStudentData from '../../features/student/dashboard/hooks/useStudentData';
import AIChatBubble from '../../features/student/ai-chat/components/AIChatBubble';

/* ─── Page Root ─── */
export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const { classes, archivedClasses, loading: classesLoading, refetch } = useStudentData();

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#f8f9fb]">Loading session...</div>;

  return (
    <div className="h-screen flex bg-[#f8f9fb] font-sans overflow-hidden">
      <StudentSidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-y-auto bg-[#f8f9fb] h-full">
        <div className={activeView === 'dashboard' ? '' : 'hidden'}>
          <StudentDashboardView user={user} onNavigate={setActiveView} />
        </div>
        <div className={activeView === 'my-performance' ? '' : 'hidden'}>
          <StudentPerformanceView user={user} />
        </div>
        <div className={activeView === 'github-analytics' ? '' : 'hidden'}>
          <StudentGitHubView user={user} />
        </div>
        <div className={activeView === 'enrolled-classes' ? '' : 'hidden'}>
          <EnrolledClassesView classes={classesLoading ? null : classes} archivedClasses={classesLoading ? null : archivedClasses} onRefresh={refetch} />
        </div>
        <div className={activeView === 'career-coach' ? '' : 'hidden'}>
          <StudentCareerView user={user} />
        </div>
        <div className={activeView === 'ai-chat' ? 'h-full' : 'hidden'}>
          <StudentAIChatView user={user} />
        </div>
        <div className={activeView === 'faq' ? '' : 'hidden'}>
          <StudentFAQView />
        </div>
      </main>

      {/* Floating AI Chat Bubble — shown on all main views except the full AI Chat page */}
      {['dashboard', 'enrolled-classes', 'my-performance', 'github-analytics', 'career-coach'].includes(activeView) && (
        <AIChatBubble user={user} activeView={activeView} />
      )}
    </div>
  );
}
