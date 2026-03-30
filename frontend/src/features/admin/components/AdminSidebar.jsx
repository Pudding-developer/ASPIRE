import aspireLogo from '../../../assets/aspire-logo.png';
import { LogOut } from 'lucide-react';
import useAuth from '../../../features/auth/hooks/useAuth';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'instructors', label: 'Instructors', icon: '👨‍🏫' },
  { id: 'tokens', label: 'Invite Tokens', icon: '🔑' },
];

export default function AdminSidebar({ tab, setTab }) {
  const { logout } = useAuth();
  
  return (
    <aside className="w-56 bg-[#120600] border-r border-white/5 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-white/5">
        <img src={aspireLogo} alt="ASPIRE" className="h-16 w-auto mx-auto" />
        <div className="text-center text-xs text-gray-500 mt-1">Admin Dashboard</div>
      </div>
      <nav className="flex-1 py-4">
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
              tab === n.id
                ? 'bg-[#cc0000]/20 text-[#ff4444] border-r-2 border-[#cc0000]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>
      
      <div className="mt-auto p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/10 rounded transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
