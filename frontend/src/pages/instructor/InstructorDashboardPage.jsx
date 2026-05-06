import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import InstructorLayout from '../../features/instructor/components/InstructorLayout';
import DashboardView from '../../features/instructor/views/DashboardView';
import MyClassesView from '../../features/instructor/views/MyClassesView';
import ArchivedClassesView from '../../features/instructor/views/ArchivedClassesView';
import ClassDetailView from '../../features/instructor/views/ClassDetailView';
import { CreateClassModal, ClassCodeModal, ConfirmationModal } from '../../features/instructor/components/InstructorModals';
import { useInstructorClasses } from '../../features/instructor/hooks/useInstructorClasses';

const InstructorDashboard = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('instructor-portal');

  const { classes, archivedClasses, stats, loading, error, createClass, archiveClass, restoreClass, deleteClass, refetch } = useInstructorClasses();

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
  const [newClassCode, setNewClassCode] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleCreateSubmit = async (formData) => {
    const newClass = await createClass(formData);
    setIsCreateOpen(false);
    setNewClassCode(newClass.class_code);
    setIsCodeOpen(true);
  };

  const triggerConfirm = (title, message, confirmText, variant, onConfirm) => {
    setConfirmConfig({ isOpen: true, title, message, confirmText, variant, onConfirm });
  };

  const closeConfirm = () => setConfirmConfig(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#70170f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-[#70170f] text-white rounded-lg hover:bg-[#4a0e09] transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <InstructorLayout activeView={activeView} setActiveView={setActiveView} classes={classes}>
        {activeView === 'instructor-portal' && (
          <DashboardView
            onCreateClass={() => setIsCreateOpen(true)}
            stats={stats}
            loading={loading}
            classes={classes}
          />
        )}

        {activeView === 'my-classes' && (
          <MyClassesView
            classes={classes}
            onSelectClass={setActiveView}
            onCreateClass={() => setIsCreateOpen(true)}
          />
        )}

        {activeView === 'archived' && (
          <ArchivedClassesView
            classes={archivedClasses}
            onRestore={(id) => triggerConfirm('Restore Class', 'This class will be moved back to active classes and become visible to enrolled students.', 'Restore', 'default', async () => { await restoreClass(id); })}
            onDelete={(id) => triggerConfirm('Permanently Delete', 'This action cannot be undone. All student records will be destroyed.', 'Delete Forever', 'danger', () => deleteClass(id))}
          />
        )}

        {activeView.startsWith('class-') && (() => {
          const classId = parseInt(activeView.replace('class-', ''));
          const classObj = classes.find(c => c.id === classId);
          return (
            <ClassDetailView
              classId={activeView}
              classData={classObj}
              onBack={() => setActiveView('my-classes')}
              onShowCode={() => { setNewClassCode(classObj?.class_code || ''); setIsCodeOpen(true); }}
              onArchive={() => {
                triggerConfirm('Archive Class', 'This class will be moved to archives and no longer active.', 'Archive', 'danger', async () => {
                  await archiveClass(classId);
                  setActiveView('my-classes');
                });
              }}
              onDelete={() => {
                triggerConfirm('Delete Class', 'This will completely erase all grades and data associated.', 'Delete', 'danger', async () => {
                  await deleteClass(classId);
                  setActiveView('my-classes');
                });
              }}
            />
          );
        })()}
      </InstructorLayout>

      {/* Global Modals */}
      <CreateClassModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateSubmit} />
      <ClassCodeModal isOpen={isCodeOpen} onClose={() => setIsCodeOpen(false)} classCode={newClassCode} />
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
