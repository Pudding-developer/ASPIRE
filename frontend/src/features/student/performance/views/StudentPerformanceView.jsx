import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen, ArrowLeft, Target,
  TrendingUp, Github, Star, ShieldAlert, Award, Rocket, Compass, Zap
} from 'lucide-react';

import useStudentData from '../../dashboard/hooks/useStudentData';
import useActivityFeed from '../../dashboard/hooks/useActivityFeed';
import { StudentPerformanceSkeleton } from '../../shared/StudentPageSkeletons';
import StudentCourseDetailView from './StudentCourseDetailView';
import { studentService } from '../../../../services/studentService';

const NOTIF_VISUALS = {
  grade_released: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
  career_updated: { icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  github_synced:  { icon: Github,    color: 'bg-blue-100 text-blue-600' },
  skill_milestone:{ icon: Star,      color: 'bg-yellow-100 text-yellow-600' },
};

function formatNotifTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  if (isNaN(then.getTime())) return '';
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

const panelBase = 'bg-white border border-[#eed7d3] rounded-2xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.1)]';

/* ─── Constants ─── */
const SEMESTERS = [
  'All Semesters',
  '1st Year, 1st Sem', '1st Year, 2nd Sem',
  '2nd Year, 1st Sem', '2nd Year, 2nd Sem',
  '3rd Year, 1st Sem', '3rd Year, 2nd Sem',
  '4th Year, 1st Sem', '4th Year, 2nd Sem',
];
const CATEGORIES = ['All Subjects', 'Mathematics', 'Engineering Core', 'General Education', 'Computer Science', 'Technical Electives'];

/* ─── Filter Dropdown ─── */
function FilterDropdown({ open, onClose, semester, setSemester, category, setCategory }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-linear-to-br from-white via-[#fff9f9] to-[#fcf4f2] border border-[#efd4d4] rounded-2xl shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)] z-50 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Filters</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={14} /></button>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Semester</label>
        <div className="space-y-1">
          {SEMESTERS.map(s => (
            <button
              key={s}
              onClick={() => setSemester(s)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${semester === s ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-[#fff5f5]'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Course Category</label>
        <div className="space-y-1">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${category === c ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-[#fff5f5]'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => { setSemester('All Semesters'); setCategory('All Subjects'); }}
        className="w-full text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest py-2 hover:text-gray-600 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}

/* ─── Notification Dropdown ─── */
function NotificationDropdown({ open, onClose, notifications, unreadCount }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-linear-to-br from-white via-[#fff9f9] to-[#fcf4f2] border border-[#efd4d4] rounded-2xl shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)] z-50 overflow-hidden">
      <div className="p-4 border-b border-[#f2dfdf] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[12px] font-bold text-gray-900">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[9px] font-bold bg-[#70170f] text-white px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={14} /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No new notifications.</div>
        ) : (
          notifications.map(n => {
            const visual = NOTIF_VISUALS[n.type] ?? { icon: Bell, color: 'bg-gray-100 text-gray-500' };
            const Icon = visual.icon;
            const accent = n.unread ? 'bg-[#70170f]/10 text-[#70170f]' : visual.color;
            return (
              <div key={n.id} className={`p-4 border-b border-[#f8ebeb] hover:bg-[#fff5f5]/70 transition-colors cursor-pointer ${n.unread ? 'bg-red-50/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${accent}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 leading-snug">{n.title}</p>
                    {n.subtitle && <p className="text-[11px] text-gray-600 mt-0.5">{n.subtitle}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{formatNotifTime(n.created_at)}</p>
                  </div>
                  {n.unread && <span className="w-2 h-2 bg-[#70170f] rounded-full shrink-0 mt-2" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Base Stat Card ─── */
function StatCard({ label, main, sub, badge, badgeTone = 'green', progress, icon: Icon }) {
  const toneClass = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-600',
  }[badgeTone] || 'bg-green-50 text-green-600';

  return (
    <div className={`${panelBase} p-6 flex flex-col justify-between min-h-[148px]`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#fff2f2] text-[#70170f] flex items-center justify-center">
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <h3 className="text-3xl font-extrabold text-gray-900 leading-none">{main}</h3>
        {badge && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${toneClass}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 font-medium mt-2 truncate" title={typeof sub === 'string' ? sub : undefined}>{sub}</p>
      {progress && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full" style={{ width: progress }} />
        </div>
      )}
    </div>
  );
}

/* ─── Radar Chart Component ─── */
/* ─── Radar Chart Component (SO1-13) ─── */
function CompetencyRadar({ soValues }) {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  const SO_INFO = [
    { id: 'SO1', name: 'Discipline Knowledge' },
    { id: 'SO2', name: 'Investigation' },
    { id: 'SO3', name: 'Design/Dev. of Solutions' },
    { id: 'SO4', name: 'Leadership' },
    { id: 'SO5', name: 'Problem Analysis' },
    { id: 'SO6', name: 'Ethics' },
    { id: 'SO7', name: 'Communication' },
    { id: 'SO8', name: 'Environment' },
    { id: 'SO9', name: 'Lifelong Learning' },
    { id: 'SO10', name: 'Engineering & Society' },
    { id: 'SO11', name: 'Modern Tools' },
    { id: 'SO12', name: 'Project Management' },
    { id: 'SO13', name: 'Social Responsibility' },
  ];

  const size = 420;
  const center = size / 2;
  const radius = size / 2 - 50;

  const angles = SO_INFO.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / SO_INFO.length);

  const getPoint = (val, angle) => ({
    x: center + radius * val * Math.cos(angle),
    y: center + radius * val * Math.sin(angle),
  });

  const makePath = (val) =>
    angles.map((a, i) => {
      const p = getPoint(val, a);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(' ') + ' Z';

  const levels = [0.25, 0.5, 0.75, 1];

  const dataPts = soValues.map((v, i) => getPoint(v, angles[i]));
  const dataPolygon = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';

  return (
    <div className={`${panelBase} p-8 h-full relative overflow-hidden`}>
      <div className="mb-8">
        <p className="text-[10px] font-extrabold text-[#70170f] uppercase tracking-[0.2em] mb-2">STUDENT OUTCOME PROFICIENCY</p>
        <h3 className="text-[24px] font-black text-gray-900 leading-tight"> Core Competencies</h3>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
        {/* Left: Radar Chart */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {/* Web Levels */}
            {levels.map((level, i) => (
              <path
                key={`web-${i}`}
                d={makePath(level)}
                fill={level === 1 ? 'rgba(112,23,15,0.02)' : 'none'}
                stroke="#f2dfdf"
                strokeWidth={level === 1 ? 1.5 : 1}
                strokeDasharray={level < 1 ? "4 4" : "0"}
              />
            ))}

            {/* Axes */}
            {angles.map((angle, i) => {
              const p = getPoint(1, angle);
              return (
                <line
                  key={`axis-${i}`}
                  x1={center} y1={center}
                  x2={p.x} y2={p.y}
                  stroke="#f2dfdf"
                  strokeWidth="1"
                />
              );
            })}

            {/* Data Polygon */}
            <path
              d={dataPolygon}
              fill="rgba(159,7,7,0.15)"
              stroke="#9f0707"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Data Points with Tooltips */}
            {dataPts.map((p, i) => (
              <g key={`pt-group-${i}`}>
                {/* Larger invisible hit area */}
                <circle
                  cx={p.x} cy={p.y} r="10"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <circle
                  cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3.5}
                  fill="#9f0707"
                  stroke="white"
                  strokeWidth="2"
                  className="pointer-events-none transition-all duration-200"
                />
                {hoveredIdx === i && (
                  <g className="pointer-events-none">
                    <rect
                      x={p.x + 8} y={p.y - 14}
                      width="38" height="20"
                      rx="6" fill="rgba(26,5,5,0.95)"
                      className="shadow-xl"
                    />
                    <text
                      x={p.x + 27} y={p.y}
                      textAnchor="middle"
                      fill="white"
                      className="text-[10px] font-black tabular-nums"
                    >
                      {Math.round(soValues[i] * 100)}%
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* Labels */}
            {angles.map((angle, i) => {
              const dist = radius * 1.08;
              const x = center + dist * Math.cos(angle);
              const y = center + dist * Math.sin(angle);
              const cosA = Math.cos(angle);
              const anchor = cosA < -0.25 ? 'end' : cosA > 0.25 ? 'start' : 'middle';

              const shortLabels = [
                'Discipline Knowledge', 'Investigation', 'Design', 'Leadership', 'Analysis',
                'Ethics', 'Communication', 'Environment', 'Lifelong', 'Engineering & Society',
                'Modern Tools', 'Project Management', 'Social Responsibility'
              ];

              const words = shortLabels[i].split(' ');
              const lines = (words.length > 1 && shortLabels[i].length > 10)
                ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
                : [shortLabels[i]];

              return (
                <text
                  key={`lbl-${i}`}
                  x={x}
                  y={y + (Math.sin(angle) > 0.5 ? 10 : -2) - (lines.length > 1 ? 5 : 0)}
                  textAnchor={anchor}
                  fill="#6b7280"
                  className="text-[9px] font-bold tracking-tight uppercase"
                >
                  {lines.map((line, idx) => (
                    <tspan key={idx} x={x} dy={idx === 0 ? 0 : '1.1em'}>{line}</tspan>
                  ))}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-8 ml-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#9f0707] rounded-sm" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Student proficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-3 bg-gray-300" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required level (80%)</span>
            </div>
          </div>
        </div>

        {/* Right: SO List */}
        <div className="flex-1 w-full max-w-md">
          {/* Legend for colors */}
          <div className="flex items-center justify-between mb-4 px-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{"Competent (≥75%)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{"Developing (60-74%)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{"At Risk (<60%)"}</span>
            </div>
          </div>

          <div className="space-y-1">
            {SO_INFO.map((so, i) => {
              const val = Math.round(soValues[i] * 100);
              const colorClass = val >= 75 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-red-500';
              const textClass = val >= 75 ? 'text-emerald-600' : val >= 60 ? 'text-amber-600' : 'text-red-600';

              return (
                <div key={so.id} className="flex items-center gap-4 py-1.5 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-2 transition-colors">
                  <div className="w-10 text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded text-center shrink-0">
                    {so.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-700 truncate">{so.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                      {/* 80% mark */}
                      <div className="absolute left-[80%] top-0 bottom-0 w-px bg-gray-300 z-10" />
                      <div className={`h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${val}%` }} />
                    </div>
                    <span className={`w-8 text-right text-[11px] font-black tabular-nums ${textClass}`}>
                      {val}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Integrated AI Insights Panel ─── */
function IntegratedInsights({
  topSkill, topVal, topCeiling, topSO, topDriver,
  weakSkill, weakVal, weakCeiling, weakSO, weakDriver,
}) {
  const brandRed = '#70170f';
  const topPotentialPct = Math.max(0, Math.round((topCeiling || 0) - (topVal || 0)));
  const weakPotentialPct = Math.max(0, Math.round((weakCeiling || 0) - (weakVal || 0)));

  return (
    <div
      className={`${panelBase} p-8 flex flex-col border-none text-white shadow-[0_20px_50px_-12px_rgba(112,23,15,0.4)] relative overflow-hidden group`}
      style={{ backgroundColor: brandRed }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-[0.05] blur-3xl rounded-full -mr-24 -mt-24" />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <Lightbulb className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-[20px] font-black text-white leading-tight">Smart Insights</h3>
          <p className="text-[10px] text-white/50 tracking-widest uppercase mt-0.5">From your latest ILO scores</p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        {/* Core Strength */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div className="min-w-0 mr-3">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">CORE STRENGTH</span>
              <h4 className="text-[14px] font-bold text-white leading-tight truncate" title={topSkill || ''}>
                {topSkill || 'Awaiting graded scores'}
              </h4>
              {topSO && (
                <p className="text-[10px] text-emerald-200/90 mt-1.5 font-semibold">
                  Aligned to {topSO.so_id} · {topSO.so_name}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[18px] font-black text-white leading-none tabular-nums">{Math.round(topVal || 0)}%</span>
              {topCeiling > 0 && (
                <p className="text-[9px] font-bold text-emerald-300 mt-1">
                  ↑ ML ceiling {Math.round(topCeiling)}% (+{topPotentialPct})
                </p>
              )}
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(topVal || 0, 100)}%` }} />
          </div>
          <p className="text-[11px] text-white/75 mt-3 leading-relaxed">
            {topDriver?.course
              ? <>You're strongest here through <span className="font-bold text-white">{topDriver.course}</span>. Keep ILO performance high there to retain mastery.</>
              : 'Consistent ILO performance is sustaining this skill — keep it up.'}
          </p>
        </div>

        {/* Growth Opportunity */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div className="min-w-0 mr-3">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">GROWTH OPPORTUNITY</span>
              <h4 className="text-[14px] font-bold text-white leading-tight truncate" title={weakSkill || ''}>
                {weakSkill || 'Awaiting graded scores'}
              </h4>
              {weakSO && (
                <p className="text-[10px] text-amber-200/90 mt-1.5 font-semibold">
                  Lifts {weakSO.so_id} · {weakSO.so_name}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[18px] font-black text-white leading-none tabular-nums">{Math.round(weakVal || 0)}%</span>
              {weakCeiling > 0 && (
                <p className="text-[9px] font-bold text-amber-300 mt-1">
                  Reachable {Math.round(weakCeiling)}% (+{weakPotentialPct})
                </p>
              )}
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(weakVal || 0, 100)}%` }} />
          </div>
          <p className="text-[11px] text-white/75 mt-3 leading-relaxed">
            {weakDriver?.course
              ? <>Lifting your ILOs in <span className="font-bold text-white">{weakDriver.course}</span> gives the biggest predicted gain (+{weakPotentialPct}%) for this skill.</>
              : 'No course-level signal yet — focus on ILOs once grades land.'}
          </p>
        </div>
      </div>
    </div>
  );
}



/* ─── Proficiency Growth helpers ─── */
function tierForIndex(idx, third) {
  if (idx < third) return { name: 'text-green-800 font-medium', bar: 'bg-green-600', val: 'text-green-700' };
  if (idx < third * 2) return { name: 'text-amber-800', bar: 'bg-amber-500', val: 'text-amber-700' };
  return { name: 'text-red-800', bar: 'bg-red-600', val: 'text-red-700' };
}

function GrowthLegend() {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
        <span className="w-2 h-2 rounded-full bg-green-600" /> Top third
      </span>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
        <span className="w-2 h-2 rounded-full bg-amber-500" /> Middle third
      </span>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
        <span className="w-2 h-2 rounded-full bg-red-600" /> Bottom third
      </span>
    </div>
  );
}

function RankedSkillsChart({ sortedSkills, third, animated }) {
  const maxScore = sortedSkills[0]?.[1] || 1;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl h-full flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h4 className="text-[12px] font-bold text-gray-900">All skills — sorted highest to lowest</h4>
          <span className="text-[10px] text-gray-400 font-medium">Bars scaled relative to top score</span>
        </div>
        <GrowthLegend />
      </div>
      <div className="flex-1 p-5 space-y-3.5">
        {sortedSkills.length === 0 ? (
          <p className="text-[12px] text-gray-400 font-medium">No skill data available.</p>
        ) : sortedSkills.map(([name, val], i) => {
          const cls = tierForIndex(i, third);
          const target = maxScore > 0 ? (val / maxScore) * 100 : 0;
          return (
            <div key={name}>
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className={`text-[12px] truncate ${cls.name}`} title={name}>{name}</span>
                <span className={`text-[11px] font-bold tabular-nums ${cls.val}`}>{val.toFixed(1)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cls.bar} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: animated ? `${target}%` : '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IloBreakdownCard({ iloScores }) {
  const keys = Object.keys(iloScores).sort();
  const colorFor = (pct) => {
    if (pct >= 85) return 'bg-green-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h4 className="text-[12px] font-bold text-gray-900">ILO Score Breakdown</h4>
      <p className="text-[10px] text-gray-400 font-medium mb-4">actual %</p>
      {keys.length === 0 ? (
        <p className="text-[12px] text-gray-400 font-medium">No ILO data available.</p>
      ) : (
        <div className="space-y-3.5">
          {keys.map(k => {
            const pct = iloScores[k] || 0;
            return (
              <div key={k}>
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-[12px] font-medium text-gray-800 truncate uppercase tracking-wide">{k}</span>
                  <span className="text-[11px] font-bold text-gray-900 tabular-nums">{Math.round(pct)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colorFor(pct)}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{pct.toFixed(1)} / 100 pts</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function topCoursesForSkill(skill, perCourse, mode) {
  if (!skill || !Array.isArray(perCourse) || perCourse.length === 0) return [];
  return perCourse
    .map(c => ({
      course: c.course,
      current: c.predicted_skills?.[skill] ?? 0,
      potential: c.scenario_high?.[skill] ?? 0,
    }))
    .filter(r => r.current > 0.5 || r.potential > 0.5)
    .sort((a, b) => mode === 'achieved'
      ? b.current - a.current
      : (b.potential - b.current) - (a.potential - a.current))
    .slice(0, 3);
}

function SkillHintRow({ skill, perCourse, mode, isOpen, onToggle, valueNode, barNode, divider }) {
  const recs = topCoursesForSkill(skill, perCourse, mode);
  return (
    <div className={divider ? 'border-b border-gray-100 pb-3' : ''}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-semibold text-gray-800 truncate" title={skill}>{skill}</span>
          <button
            type="button"
            onClick={onToggle}
            aria-label={`How to ${mode === 'achieved' ? 'maintain' : 'grow'} ${skill}`}
            className={`shrink-0 transition-colors ${isOpen ? 'text-[#70170f]' : 'text-gray-400 hover:text-[#70170f]'}`}
          >
            <AlertCircle size={13} />
          </button>
        </div>
        {valueNode}
      </div>
      {barNode}
      {isOpen && (
        <div className="mt-3 p-3 rounded-xl bg-[#fff8f8] border border-[#f3dada] space-y-2">
          <p className="text-[10px] font-bold text-[#7a0d0d] uppercase tracking-widest">
            {mode === 'achieved' ? 'Maintain through these courses' : 'Focus on these courses to grow'}
          </p>
          {recs.length === 0 ? (
            <p className="text-[11px] text-gray-500">No course-level signal available yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recs.map(r => (
                <div key={r.course} className="flex justify-between items-center gap-2">
                  <span className="text-[11px] text-gray-700 truncate" title={r.course}>{r.course}</span>
                  <span className="text-[10px] text-gray-500 tabular-nums shrink-0">
                    {r.current.toFixed(1)} → <span className="text-green-700 font-bold">{r.potential.toFixed(1)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-500 leading-relaxed pt-2 border-t border-[#f3dada]">
            {mode === 'achieved'
              ? "You're already strong here. Keep ILO performance high in these courses to retain mastery."
              : 'Lifting ILO performance in these courses gives the biggest predicted gain for this skill.'}
          </p>
        </div>
      )}
    </div>
  );
}


/* ─── View Main Component ─── */
export default function StudentPerformanceView({ user }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [semester, setSemester] = useState('All Semesters');
  const [category, setCategory] = useState('All Subjects');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [openHintSkill, setOpenHintSkill] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setBarsAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  const getFilterParams = () => {
    const params = {};
    if (category !== 'All Subjects') params.category = category;
    if (semester !== 'All Semesters') {
      const match = semester.match(/(\d)(?:st|nd|rd|th)\sYear,\s(\d)(?:st|nd|rd|th)\sSem/);
      if (match) {
        params.year_level = parseInt(match[1]);
        params.semester = parseInt(match[2]);
      }
    }
    return params;
  };

  const { classes, predictions, iloCoverage, loading, refetch: refetchPredictions } = useStudentData(getFilterParams());
  const { items: notifications, refetch: refetchActivity } = useActivityFeed(10);
  const unreadCount = notifications.filter(n => n.unread).length;
  const lastGradeTs = useRef(null);

  useEffect(() => {
    if (!notifOpen || unreadCount === 0) return;
    studentService.markActivityRead()
      .then(() => refetchActivity())
      .catch(() => {});
  }, [notifOpen, unreadCount, refetchActivity]);

  // Refetch ML predictions whenever the instructor releases a new grade.
  // Why: backend caches by hash(score_inputs); a new grade changes the hash,
  // so a fetch returns fresh ML output. We trigger that fetch off the
  // grade_released activity event the polling feed already surfaces.
  useEffect(() => {
    const latestGrade = notifications.find(n => n.type === 'grade_released');
    if (!latestGrade) return;
    if (lastGradeTs.current !== latestGrade.created_at) {
      if (lastGradeTs.current !== null) refetchPredictions();
      lastGradeTs.current = latestGrade.created_at;
    }
  }, [notifications, refetchPredictions]);

  if (loading) {
    return <StudentPerformanceSkeleton />;
  }

  if (selectedCourse) {
    return (
      <StudentCourseDetailView
        courseName={selectedCourse}
        user={user}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  const hasActiveFilters = semester !== 'All Semesters' || category !== 'All Subjects';

  // Group generic skills for the growth columns
  const aggSkills = predictions?.aggregated_skills || {};
  const HighPerforming = [];
  const Satisfactory = [];
  const AtRisk = [];

  Object.entries(aggSkills).forEach(([key, val]) => {
    if (val >= 90) HighPerforming.push({ name: key, val: `${Math.round(val)}%` });
    else if (val >= 70) Satisfactory.push({ name: key, val: `${Math.round(val)}%` });
    else AtRisk.push({ name: key, val: `${Math.round(val)}%` });
  });

  // Relative-thirds bucketing for Proficiency Growth Analysis
  const sortedSkills = Object.entries(aggSkills).sort((a, b) => b[1] - a[1]);
  const skillsTotal = sortedSkills.length;
  const skillsThird = Math.ceil(skillsTotal / 3) || 0;
  const topThird = sortedSkills.slice(0, skillsThird);
  const midThird = sortedSkills.slice(skillsThird, skillsThird * 2);
  const botThird = sortedSkills.slice(skillsThird * 2);

  // Overall ILO scores averaged across courses
  const overallIlo = (() => {
    const per = predictions?.per_course || [];
    if (!per.length) return {};
    const acc = {};
    const counts = {};
    per.forEach(c => {
      Object.entries(c.ilo_scores || {}).forEach(([k, v]) => {
        acc[k] = (acc[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      });
    });
    const out = {};
    Object.keys(acc).forEach(k => { out[k] = acc[k] / counts[k]; });
    return out;
  })();

  // ML insight values — Smart Insights leans on the trained pipeline output
  // for both ceilings (scenario_high) and outcome alignment (skill_so_map).
  const topSkillName = predictions?.top_skills?.[0];
  const weakSkillName = predictions?.weak_skills?.[0];
  const topSkillVal = topSkillName != null ? aggSkills[topSkillName] : null;
  const weakSkillVal = weakSkillName != null ? aggSkills[weakSkillName] : null;

  // Per-skill ML ceiling — mean scenario_high across courses that produce
  // a non-zero scenario for the skill. Replaces the old "+8" placeholder.
  const meanCeilingForSkill = (skill) => {
    if (!skill) return 0;
    const per = predictions?.per_course || [];
    const vals = per
      .map(c => c.scenario_high?.[skill])
      .filter(v => typeof v === 'number' && isFinite(v) && v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const topSkillCeiling = meanCeilingForSkill(topSkillName);
  const weakSkillCeiling = meanCeilingForSkill(weakSkillName);

  // Primary SO each highlighted skill aligns to (from backend skill_so_map).
  const skillSoMap = predictions?.skill_so_map || {};
  const topSkillSO = topSkillName ? skillSoMap[topSkillName] : null;
  const weakSkillSO = weakSkillName ? skillSoMap[weakSkillName] : null;

  // Driving course for each highlighted skill — the one to maintain (top) or
  // focus on (weak). Reuses the same helper that powers the skill-row hints.
  const topSkillDriver = topSkillName
    ? topCoursesForSkill(topSkillName, predictions?.per_course || [], 'achieved')[0] || null
    : null;
  const weakSkillDriver = weakSkillName
    ? topCoursesForSkill(weakSkillName, predictions?.per_course || [], 'developing')[0] || null
    : null;

  // Predicted skillsets — biggest growth gap (current vs scenario_high) across courses
  const predictedPotential = (() => {
    const per = predictions?.per_course || [];
    if (!per.length) return [];
    const acc = {};
    per.forEach(c => {
      const cur = c.predicted_skills || {};
      const high = c.scenario_high || {};
      const names = new Set([...Object.keys(cur), ...Object.keys(high)]);
      names.forEach(s => {
        if (!acc[s]) acc[s] = { cur: 0, high: 0, n: 0 };
        acc[s].cur += cur[s] || 0;
        acc[s].high += high[s] || 0;
        acc[s].n += 1;
      });
    });
    return Object.entries(acc)
      .map(([name, v]) => ({
        name,
        current: v.n ? v.cur / v.n : 0,
        potential: v.n ? v.high / v.n : 0,
        gap: v.n ? (v.high - v.cur) / v.n : 0,
      }))
      .filter(s => s.gap > 0.5)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
  })();

  // SO proficiency for the radar — sourced from the trained ML pipeline's
  // skill→SO projection (predictions.so_scores, 0–100). Each grade upload
  // invalidates the backend cache, so this re-fetches with fresh values.
  const soScores = predictions?.so_scores || {};
  const soValues = Array.from({ length: 13 }, (_, i) => {
    const raw = soScores[`SO${i + 1}`];
    if (typeof raw !== 'number' || !isFinite(raw)) return 0;
    return Math.min(Math.max(raw / 100, 0), 1);
  });

  // ── Four ML-driven key metrics ─────────────────────────────────────────────
  // All values are derived from the trained pipeline output returned by
  // /api/student/predictions; refetched whenever a grade_released event fires.
  const activeSkills = Object.entries(aggSkills).filter(([, v]) => v > 1.0);
  const totalActive = activeSkills.length;

  // 1. Competencies Attained — skills at or above the competency threshold (75).
  const COMPETENT_THRESHOLD = 75;
  const AT_RISK_THRESHOLD = 60;
  const attainedCount = activeSkills.filter(([, v]) => v >= COMPETENT_THRESHOLD).length;
  const attainedPct = totalActive ? Math.round((attainedCount / totalActive) * 100) : 0;

  // 2. Skills at Risk — count below at-risk threshold; surface lowest by name.
  const atRiskSkills = activeSkills
    .filter(([, v]) => v < AT_RISK_THRESHOLD)
    .sort((a, b) => a[1] - b[1]);
  const lowestRiskSkill = atRiskSkills[0]?.[0] || null;

  // 3. Growth Headroom — mean (scenario_high − predicted) across active skills,
  // averaged per-skill across courses. The scenario_high field is the model's
  // "if all ILOs hit 90%" output, so this is pure ML projection.
  const headroom = (() => {
    const per = predictions?.per_course || [];
    let total = 0;
    let count = 0;
    per.forEach(c => {
      const cur = c.predicted_skills || {};
      const high = c.scenario_high || {};
      Object.keys(cur).forEach(s => {
        if (cur[s] > 1.0 && typeof high[s] === 'number') {
          total += (high[s] - cur[s]);
          count += 1;
        }
      });
    });
    return count ? total / count : 0;
  })();

  // 4. Highest-Leverage Course — course whose mean skill gap to scenario_high
  // is largest; the single course where focus pays off most.
  const topLeverage = (() => {
    const per = predictions?.per_course || [];
    let best = null;
    per.forEach(c => {
      const cur = c.predicted_skills || {};
      const high = c.scenario_high || {};
      const keys = Object.keys(cur).filter(k => cur[k] > 1.0 && typeof high[k] === 'number');
      if (!keys.length) return;
      const meanGap = keys.reduce((acc, k) => acc + (high[k] - cur[k]), 0) / keys.length;
      if (!best || meanGap > best.gap) best = { course: c.course, gap: meanGap };
    });
    return best;
  })();

  const TOTAL_SKILLS = 20;
  const overallAvg = totalActive 
    ? activeSkills.reduce((acc, [, v]) => acc + v, 0) / totalActive 
    : 0;

  return (
    <div className="p-8 space-y-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-[#70170f] uppercase tracking-[0.3em] mb-1">PERFORMANCE HUB</p>
          <h1 className="text-[2.5rem] font-black text-gray-900 leading-tight">Academic Analytics</h1>
        </div>
        <div className="flex items-center gap-4 mt-2">
          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen(!filterOpen); setNotifOpen(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-[13px] font-bold transition-all ${hasActiveFilters
                ? 'border-[#9f0707] bg-[#9f0707] text-white shadow-lg'
                : 'border-[#ead3d3] text-[#70170f] hover:bg-[#fff5f5]'
                }`}
            >
              <Filter size={16} /> Filter
            </button>
            <FilterDropdown
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              semester={semester}
              setSemester={setSemester}
              category={category}
              setCategory={setCategory}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setFilterOpen(false); }}
              className="relative w-10 h-10 border border-[#ead3d3] rounded-xl flex items-center justify-center hover:bg-[#fff5f5] transition-colors"
            >
              <Bell size={18} className="text-[#70170f]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#70170f] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards — ML-driven, refetched on grade_released */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="SKILLS MASTERED"
          icon={Award}
          main={`${attainedCount} of ${TOTAL_SKILLS}`}
          sub={totalActive
            ? `Overall score: ${overallAvg.toFixed(1)}%`
            : 'awaiting graded scores'}
          badge={totalActive ? `${Math.round((attainedCount / TOTAL_SKILLS) * 100)}%` : null}
          badgeTone="green"
        />
        <StatCard
          label="NEEDS ATTENTION"
          icon={ShieldAlert}
          main={totalActive
            ? `${atRiskSkills.length} ${atRiskSkills.length === 1 ? 'skill' : 'skills'}`
            : '—'}
          sub={lowestRiskSkill
            ? `under ${AT_RISK_THRESHOLD}% — start with ${lowestRiskSkill}`
            : totalActive ? 'no skills below 60% — keep it up' : 'awaiting graded scores'}
          badge={atRiskSkills.length > 0 ? `below ${AT_RISK_THRESHOLD}%` : null}
          badgeTone="red"
        />
        <StatCard
          label="GROWTH POTENTIAL"
          icon={Rocket}
          main={headroom > 0 ? `+${headroom.toFixed(1)}%` : '—'}
          sub={headroom > 0
            ? 'average skill gain if your grades reach 90%'
            : 'no projected growth available'}
          badge={headroom >= 5 ? 'high' : headroom > 0 ? 'moderate' : null}
          badgeTone="indigo"
        />
        <StatCard
          label="TOP COURSE TO IMPROVE"
          icon={Compass}
          main={topLeverage ? `+${topLeverage.gap.toFixed(1)}%` : '—'}
          sub={topLeverage
            ? `boost from focusing on ${topLeverage.course}`
            : 'awaiting course-level signal'}
          badge={topLeverage && topLeverage.gap >= 5 ? 'focus here' : null}
          badgeTone="amber"
        />
      </div>

      {/* Row 2: Radar | Achieved Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <CompetencyRadar soValues={soValues} />
        </div>

        {/* Skills Lists — ML-driven */}
        <div className={`${panelBase} p-8 flex flex-col h-full lg:col-span-2`}>
          <div className="flex-1">
            <p className="text-[10px] font-extrabold text-[#70170f] uppercase tracking-[0.2em] mb-6">ACHIEVED SKILLS</p>
            <div className="space-y-5 mb-10">
              {topThird.slice(0, 4).map(([name, val]) => {
                const key = `a-${name}`;
                return (
                  <SkillHintRow
                    key={key}
                    skill={name}
                    perCourse={predictions?.per_course || []}
                    mode="achieved"
                    isOpen={openHintSkill === key}
                    onToggle={() => setOpenHintSkill(openHintSkill === key ? null : key)}
                    divider
                    valueNode={
                      <span className="text-[11px] font-bold bg-[#70170f]/10 text-[#70170f] px-2.5 py-1 rounded-lg tabular-nums">
                        {val.toFixed(1)}
                      </span>
                    }
                  />
                );
              })}
              {topThird.length === 0 && <p className="text-sm text-gray-400">None achieved yet.</p>}
            </div>

            <p className="text-[10px] font-extrabold text-[#70170f] uppercase tracking-[0.2em] mb-6">PREDICTED GROWTH</p>
            <div className="space-y-6">
              {predictedPotential.map(s => {
                const key = `p-${s.name}`;
                const fillPct = s.potential > 0 ? Math.min((s.current / s.potential) * 100, 100) : 0;
                return (
                  <SkillHintRow
                    key={key}
                    skill={s.name}
                    perCourse={predictions?.per_course || []}
                    mode="developing"
                    isOpen={openHintSkill === key}
                    onToggle={() => setOpenHintSkill(openHintSkill === key ? null : key)}
                    valueNode={
                      <span className="text-[11px] text-emerald-600 font-bold tabular-nums">
                        +{s.gap.toFixed(1)}
                      </span>
                    }
                    barNode={
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                    }
                  />
                );
              })}
              {predictedPotential.length === 0 && <p className="text-sm text-gray-400">Analysis pending...</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Insight | Priority Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
        <IntegratedInsights
          topSkill={topSkillName}
          topVal={topSkillVal}
          topCeiling={topSkillCeiling}
          topSO={topSkillSO}
          topDriver={topSkillDriver}
          weakSkill={weakSkillName}
          weakVal={weakSkillVal}
          weakCeiling={weakSkillCeiling}
          weakSO={weakSkillSO}
          weakDriver={weakSkillDriver}
        />

        </div>

        <div className={`${panelBase} p-8 flex flex-col justify-center lg:col-span-2`}>
          <div>
            <h3 className="text-[20px] font-black text-gray-900 leading-tight mb-8">Priority Recommendations</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-colors duration-300">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Focus on missing assignments</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Improve grade consistency.</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-colors duration-300">
                <Microscope size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Practice weak skills</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Review the concepts you missed in midterms.</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-colors duration-300">
                <Target size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Sync Career Goals</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Update roadmap to match your latest scores.</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Proficiency Growth Analysis */}
      <div className={`${panelBase} p-6 flex flex-col`}>
        <div className="flex flex-col gap-1 mb-6">
          <h3 className="text-[18px] font-black text-gray-900 leading-tight">Proficiency Growth Analysis</h3>
          <p className="text-[11px] text-gray-500 font-medium">
            {skillsTotal} categories ranked by score
          </p>
        </div>
        
        <div className="flex-1 pt-2">
            <RankedSkillsChart sortedSkills={sortedSkills} third={skillsThird} animated={barsAnimated} compact />
        </div>
      </div>
    </div>
  );
}
