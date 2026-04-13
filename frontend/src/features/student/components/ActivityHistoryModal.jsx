import { useEffect, useRef } from 'react';
import ContributionActivity from './ContributionActivity';

export default function ActivityHistoryModal({ isOpen, onClose, activities, repos }) {
  const modalRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div 
        ref={modalRef} 
        className="bg-[#0d1117] border border-[#30363d] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#30363d]">
          <h2 className="text-[18px] font-semibold text-[#c9d1d9]">Activity History</h2>
          <button 
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1 rounded-md hover:bg-[#21262d]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
          {activities && activities.length > 0 ? (
            <ContributionActivity activities={activities} showAll={true} repos={repos} />
          ) : (
            <p className="text-center text-[#8b949e] py-10">No recent activity found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
