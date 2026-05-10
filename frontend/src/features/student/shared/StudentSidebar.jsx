import React from 'react';
import {
  LayoutDashboard, TrendingUp, Github, Bot, LogOut, HelpCircle, BookOpen
} from 'lucide-react';
import aspireLogo from '../../../assets/aspire-logo.png';
import aiChatLogo from '../../../assets/AI-chat.png';

const AiChatLogoIcon = ({ size, className }) => {
  const isActive = className?.includes('#ffe3e3');
  return (
    <img
      src={aiChatLogo}
      alt="AI Chat"
      width={size}
      height={size}
      className={`object-contain transition-all scale-[3] ${isActive ? 'opacity-100' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
    />
  );
};

export default function StudentSidebar({ activeView, setActiveView, onLogout, user }) {
  const fullName = user?.full_name || 'Student';
  const email = user?.email || '';
  const initial = fullName.charAt(0).toUpperCase();

  const nav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'enrolled-classes', icon: BookOpen, label: 'My Classes' },
    { id: 'my-performance', icon: TrendingUp, label: 'My Performance' },
    { id: 'github-analytics', icon: Github, label: 'GitHub Analytics' },
    { id: 'career-coach', icon: Bot, label: 'Career Coach' },
    { id: 'ai-chat', icon: AiChatLogoIcon, label: 'AI Chat' },
  ];

  return (
    <div className="w-[240px] h-full bg-[#430202] border-r border-white/10 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 pt-2 pb-0 flex justify-center">
        <img src={aspireLogo} alt="ASPIRE" className="h-[140px] w-auto drop-shadow-lg" />
      </div>

      {/* Nav */}
      <div className="px-3 flex-1 space-y-1">
        {nav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent transition-all text-[14px] font-medium
              ${activeView === id
                ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={18} className={activeView === id ? 'text-white' : 'text-white/60'} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile */}
      <div className="mx-3 mb-3 p-3 rounded-2xl border border-white/10 bg-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-3">
        {user?.avatar_url
          ? <img src={user.avatar_url} alt={fullName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10 shadow-sm" referrerPolicy="no-referrer" />
          : <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shrink-0 border border-white/10 shadow-sm">{initial}</div>
        }
        <div className="overflow-hidden">
          <p className="text-white text-[14px] font-semibold truncate leading-tight mb-0.5">{fullName}</p>
          <p className="text-white/60 text-[12px] truncate leading-tight">{email}</p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-white/10 p-4 flex flex-col gap-1">
        <button
          onClick={() => setActiveView('faq')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-[14px] font-medium
            ${activeView === 'faq'
              ? 'bg-white/20 text-white border-white/20 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.15)]'
              : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
        >
          <HelpCircle size={18} className={activeView === 'faq' ? 'text-white' : 'text-white/60'} />
          FAQ
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all text-[14px] font-medium"
        >
          <LogOut size={18} className="text-white/60" />
          Log Out
        </button>
      </div>
    </div>
  );
}
