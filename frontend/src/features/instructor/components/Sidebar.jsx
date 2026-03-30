import { useState } from 'react';
import { LayoutDashboard, BookOpen, Archive, LogOut, ChevronUp, ChevronDown, PanelLeftClose, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aspireLogo from '../../../assets/aspire-logo.png';
import useAuth from '../../auth/hooks/useAuth';

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  const [classesOpen, setClassesOpen] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // The sidebar is effectively minimized only if it's both unpinned AND not currently being hovered.
  const isMinimized = !isPinned && !isHovered;

  const fullName = user?.full_name || 'Instructor';
  const email = user?.email || 'instructor@g.batstate-u.edu.ph';
  const initial = fullName.charAt(0).toUpperCase();

  // Mock list of classes
  const mockClasses = [
    { id: 'class-cs201', label: 'CS201 \u2013 A' },
    { id: 'class-cs301', label: 'CS301 \u2013 B' },
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${isMinimized ? 'w-[88px]' : 'w-[280px]'} min-h-screen bg-[#0d0101] border-r border-[#261010] flex flex-col flex-shrink-0 transition-all duration-300 relative z-20`}
    >
      {/* Top section: Logo & Toggle */}
      <div className={`px-4 pt-4 pb-1 flex ${isMinimized ? 'justify-center' : 'items-center justify-between'} overflow-visible min-h-[104px]`}>
        {!isMinimized && (
          <div className="flex flex-col items-start flex-1 -ml-2">
            <img src={aspireLogo} alt="ASPIRE" className="h-[125px] w-auto drop-shadow-lg" />
          </div>
        )}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className={`text-[#6a7a90] hover:text-white transition-colors flex-shrink-0 self-start mt-2 ${isMinimized ? '' : '-mr-1'}`}
          title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
        >
          {isPinned ? <PanelLeftClose size={20} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Profile Box */}
      <div className={`mb-4 shrink-0 ${isMinimized ? 'px-4' : 'px-5'}`}>
        <div className={`p-3 rounded-2xl border border-[#2a1212] bg-[#140202] flex items-center ${isMinimized ? 'justify-center' : 'gap-3'} transition-all`}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={fullName} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full flex-shrink-0 bg-[#bc1313] flex items-center justify-center text-white font-medium text-sm">
              {initial}
            </div>
          )}
          {!isMinimized && (
            <div className="overflow-hidden min-w-[160px]">
              <p className="text-[#e2e2e2] text-[15px] leading-tight font-medium truncate">{fullName}</p>
              <p className="text-[#737373] text-[13px] truncate">{email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Label */}
      {!isMinimized && (
        <div className="px-7 mb-2 shrink-0">
          <span className="text-[11px] font-semibold text-[#4e5b6e] tracking-widest uppercase mb-1">Menu</span>
        </div>
      )}

      {/* Middle section: Navigation */}
      <div className="px-3 space-y-1.5 flex-1 overflow-x-hidden">
        {/* Instructor Portal */}
        <button
          onClick={() => setActiveView('instructor-portal')}
          className={`w-full flex items-center ${isMinimized ? 'justify-center px-0' : 'gap-4 px-4'} py-3 rounded-xl transition-all ${activeView === 'instructor-portal'
            ? 'bg-[#bc1313] text-white'
            : 'text-[#8592a3] hover:text-white hover:bg-white/5'
            }`}
        >
          <LayoutDashboard size={20} className={`shrink-0 ${activeView === 'instructor-portal' ? 'text-white' : 'text-[#6a7a90]'}`} />
          {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap min-w-[150px] text-left">Instructor Portal</span>}
        </button>

        <div>
          <button
            title={isMinimized ? "Classes" : undefined}
            onClick={() => {
              if (isMinimized) {
                // If minimized, hovering already opened it, but clicking should probably just navigate or expand
                setActiveView('my-classes');
                setClassesOpen(true);
              } else {
                setActiveView('my-classes');
                setClassesOpen(!classesOpen);
              }
            }}
            className={`w-full flex items-center ${isMinimized ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-xl transition-all ${activeView === 'my-classes' || activeView.startsWith('class-')
              ? 'bg-[#bc1313] text-white shadow-[0_4px_20px_rgba(188,19,19,0.3)]'
              : 'text-[#8592a3] hover:text-white hover:bg-white/5'
              }`}
          >
            <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-4'} shrink-0`}>
              <BookOpen size={20} className={activeView === 'my-classes' || activeView.startsWith('class-') ? 'text-white' : 'text-[#6a7a90]'} />
              {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap text-left">Classes</span>}
            </div>
            {!isMinimized && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center justify-center bg-white/20 text-white text-[11px] w-5 h-5 rounded-full font-bold">2</span>
                {classesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            )}
          </button>

          {/* Sub-items block (collapsible class list) */}
          <div className={`overflow-hidden transition-all duration-300 ${classesOpen && !isMinimized ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="relative py-1">
              <div className="absolute left-[26px] top-0 bottom-3 w-px bg-[#261010]" />

              <div className="flex flex-col gap-1.5 relative z-10 w-full">
                {mockClasses.map((cls) => {
                  const isActive = activeView === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setActiveView(cls.id)}
                      className={`w-[calc(100%-38px)] ml-[38px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all text-left ${isActive
                        ? 'text-white bg-[#7a0f0f]'
                        : 'text-[#6a7a90] hover:text-[#a0acc0] hover:bg-white/5'
                        }`}
                    >
                      <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-[#4a5568]'}`} />
                      <span className="font-medium truncate">{cls.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Archived Classes */}
        <button
          onClick={() => setActiveView('archived')}
          title={isMinimized ? "Archived Classes" : undefined}
          className={`w-full flex items-center ${isMinimized ? 'justify-center px-0' : 'gap-4 px-4'} py-3 rounded-xl transition-all ${activeView === 'archived'
            ? 'bg-[#bc1313] text-white'
            : 'text-[#8592a3] hover:text-white hover:bg-white/5'
            }`}
        >
          <Archive size={20} className={`shrink-0 ${activeView === 'archived' ? 'text-white' : 'text-[#6a7a90]'}`} />
          {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap min-w-[150px] text-left">Archived Classes</span>}
        </button>
      </div>

      {/* Bottom section: Logout */}
      <div className="border-t border-[#261010] p-4 mt-auto shrink-0 overflow-x-hidden">
        <button
          onClick={() => {
            if (onLogout) onLogout();
            navigate('/');
          }}
          title={isMinimized ? "Log Out" : undefined}
          className={`w-full flex items-center ${isMinimized ? 'justify-center px-0' : 'gap-4 px-4'} py-3 rounded-xl text-[#8592a3] hover:bg-white/5 hover:text-white transition-all`}
        >
          <LogOut size={20} className="text-[#6a7a90] shrink-0" />
          {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap">Log Out</span>}
        </button>
      </div>
    </div>
  );
}
