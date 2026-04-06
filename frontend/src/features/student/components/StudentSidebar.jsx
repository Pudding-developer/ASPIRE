import React from 'react';
import {
  LayoutDashboard, TrendingUp, Github, Bot, LogOut, HelpCircle
} from 'lucide-react';
import aspireLogo from '../../../assets/aspire-logo.png';

export default function StudentSidebar({ activeView, setActiveView, onLogout, user }) {
  const fullName = user?.full_name || 'Student';
  const email    = user?.email    || '';
  const initial  = fullName.charAt(0).toUpperCase();

  const nav = [
    { id: 'dashboard',        icon: LayoutDashboard, label: 'Dashboard'       },
    { id: 'my-performance',   icon: TrendingUp,      label: 'My Performance'  },
    { id: 'github-analytics', icon: Github,          label: 'GitHub Analytics'},
    { id: 'career-coach',     icon: Bot,             label: 'Career Coach'    },
  ];

  return (
    <div className="w-[240px] h-full bg-[#0d0101] border-r border-[#261010] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 pt-4 pb-2">
        <img src={aspireLogo} alt="ASPIRE" className="h-[100px] w-auto drop-shadow-lg -ml-2" />
      </div>

      {/* Nav */}
      <div className="px-3 flex-1 space-y-1">
        {nav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[14px] font-medium
              ${activeView === id
                ? 'bg-[#bc1313] text-white'
                : 'text-[#8592a3] hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={18} className={activeView === id ? 'text-white' : 'text-[#6a7a90]'} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile */}
      <div className="mx-3 mb-3 p-3 rounded-2xl border border-[#3b1919] bg-[#1a0707] shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-3">
        {user?.avatar_url
          ? <img src={user.avatar_url} alt={fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#3b1919] shadow-sm" referrerPolicy="no-referrer" />
          : <div className="w-10 h-10 rounded-full bg-[#bc1313] flex items-center justify-center text-white font-bold flex-shrink-0 border border-[#3b1919] shadow-sm">{initial}</div>
        }
        <div className="overflow-hidden">
          <p className="text-white text-[14px] font-semibold truncate leading-tight mb-0.5" style={{ color: '#ffffff' }}>{fullName}</p>
          <p className="text-[#a0aabf] text-[12px] truncate leading-tight" style={{ color: '#a0aabf' }}>{email}</p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[#261010] p-4 flex flex-col gap-1">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#8592a3] hover:bg-white/5 hover:text-white transition-all text-[14px] font-medium">
          <HelpCircle size={18} className="text-[#6a7a90]" />
          FAQ
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#8592a3] hover:bg-[#bc1313]/10 hover:text-[#bc1313] transition-all text-[14px] font-medium"
        >
          <LogOut size={18} className="text-[#6a7a90]" />
          Log Out
        </button>
      </div>
    </div>
  );
}
