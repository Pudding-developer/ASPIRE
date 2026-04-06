import React from 'react';
import Sidebar from './Sidebar';

export default function InstructorLayout({ children, activeView, setActiveView, onLogout, classes }) {
  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} classes={classes} />
      
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}
