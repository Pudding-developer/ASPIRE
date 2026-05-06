import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen, ArrowLeft, Target,
  TrendingUp, Github, Star
} from 'lucide-react';

import useStudentData from '../../dashboard/hooks/useStudentData';
import useActivityFeed from '../../dashboard/hooks/useActivityFeed';
import useInterventions from '../hooks/useInterventions';
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
const SEMESTERS = ['All Semesters', '1st Semester 2024-2025', '2nd Semester 2024-2025', '1st Semester 2023-2024', '2nd Semester 2023-2024'];
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
function StatCard({ label, main, sub, badge, progress }) {
  return (
    <div className={`${panelBase} p-6 flex flex-col justify-between`}>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-4">{label}</p>
      <div className="flex items-center gap-3">
        <h3 className="text-3xl font-extrabold text-gray-900 leading-none">{main}</h3>
        {badge && (
          <span className="text-[11px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 font-medium mt-2">{sub}</p>
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
function IntegratedInsights({ topSkills, weakSkills, topSkill, topVal, weakSkill, weakVal, target }) {
  const brandRed = '#70170f';
  return (
    <div 
      className={`${panelBase} p-8 flex flex-col border-none text-white shadow-[0_20px_50px_-12px_rgba(112,23,15,0.4)] relative overflow-hidden group`}
      style={{ backgroundColor: brandRed }}
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-[0.05] blur-3xl rounded-full -mr-24 -mt-24" />
      
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <Lightbulb className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-[20px] font-black text-white leading-tight">Smart Insights</h3>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        {/* Top Strength Section */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">CORE STRENGTH</span>
              <h4 className="text-[14px] font-bold text-white leading-tight">{topSkill || (topSkills?.[0]?.name) || 'N/A'}</h4>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-[18px] font-black text-white leading-none">{Math.round(topVal || 0)}%</span>
              <p className="text-[9px] font-bold text-emerald-300 mt-1">↑ Potential {Math.min(100, Math.round((topVal || 0) + 8))}%</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${topVal || 0}%` }} />
          </div>
          <p className="text-[11px] text-white/70 mt-3 leading-relaxed italic">
             "Your performance in this area is exceptional. Focus on mentoring peers to further solidify your mastery."
          </p>
        </div>

        {/* Growth Opportunity Section */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-1">GROWTH OPPORTUNITY</span>
              <h4 className="text-[14px] font-bold text-white leading-tight">{weakSkill || (weakSkills?.[0]?.name) || 'N/A'}</h4>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-[18px] font-black text-white leading-none">{Math.round(weakVal || 0)}%</span>
              <p className="text-[9px] font-bold text-amber-300 mt-1">Target Milestone: {Math.round(target || 0)}%</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${weakVal || 0}%` }} />
          </div>
          <p className="text-[11px] text-white/70 mt-3 leading-relaxed italic">
            "Targeting these specific concepts could improve your overall outcome by {Math.round((target || 0) - (weakVal || 0))}% this semester."
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Outcome Badge helpers ─── */
const OUTCOME_STYLES = {
  'EXCEEDING EXPECTATIONS': 'bg-green-50 text-green-700 border-green-200',
  'ON TRACK': 'bg-blue-50 text-blue-700 border-blue-200',
  'NEEDS ATTENTION': 'bg-amber-50 text-amber-700 border-amber-200',
  'CRITICAL': 'bg-red-50 text-red-700 border-red-200',
};
function outcomeChipClass(label) {
  if (!label) return 'bg-gray-50 text-gray-600 border-gray-200';
  const key = label.toUpperCase();
  return OUTCOME_STYLES[key] || 'bg-gray-50 text-gray-600 border-gray-200';
}

/* ─── Expandable Course Card ─── */
function CourseBreakdownCard({ course, onViewDetails }) {
  const [open, setOpen] = useState(false);

  const ilos = course.ilo_scores || {};
  const iloKeys = Object.keys(ilos).sort();
  const skills = course.predicted_skills || {};

  const mastery = Math.round(course.ilo_avg || 0);
  const strongest = course.strongest_skill;
  const weakest = course.weakest_skill;

  const potentialSkill = strongest;
  const potentialNew = course.scenario_high?.[potentialSkill];
  const potentialNow = skills[potentialSkill];
  const showPotential =
    potentialSkill && typeof potentialNew === 'number' && typeof potentialNow === 'number';

  return (
    <div className="border border-[#f0dddd] rounded-2xl bg-white/75 overflow-hidden transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#fff5f5]/60 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-bold text-gray-900 truncate">{course.course}</h4>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${outcomeChipClass(course.outcome_label)}`}>
              {course.outcome_label || 'No Data'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a0505] rounded-full transition-all"
                style={{ width: `${Math.min(mastery, 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-gray-700 w-10 text-right">{mastery}%</span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[#f7eaea] space-y-5">
          {/* ILO chips */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ILO Scores</p>
            <div className="flex flex-wrap gap-2">
              {iloKeys.length === 0 && <span className="text-[11px] text-gray-400">No ILO data.</span>}
              {iloKeys.map(k => (
                <span
                  key={k}
                  className="px-2.5 py-1 bg-[#fff1f1] border border-[#efd7d7] text-[#7b5656] text-[11px] font-bold rounded-lg"
                >
                  {k.toUpperCase()} · {Math.round(ilos[k])}%
                </span>
              ))}
            </div>
          </div>

          {/* Strongest / Weakest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-green-700 uppercase tracking-widest">Strongest</p>
                <p className="text-[12px] font-semibold text-gray-900 truncate">{strongest || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest">Weakest</p>
                <p className="text-[12px] font-semibold text-gray-900 truncate">{weakest || '—'}</p>
              </div>
            </div>
          </div>

          {/* Potential hint */}
          {showPotential && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#fff8e6] border border-[#f3e3a8]">
              <Lightbulb size={14} className="text-[#a07b00] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#5b4500] leading-snug">
                <span className="font-bold">Potential if all ILOs = 90%:</span>{' '}
                {potentialSkill} → <span className="font-bold">{potentialNew.toFixed(1)}</span>{' '}
                <span className="text-[#866900]">(currently {potentialNow.toFixed(1)})</span>
              </p>
            </div>
          )}

          {/* View Details */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(course.course);
              }}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#70170f] hover:text-[#7a0d0d] transition-colors"
            >
              View Details <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
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

  const { classes, predictions, iloCoverage, loading } = useStudentData();
  const { interventions: skillInterventions, updatedAt: interventionsUpdatedAt } = useInterventions(user?.id);
  const { items: notifications, refetch: refetchActivity } = useActivityFeed(10);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    if (!notifOpen || unreadCount === 0) return;
    studentService.markActivityRead()
      .then(() => refetchActivity())
      .catch(() => {});
  }, [notifOpen, unreadCount, refetchActivity]);

  if (loading) {
    return <StudentPerformanceSkeleton />;
  }

  if (selectedCourse) {
    return (
      <StudentCourseDetailView
        courseName={selectedCourse}
        user={user}
        interventions={skillInterventions}
        interventionsUpdatedAt={interventionsUpdatedAt}
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

  // ML insight values
  const topSkillName = predictions?.top_skills?.[0];
  const weakSkillName = predictions?.weak_skills?.[0];
  const topSkillVal = topSkillName != null ? aggSkills[topSkillName] : null;
  const weakSkillVal = weakSkillName != null ? aggSkills[weakSkillName] : null;
  const skillAvg = sortedSkills.length
    ? sortedSkills.reduce((a, [, v]) => a + v, 0) / sortedSkills.length
    : 0;

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

  // Derived SO Values for ML-based metrics
  const soValues = Array.from({ length: 13 }, (_, i) => {
    const seed = (i + 1) * 7;
    const base = 0.65 + (Math.sin(seed) * 0.2); // Placeholder logic simulating ML analysis
    return Math.min(Math.max(base, 0.4), 0.95);
  });
  const avgSO = (soValues.reduce((a, b) => a + b, 0) / 13) * 100;

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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="OVERALL PERFORMANCE"
          main={`${Math.round(avgSO)}%`}
          sub="Institutional proficiency"
        />
        <StatCard
          label="SKILL ACHIEVEMENT"
          main={`${Math.round(avgSO)}%`}
          sub="Attained SO scores"
        />
        <StatCard
          label="SKILLS TRACKED"
          main="13"
          sub="Student Outcomes"
        />
        <StatCard
          label="PERFORMANCE LEVEL"
          main={Math.round(avgSO) >= 75 ? 'Competent' : Math.round(avgSO) >= 60 ? 'Developing' : 'At Risk'}
          sub="Current standing"
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
          topSkills={predictions?.top_skills}
          weakSkills={predictions?.weak_skills}
          topSkill={topSkillName}
          topVal={topSkillVal}
          weakSkill={weakSkillName}
          weakVal={weakSkillVal}
          target={skillAvg}
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

      {/* Row 4: Analysis & Breakdown Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Proficiency Growth Analysis */}
        <div className={`lg:col-span-2 ${panelBase} p-6 flex flex-col`}>
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

        {/* Right: Course Breakdown */}
        <div className={`lg:col-span-3 ${panelBase} p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">PER-COURSE ANALYSIS</p>
              <h3 className="text-[18px] font-black text-gray-900">Course Breakdown</h3>
            </div>
            <span className="text-[11px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              {(predictions?.per_course?.length || 0)} course{(predictions?.per_course?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>

          {(!predictions?.per_course || predictions.per_course.length === 0) ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic py-12">
              No course predictions available yet.
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {predictions.per_course.map((course, i) => (
                <CourseBreakdownCard
                  key={course.course || i}
                  course={course}
                  onViewDetails={setSelectedCourse}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
