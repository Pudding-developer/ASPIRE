import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import InstructorLayout from '../../features/instructor/components/InstructorLayout';
import DashboardView from '../../features/instructor/views/DashboardView';
import MyClassesView from '../../features/instructor/views/MyClassesView';
import ArchivedClassesView from '../../features/instructor/views/ArchivedClassesView';
import ClassDetailView from '../../features/instructor/views/ClassDetailView';
import { CreateClassModal, ClassCodeModal, ConfirmationModal } from '../../features/instructor/components/InstructorModals';

const mockClasses = [
  { id: 'class-cs201', subjectName: 'Data Structures', courseCode: 'CS 201', section: 'A', studentCount: 35 },
  { id: 'class-math101', subjectName: 'Calculus I', courseCode: 'MATH 101', section: 'B', studentCount: 42 },
  { id: 'class-eng102', subjectName: 'Communications', courseCode: 'ENG 102', section: 'C', studentCount: 28 },
];

const mockArchived = [
  { id: 'class-hist101', subjectName: 'World History', courseCode: 'HIST 101', section: 'A', studentCount: 30, archivedDate: 'Mar 15, 2025' }
];

const InstructorDashboard = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('instructor-portal');

  // Validate session against DB (catches deactivated accounts)
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetch('http://localhost:8000/api/instructor/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => {
      // 403 Forbidden -> e.g., INSTRUCTOR_DEACTIVATED logic in deps.py
      if (r.status === 401 || r.status === 403) {
        logout();
        navigate('/');
      }
    })
    .catch(console.error);
  }, [token, logout, navigate]);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleCreateSubmit = () => {
    setIsCreateOpen(false);
    // Auto-show the generated class code upon creation
    setIsCodeOpen(true);
  };

  const triggerConfirm = (title, message, confirmText, variant, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, confirmText, variant, onConfirm });
  };

  const closeConfirm = () => setConfirmConfig(null);

  return (
    <>
      <InstructorLayout activeView={activeView} setActiveView={setActiveView}>
        {activeView === 'instructor-portal' && <DashboardView onCreateClass={() => setIsCreateOpen(true)} />}

        {activeView === 'my-classes' && (
          <MyClassesView
            classes={mockClasses}
            onSelectClass={setActiveView}
            onCreateClass={() => setIsCreateOpen(true)}
          />
        )}

        {activeView === 'archived' && (
          <ArchivedClassesView
            classes={mockArchived}
            onRestore={() => triggerConfirm('Restore Class', 'Are you sure you want to restore this class?', 'Restore', 'success', () => { })}
            onDelete={() => triggerConfirm('Permanently Delete', 'This action cannot be undone. All student records will be destroyed.', 'Delete Forever', 'danger', () => { })}
          />
        )}

        {activeView.startsWith('class-') && (
          <ClassDetailView
            classId={activeView}
            onBack={() => setActiveView('my-classes')}
            onShowCode={() => setIsCodeOpen(true)}
            onArchive={() => triggerConfirm('Archive Class', 'This class will be moved to archives and no longer active.', 'Archive', 'danger', () => { })}
            onDelete={() => triggerConfirm('Delete Class', 'This will completely erase all grades and data associated.', 'Delete', 'danger', () => { })}
          />
        )}
      </InstructorLayout>

      {/* Global Modals */}
      <CreateClassModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateSubmit} />
      <ClassCodeModal isOpen={isCodeOpen} onClose={() => setIsCodeOpen(false)} />
      {confirmConfig && (
        <ConfirmationModal
          isOpen={confirmConfig.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          variant={confirmConfig.variant}
        />
      )}
    </>
  );
};

export default InstructorDashboard;
