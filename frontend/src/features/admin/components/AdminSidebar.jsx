import aspireLogo from '../../../assets/aspire-logo.png';
import { LayoutDashboard, Users, KeyRound, LogOut, GraduationCap, UserCheck, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../features/auth/hooks/useAuth';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'instructors', label: 'Instructors', icon: Users },
  { id: 'advising', label: 'Advising Map', icon: UserCheck },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'tokens', label: 'Invite Tokens', icon: KeyRound },
];

export default function AdminSidebar({ tab, setTab }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  return (
    <aside className="w-[240px] h-full bg-[#430202] border-r border-white/10 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 pt-2 pb-0 flex justify-center">
        <div className="flex flex-col items-center">
          <img src={aspireLogo} alt="ASPIRE" className="h-[140px] w-auto drop-shadow-lg" />
          <div className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase -mt-4 mb-4">Admin Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent transition-all text-[14px] font-medium
              ${tab === id
                ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={18} className={tab === id ? 'text-white' : 'text-white/60'} />
            {label}
          </button>
        ))}
      </nav>
      
      {/* Logout */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all text-[14px] font-medium"
        >
          <LogOut size={18} className="text-white/60" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
