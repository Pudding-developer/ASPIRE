import { useState } from 'react';
import { LayoutDashboard, BookOpen, Archive, LogOut, ChevronUp, ChevronDown, PanelLeftClose, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aspireLogo from '../../../assets/aspire-logo.png';
import useAuth from '../../auth/hooks/useAuth';

export default function Sidebar({ activeView, setActiveView, onLogout, classes = [] }) {
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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${isMinimized ? 'w-[88px]' : 'w-[280px]'} h-screen bg-[#430202] border-r border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 relative z-20`}
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




      {/* Middle section: Navigation */}
      <div className="px-3 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
        {/* Instructor Portal */}
        <button
          onClick={() => setActiveView('instructor-portal')}
          className={`w-full flex items-center border border-transparent ${isMinimized ? 'justify-center px-0' : 'gap-4 px-4'} py-3 rounded-xl transition-all ${activeView === 'instructor-portal'
            ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
            : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
        >
          <LayoutDashboard size={20} className={`shrink-0 ${activeView === 'instructor-portal' ? 'text-white' : 'text-white/60'}`} />
          {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap min-w-[150px] text-left">Dashboard</span>}
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
            className={`w-full flex items-center border border-transparent ${isMinimized ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-xl transition-all ${activeView === 'my-classes' || activeView.startsWith('class-')
              ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
              : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-4'} shrink-0`}>
              <BookOpen size={20} className={activeView === 'my-classes' || activeView.startsWith('class-') ? 'text-white' : 'text-white/60'} />
              {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap text-left">Classes</span>}
            </div>
            {!isMinimized && (
              <div className="flex items-center gap-3 shrink-0">
                {classes.length > 0 && (
                  <span className="flex items-center justify-center bg-white/20 text-white text-[11px] w-5 h-5 rounded-full font-bold">{classes.length}</span>
                )}
                {classesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            )}
          </button>

          {/* Sub-items block (collapsible class list) */}
          <div className={`overflow-y-auto overflow-x-hidden transition-all duration-300 ${classesOpen && !isMinimized ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="relative py-1">
              <div className="absolute left-[16px] top-0 bottom-3 w-px bg-white/10" />

              <div className="flex flex-col gap-1.5 relative z-10 w-full">
                {classes.map((cls) => {
                  const viewId = `class-${cls.id}`;
                  const isActive = activeView === viewId;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setActiveView(viewId)}
                      className={`w-[calc(100%-24px)] ml-[24px] flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all text-left ${isActive
                        ? 'text-white bg-white/20 border border-white/20 backdrop-blur-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-[#4a5568]'}`} />
                      <span className="font-medium truncate">{cls.course_code} - {cls.section}</span>
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
          className={`w-full flex items-center border border-transparent ${isMinimized ? 'justify-center px-0' : 'gap-4 px-4'} py-3 rounded-xl transition-all ${activeView === 'archived'
            ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
            : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
        >
          <Archive size={20} className={`shrink-0 ${activeView === 'archived' ? 'text-white' : 'text-white/60'}`} />
          {!isMinimized && <span className="font-medium text-[15px] whitespace-nowrap min-w-[150px] text-left">Archived Classes</span>}
        </button>
      </div>

      {/* Profile Box — above the divider line */}
      <div className={`mx-3 mb-3 shrink-0 p-3 rounded-2xl border border-white/10 bg-white/5 flex items-center ${isMinimized ? 'justify-center' : 'gap-3'} transition-all`}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={fullName} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-white/20 flex items-center justify-center text-white font-medium text-sm border border-white/10">
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

      {/* Bottom section: Logout */}
      <div className="border-t border-white/10 p-4 shrink-0 overflow-x-hidden">
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
