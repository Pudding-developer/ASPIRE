import React from 'react';
import {
  TrendingUp, Github, Bell, Filter, TrendingDown, Minus, ArrowUpRight,
  ChevronRight, BookOpen, Star,
} from 'lucide-react';
import projectBg from '../../../assets/project_card_bg.png';

/* ─── Stat Card ─── */
export function StatCard({ label, value, sub, trend, badge }) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[2rem] font-extrabold text-gray-900 leading-none">{value}</p>
          {sub && <p className="text-[12px] text-gray-500 mt-1">{sub}</p>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} text-[12px] font-semibold`}>
            <TrendIcon size={14} />
          </div>
        )}
        {badge && (
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
            {badge} <ArrowUpRight size={10} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── ILO Donut ─── */
export function ILOCoverage() {
  const segments = [
    { label: 'Technical Depth',     pct: 45, color: '#bc1313' },
    { label: 'Analytical Rigor',    pct: 33, color: '#e97b7b' },
    { label: 'Professional Ethics', pct: 22, color: '#fcd5d5' },
  ];
  const size = 120, stroke = 16, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Integrated ILO Coverage</p>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Learning Outcome Status</h3>
      <div className="flex items-center gap-8">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {segments.map((s, i) => {
              const dash = (s.pct / 100) * circ;
              const gap  = circ - dash;
              const el = (
                <circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-extrabold text-gray-900">78%</span>
            <span className="text-[9px] text-gray-400 font-semibold">MASTERY</span>
          </div>
        </div>
        {/* Legend */}
        <div className="space-y-3 flex-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[13px] text-gray-600">{s.label}</span>
              </div>
              <span className="text-[13px] font-bold text-gray-800">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Activity ─── */
export function RecentActivity() {
  const items = [
    { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', title: 'Advanced Algorithms Grade Released', sub: 'A+ Achieved · 2 hours ago' },
    { icon: Github,   color: 'bg-gray-100 text-gray-600',       title: 'GitHub Push: Scholastic UI Repository', sub: '12 Commits · Yesterday' },
    { icon: Star,     color: 'bg-yellow-100 text-yellow-600',   title: 'Research Paper Feedback Provided', sub: 'Prof. Ana · 3 days ago' },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Recent Activity</p>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Real-time Feed</h3>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${it.color}`}>
              <it.icon size={14} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800 leading-snug">{it.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{it.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-5 w-full border border-gray-200 rounded-xl py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
        View all activities
      </button>
    </div>
  );
}

/* ─── Developing Skills ─── */
export function DevelopingSkills() {
  const skills = [
    { name: 'Microprocessors',        current: 72, target: 90, status: 'EXCEEDING EXPECTATIONS', statusColor: 'text-emerald-500' },
    { name: 'Embedded Systems',        current: 58, target: 80, status: 'ON TRACK',               statusColor: 'text-blue-500'    },
    { name: 'Digital Signal Processing', current: 44, target: 90, status: 'NEEDS ATTENTION',      statusColor: 'text-red-500'     },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 mb-1">Developing Skills</h3>
      <p className="text-[12px] text-gray-400 mb-5">Ongoing competencies and performance analysis</p>
      <div className="space-y-5">
        {skills.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-gray-800">{s.name}</span>
              <span className={`text-[10px] font-bold uppercase ${s.statusColor}`}>{s.status}</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all"
                style={{
                  width: `${s.current}%`,
                  background: s.statusColor.includes('emerald') ? '#10b981' : s.statusColor.includes('blue') ? '#3b82f6' : '#ef4444'
                }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-gray-400/60"
                style={{ left: `${s.target}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Current Proficiency: {s.current}%</span>
              <span>Target: {s.target}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 bg-gray-50 rounded-xl p-3 flex items-start gap-2">
        <TrendingUp size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-[12px] text-gray-500">Trajectory shows strong growth in Microprocessors. Suggested peer review for DSP to accelerate understanding.</p>
      </div>
    </div>
  );
}

/* ─── Excelled Skills ─── */
export function ExcelledSkills() {
  const skills = ['System Architecture', 'Cloud Infrastructure', 'UX Design Systems', 'Academic Writing', 'Python Expert'];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Excelled Skills</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {skills.map((s) => (
          <span key={s} className="px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-full">{s}</span>
        ))}
      </div>
      <button className="w-full border border-gray-200 rounded-xl py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
        View all achieved skills
      </button>
    </div>
  );
}

/* ─── Projects ─── */
export function TopProjects() {
  const projects = [
    { type: 'CAPSTONE · 2024', title: 'Neural-Net Security Protocol',     desc: 'Autonomous threat detection using recurrent neural networks for campus-wide networks.' },
    { type: 'RESEARCH · 2023', title: 'Stochastic Modeling in Fintech',   desc: 'Developing predictive models for micro-lending risks in emerging academic markets.'      },
    { type: 'AI/ML · 300+',   title: 'Semantic Curator Engine',           desc: 'An AI-driven bibliographic tool that cross-references interdisciplinary academic sources.' },
  ];
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
      <h2 className="text-[22px] font-extrabold text-gray-900 mb-5">Top Academic Projects</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div key={p.title} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative h-36 overflow-hidden">
              <img src={projectBg} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white/80 uppercase tracking-widest">{p.type}</span>
            </div>
            <div className="p-4">
              <h4 className="text-[14px] font-bold text-gray-900 mb-1 leading-snug">{p.title}</h4>
              <p className="text-[12px] text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CTA Banner ─── */
export function CTABanner() {
  return (
    <div className="bg-gray-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-[18px] font-bold text-white mb-1">Ready for your next career milestone?</h3>
        <p className="text-[13px] text-gray-400">Our AI engine has prepared updated career paths based on your latest grades and GitHub activity.</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="px-5 py-2.5 bg-[#bc1313] hover:bg-[#890E0E] text-white text-[13px] font-bold rounded-xl transition-colors flex items-center gap-2">
          VIEW ROADMAP <ChevronRight size={14} />
        </button>
        <button className="px-5 py-2.5 border border-white/20 text-white text-[13px] font-bold rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2">
          <Github size={14} /> CONNECT GITHUB
        </button>
      </div>
    </div>
  );
}

/* ─── Dashboard Main View ─── */
export default function StudentDashboardView({ user }) {
  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Student Overview</p>
          <h1 className="text-[2.2rem] font-extrabold text-gray-900 leading-tight">Welcome back, {firstName}.</h1>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={14} /> Filter
          </button>
          <button className="relative w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Bell size={16} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#bc1313] rounded-full" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Performance" value="89.6%"   trend="up"   />
        <StatCard label="Skill Achievement"   value="89.6%"   sub="Accelerated in Data Structures" />
        <StatCard label="Skill Growth"        value="91.3%"   trend="up"   />
        <StatCard label="Career Target"       value="ON TRACK" badge="On Track" />
      </div>

      {/* ILO + Activity row */}
      <div className="grid md:grid-cols-2 gap-6">
        <ILOCoverage />
        <RecentActivity />
      </div>

      {/* Skills row */}
      <div className="grid md:grid-cols-2 gap-6">
        <DevelopingSkills />
        <ExcelledSkills />
      </div>

      {/* Projects */}
      <TopProjects />

      {/* CTA */}
      <CTABanner />
    </div>
  );
}
