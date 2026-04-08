import React, { useState } from 'react';
import {
  Github, Star, GitFork, RefreshCw, Download, GitCompare,
  AlertCircle, ChevronRight, Circle, Zap, Clock
} from 'lucide-react';

/* ─── Skill Pill ─── */
function SkillPill({ name, pct, dotColor }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[12px] font-medium text-gray-700 shadow-sm">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      {name}
      <span className="font-bold text-[#bc1313]">{pct}%</span>
    </span>
  );
}

/* ─── Contribution Heatmap ─── */
function ContributionHeatmap() {
  // Generate 12 weeks × 7 days of mock data
  const weeks = Array.from({ length: 15 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const rand = Math.random();
      if (rand < 0.35) return 0;
      if (rand < 0.55) return 1;
      if (rand < 0.75) return 2;
      if (rand < 0.90) return 3;
      return 4;
    })
  );

  const colors = ['#f3f4f6', '#fca5a5', '#f87171', '#dc2626', '#991b1b'];

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((val, di) => (
            <div
              key={di}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors[val] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Career Fit Donut ─── */
function CareerDonut({ pct }) {
  const size = 80, stroke = 8, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#991b1b" strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[14px] font-extrabold text-gray-900">{pct}%</span>
    </div>
  );
}

/* ─── Main GitHub Analytics View ─── */
export default function StudentGitHubView({ user }) {
  const [skillTab, setSkillTab] = useState('All');
  const fullName = user?.full_name || 'Aldouz Joaquin Perona';

  const skillCategories = [
    {
      label: 'FRONTEND',
      skills: [
        { name: 'React', pct: 92, dotColor: '#60a5fa' },
        { name: 'TypeScript', pct: 88, dotColor: '#3b82f6' },
        { name: 'Tailwind CSS', pct: 95, dotColor: '#38bdf8' },
        { name: 'Next.js', pct: 64, dotColor: '#6b7280' },
      ]
    },
    {
      label: 'BACKEND & SYSTEMS',
      skills: [
        { name: 'Python / FastAPI', pct: 76, dotColor: '#4ade80' },
        { name: 'C / Embedded', pct: 61, dotColor: '#22c55e' },
        { name: 'PostgreSQL', pct: 54, dotColor: '#34d399' },
      ]
    },
    {
      label: 'DEVOPS & TOOLING',
      skills: [
        { name: 'Git / GitHub Actions', pct: 83, dotColor: '#d97706' },
        { name: 'Docker', pct: 42, dotColor: '#f59e0b' },
      ]
    },
  ];

  const repos = [
    {
      name: 'bsa-portal-v2',
      visibility: 'PUBLIC',
      tags: ['REACT', 'NODEJS'],
      desc: 'Student portal for automated enrollment and transcript presentation.',
      stars: 126, forks: 18,
      dots: ['#f87171', '#60a5fa', '#34d399'],
      badge: 'ACTIVE', badgeColor: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      name: 'defense-system',
      visibility: 'PRIVATE',
      tags: ['BLE', 'MAIN'],
      desc: 'Experimental security layer for inter-campus credential verification.',
      stars: 44, forks: 342,
      dots: ['#facc15', '#a78bfa'],
      badge: 'STABLE', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
  ];

  const trending = [
    { name: 'trpc/trpc', desc: 'TypeScript APIs made simpler', change: '+1.2k', up: true },
    { name: 'facebook/react', desc: 'A JavaScript library for UI', change: '-800', up: false },
  ];

  const activities = [
    { repo: 'bsa-portal-v2:main', msg: 'Refactored student-logic middleware for performance.', time: '1 hour ago' },
    { repo: 'defense-system/secure-auth', msg: 'Started unit test session for JS test 1 testing.', time: '5 hours ago' },
    { repo: 'Portfolio v4', msg: 'Merged pull request #42: Updated UI components.', time: '2 days ago' },
  ];

  return (
    <div className="p-8 space-y-6">

      {/* ── Breadcrumb + Header ── */}
      <div>
        <p className="text-[11px] text-gray-400 mb-4 font-medium">
          Home <span className="mx-1 text-gray-300">/</span>
          <span className="text-gray-600 font-semibold">GitHub Analytics</span>
        </p>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[2rem] font-extrabold text-gray-900 leading-tight">{fullName}</h1>
            <p className="text-[12px] text-gray-400 mt-1 flex items-center gap-1.5">
              <Circle size={6} className="fill-green-500 text-green-500" />
              Last synchronized: 4 minutes ago
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a0505] text-white rounded-xl text-[13px] font-bold hover:bg-[#2a1010] transition-colors">
              <Download size={14} /> Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors">
              <GitCompare size={14} /> Compare Stats
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'RECENT COMMITS', main: '42', sub: 'This week' },
          { label: 'TOTAL COMMITS', main: '1,482', sub: 'Top 5% of class' },
          { label: 'PRIMARY LANGUAGE', main: 'TypeScript', sub: '6th · 12 projects' },
          { label: 'MEMBER SINCE', main: '2021', sub: 'Developer Rank' },
        ].map(({ label, main, sub }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <h3 className="text-[1.7rem] font-extrabold text-gray-900 leading-none">{main}</h3>
            <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Stale Analysis Banner ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <p className="text-[12px] font-medium">Last analysis is 3 days old. Re-run to update your skill detection and career fit scores.</p>
        </div>
        <button className="text-[11px] font-bold text-[#bc1313] flex items-center gap-1 hover:underline whitespace-nowrap ml-4">
          <RefreshCw size={12} /> Re-analyze now →
        </button>
      </div>

      {/* ── Main Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Latest Repos */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-gray-900">Latest connected repositories</h3>
              <button className="text-[11px] font-bold text-[#bc1313] hover:underline flex items-center gap-1">
                View all repos <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {repos.map(repo => (
                <div key={repo.name} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <a href="#" className="text-[13px] font-bold text-[#bc1313] hover:underline">{repo.name}</a>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{repo.visibility}</span>
                        {repo.tags.map(t => (
                          <span key={t} className="text-[9px] font-bold border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full tracking-wider ${repo.badgeColor}`}>
                      {repo.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{repo.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Star size={11} /> {repo.stars}</span>
                      <span className="flex items-center gap-1"><GitFork size={11} /> {repo.forks}</span>
                    </div>
                    <div className="flex gap-1">
                      {repo.dots.map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Skills from Repos */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-gray-900 mb-5">Detected skills from repositories</h3>
            <div className="space-y-5">
              {skillCategories.map(cat => (
                <div key={cat.label}>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.skills.map(s => (
                      <SkillPill key={s.name} name={s.name} pct={s.pct} dotColor={s.dotColor} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Repos + AI Recommendations */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Trending */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-gray-900 mb-5">Trending repos</h3>
              <div className="space-y-4">
                {trending.map(repo => (
                  <div key={repo.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-gray-800 hover:text-[#bc1313] cursor-pointer">{repo.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{repo.desc}</p>
                    </div>
                    <span className={`text-[11px] font-bold ${repo.up ? 'text-green-600' : 'text-red-500'}`}>
                      {repo.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-[#1a0505] rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#bc1313] opacity-10 blur-3xl rounded-full" />
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-[#bc1313]" />
                <p className="text-[9px] font-bold text-[#bc1313] uppercase tracking-widest">AI Recommendations</p>
              </div>
              <p className="text-[11px] text-gray-400 mb-4">Based on your TypeScript usage, we suggest exploring:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:border-[#bc1313]/30 transition-colors">
                  <div className="w-1.5 h-6 bg-[#bc1313] rounded-full flex-shrink-0" />
                  <span className="text-[11px] font-bold text-white">ADVANCED ZOD VALIDATION</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:border-[#bc1313]/30 transition-colors">
                  <div className="w-1.5 h-6 bg-gray-600 rounded-full flex-shrink-0" />
                  <span className="text-[11px] font-bold text-white">NEXT.JS 14 SERVER ACTIONS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Career Fit Analytics */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Career Fit Analytics</p>

            <div className="flex items-center gap-4 mb-5">
              <CareerDonut pct={89} />
              <div>
                <h4 className="text-[14px] font-extrabold text-gray-900">Full-Stack Engineer</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Top 1 · Since: Today 3.8</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Key Competencies</p>
              <div className="flex flex-wrap gap-1.5">
                {['Architecture', 'Optimization', 'API Design'].map(k => (
                  <span key={k} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-semibold text-gray-700">{k}</span>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Key Actions</p>
              <div className="space-y-2">
                {['› Cloud Infrastructure (CRE)', '› Advanced Microservices'].map(a => (
                  <p key={a} className="text-[11px] text-gray-600 font-medium cursor-pointer hover:text-[#bc1313] transition-colors">{a}</p>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#bc1313] hover:bg-[#991b1b] text-white text-[12px] font-bold rounded-xl transition-colors">
              Generate career roadmap
            </button>
          </div>

          {/* Live Activity Stream */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-gray-900 mb-5">Live activity stream</h3>
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Github size={13} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#bc1313] hover:underline cursor-pointer leading-snug">{a.repo}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{a.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={9} /> {a.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
