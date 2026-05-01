import aspireLogo from '../../../assets/aspire-logo.png';
import { LayoutDashboard, Users, KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../features/auth/hooks/useAuth';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'instructors', label: 'Instructors', icon: Users },
  { id: 'tokens', label: 'Invite Tokens', icon: KeyRound },
];

export default function AdminSidebar({ tab, setTab }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  return (
    <aside className="w-56 bg-[linear-gradient(180deg,rgba(188,19,19,0.08)_0%,rgba(18,6,0,0.95)_28%,rgba(18,6,0,0.98)_100%)] border-r border-white/10 flex flex-col h-full shrink-0 backdrop-blur-lg">
      <div className="p-4 border-b border-white/10">
        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
          <img src={aspireLogo} alt="ASPIRE" className="h-16 w-auto mx-auto" />
          <div className="text-center text-xs text-gray-400 mt-1">Admin Dashboard</div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-1.5 space-y-1">
        <p className="px-3 pb-2 text-[10px] tracking-[0.16em] uppercase text-gray-500">Navigation</p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`group relative w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all text-left rounded-xl border border-transparent ${
              tab === id
                ? 'bg-[#70170f]/20 text-white border-[#70170f]/40 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.35)]'
                : 'text-gray-400 hover:text-white hover:bg-black/20 hover:border-white/10'
            }`}
          >
            {tab === id && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#70170f]" />}
            <Icon size={16} className={tab === id ? 'text-[#ffdada]' : 'text-gray-500 group-hover:text-gray-300'} />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-auto p-4 border-t border-white/10">
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-[#ff6666] border border-[#ff4444]/25 bg-black/10 hover:bg-[#ff4444]/12 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
