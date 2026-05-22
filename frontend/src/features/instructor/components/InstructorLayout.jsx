import React from 'react';
import Sidebar from './Sidebar';

export default function InstructorLayout({ children, activeView, setActiveView, onLogout, classes }) {
  return (
    <div className="h-screen overflow-hidden flex bg-white text-gray-900 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} classes={classes} />
      
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
