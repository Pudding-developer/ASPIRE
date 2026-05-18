import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen, ArrowLeft, Target,
  TrendingUp, Github, Star, ShieldAlert, Award, Rocket, Compass, Zap, AlertTriangle, UserCheck, Activity, Search
} from 'lucide-react';

import useStudentData from '../../dashboard/hooks/useStudentData';
import { StudentPerformanceSkeleton } from '../../shared/StudentPageSkeletons';

const GRADING_SYSTEM = [
  { label: "Excellent", min: 98, color: "bg-purple-600", bg: "bg-purple-50/50", border: "border-purple-200", text: "text-purple-900" },
  { label: "Superior", min: 94, color: "bg-violet-400", bg: "bg-violet-50/50", border: "border-violet-200", text: "text-violet-900" },
  { label: "Very Good", min: 90, color: "bg-blue-600", bg: "bg-blue-50/50", border: "border-blue-200", text: "text-blue-900" },
  { label: "Good", min: 88, color: "bg-sky-400", bg: "bg-sky-50/50", border: "border-sky-200", text: "text-sky-900" },
  { label: "Meritorious", min: 85, color: "bg-teal-500", bg: "bg-teal-50/50", border: "border-teal-200", text: "text-teal-900" },
  { label: "Very Satisfactory", min: 83, color: "bg-green-700", bg: "bg-green-50/50", border: "border-green-200", text: "text-green-900" },
  { label: "Satisfactory", min: 80, color: "bg-emerald-500", bg: "bg-emerald-50/50", border: "border-emerald-200", text: "text-emerald-900" },
  { label: "Fairly Satisfactory", min: 78, color: "bg-yellow-400", bg: "bg-yellow-50/50", border: "border-yellow-200", text: "text-yellow-900" },
  { label: "Passing", min: 75, color: "bg-orange-500", bg: "bg-orange-50/50", border: "border-orange-200", text: "text-orange-900" },
  { label: "Needs to Focus", min: 0, color: "bg-red-600", bg: "bg-red-50", border: "border-[#70170f]/30", text: "text-[#70170f]" },
];

import useActivityFeed from '../../dashboard/hooks/useActivityFeed';
import StudentCourseDetailView from './StudentCourseDetailView';
import { studentService } from '../../../../services/studentService';
import AllActivitiesModal from '../../dashboard/components/AllActivitiesModal';

const NOTIF_VISUALS = {
  grade_released: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
  career_updated: { icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  github_synced: { icon: Github, color: 'bg-blue-100 text-blue-600' },
  skill_milestone: { icon: Star, color: 'bg-yellow-100 text-yellow-600' },
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

const COURSE_SEMESTER_MAP = {
  "Introduction to Engineering": 1, "Understanding the Self": 1, "Mathematics in the Modern World": 1,
  "Readings in Philippine History": 1, "Purposive Communication": 1, "Differential Calculus": 1,
  "General Chemistry": 1, "Computer Programming 1": 1, "Engineering Drawing": 2,
  "Contemporary World": 2, "Art Appreciation": 2, "Science, Technology and Society": 2,
  "Integral Calculus": 2, "Physics 1": 2, "Life and Works of Rizal": 3, "Ethics": 3,
  "Modern Biology": 3, "Computer Engineering as a Discipline": 3, "Programming Logic and Design": 3,
  "Discrete Mathematics": 3, "Fundamentals of Electrical Engineering": 3, "Computer-Aided Design": 3,
  "Engineering Economics": 4, "Engineering Data Analysis": 4, "Differential Equations": 4,
  "Object Oriented Programming": 4, "Advanced Engineering Mathematics for CpE": 4,
  "Cognate/Elective Course 1": 4, "Electronic Circuits: Devices and Analysis": 4,
  "Basic Occupational Health and Safety": 4, "Numerical Methods": 4, "Kontekstwalisadong Komunikasyon sa Filipino": 4,
  "Logic Circuits and Design": 5, "Data Structures and Algorithms": 5, "Introduction to Networks, Data and Digital Communications (CISCO 1)": 5,
  "Fundamentals of Mixed Signals and Sensors": 5, "Feedback and Control Systems": 5, "Introduction to HDL": 5,
  "Research Methods": 5, "Filipino sa Iba't Ibang Disiplina": 5, "Microprocessors": 6,
  "Software Design": 6, "Routing and Switching (CISCO 2)": 6, "Digital Signal Processing": 6,
  "Emerging Technologies in CpE": 6, "CpE Practice and Design 1": 6, "Cognate/Elective Course 2": 6,
  "Scaling Networks (CISCO 3)": 7, "Operating Systems": 7, "Computer Architecture and Organization": 7,
  "Computer Engineering Drafting and Design": 7, "Connecting Networks and Security (CISCO 4)": 7,
  "Embedded Systems": 7, "Seminars and Fieldtrips": 7, "Manufacturing and Quality Control": 7,
  "Cognate/Elective Course 3 (Data Mining / AI Track)": 7, "ASEAN Literature": 7, "Technopreneurship": 8,
  "On-the-Job Training": 8, "CpE Practice and Design 2": 8
};

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
function NotificationDropdown({ open, onClose, notifications, unreadCount, onShowAll }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-linear-to-br from-white via-[#fff9f9] to-[#fcf4f2] border border-[#efd4d4] rounded-2xl shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)] z-50 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#f2dfdf] flex items-center justify-between shrink-0">
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
      <div className="p-3 border-t border-[#f2dfdf] bg-white shrink-0">
        <button
          onClick={() => { onClose(); onShowAll(); }}
          className="w-full bg-[#9f0707] hover:bg-[#430202] text-white py-2 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-lg shadow-[#9f0707]/10"
        >
          View all activities
        </button>
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

      <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row items-start justify-center gap-12">
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
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required level (75%)</span>
            </div>
          </div>
        </div>



        {/* Right: SO List */}
        <div className="flex-1 w-full max-w-md">



          <div className="space-y-1">
            {SO_INFO.map((so, i) => {
              const val = Math.round(soValues[i] * 100);
              const level = GRADING_SYSTEM.find(l => val >= l.min) || GRADING_SYSTEM[GRADING_SYSTEM.length - 1];
              const colorClass = level.color;
              const textClass = level.text;

              return (
                <div key={so.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0 group hover:bg-gray-50/50 px-2 transition-colors">
                  <div className="w-10 text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded text-center shrink-0">
                    {so.id}
                  </div>
                  <div className="w-[170px] shrink-0">
                    <p className="text-[11px] font-bold text-gray-700 truncate">{so.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                      {/* 75% mark */}
                      <div className="absolute left-[75%] top-0 bottom-0 w-px bg-gray-300 z-10" />
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

          {/* Full 10-level Grading Legend - 5 top, 5 bottom */}
          <div className="mt-8">
            <div className="grid grid-cols-5 gap-y-4 gap-x-1">
              {GRADING_SYSTEM.map((level) => (
                <div key={level.label} className="flex flex-col items-center gap-1.5 text-center group">
                  <div className={`w-2 h-2 ${level.color} rounded-full shadow-sm group-hover:scale-125 transition-transform`} />
                  <span className="text-[8.5px] font-bold text-gray-700 leading-tight group-hover:text-gray-900 transition-colors truncate w-full px-0.5" title={level.label}>
                    {level.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─── Integrated AI Insights Panel ─── */
function IntegratedInsights({ tech, nonTech, latestSem }) {
  const brandRed = '#70170f';

  return (
    <div
      className={`${panelBase} p-6 flex flex-col h-full border-none text-white shadow-[0_20px_50px_-12px_rgba(112,23,15,0.4)] relative overflow-hidden group`}
      style={{ backgroundColor: brandRed }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-[0.05] blur-3xl rounded-full -mr-24 -mt-24" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <Activity className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-[20px] font-black text-white leading-tight">AI Performance Diagnostic</h3>
          <p className="text-[10px] text-white/50 tracking-widest uppercase mt-0.5">Real-Time Insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Technical Insight (Left Column) */}
        <div className="flex flex-col">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Technical Competency</p>
          {tech.name ? (
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[9px] font-black text-amber-300 uppercase tracking-widest">
                      Risk Detected
                    </span>
                  </div>
                  <h4 className="text-[18px] font-black text-white leading-tight mb-1 truncate" title={tech.name}>
                    {tech.name}
                  </h4>
                  <p className="text-[12px] text-white/60 font-medium italic truncate">
                    {tech.so?.so_id || 'ILO'}: {tech.so?.so_name || 'Alignment'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[24px] font-black text-white leading-none tracking-tighter tabular-nums">
                    {Math.round(tech.val)}<span className="text-[12px] text-white/50 ml-0.5">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-[12px] text-white/80 leading-relaxed">
                  {(() => {
                    const courseName = tech.driver?.course;
                    const getCourseSem = (name) => {
                      if (!name) return 0;
                      const normalized = name.trim();
                      if (COURSE_SEMESTER_MAP[normalized]) return COURSE_SEMESTER_MAP[normalized];
                      const key = Object.keys(COURSE_SEMESTER_MAP).find(
                        k => k.toLowerCase() === normalized.toLowerCase()
                      );
                      return key ? COURSE_SEMESTER_MAP[key] : 0;
                    };

                    const courseSem = getCourseSem(courseName);
                    const isMasteredInCourse = (tech.driver?.avg_score || 0) >= 75;
                    const isCurrent = courseSem > 0 && courseSem === latestSem;
                    const isPast = courseSem > 0 && courseSem < latestSem;
                    const isFuture = courseSem > latestSem;

                    if (isCurrent) {
                      return <>Focus on improving <span className="font-bold text-white uppercase tracking-tight">{tech.name}</span> in <span className="font-bold text-white uppercase tracking-tight">{courseName}</span> since your score is currently lower here.</>;
                    }
                    if (isFuture) {
                      return <>Strengthen <span className="font-bold text-white uppercase tracking-tight">{tech.name}</span> foundations to prepare for your next course: <span className="font-bold text-white uppercase tracking-tight">{courseName}</span>.</>;
                    }
                    if (isPast || isMasteredInCourse) {
                      return <>Reinforce <span className="font-bold text-white uppercase tracking-tight">{tech.name}</span> concepts from <span className="font-bold text-white uppercase tracking-tight">{courseName || 'Past Courses'}</span> in your current projects.</>;
                    }
                    return <>Monitor performance in <span className="font-bold text-white uppercase tracking-tight">{courseName || 'Core Subjects'}</span> to reverse the trend.</>;
                  })()}
                </p>
                <div className="">
                  <p className="text-[11px] text-white/40 font-medium italic">
                    Course alignment: <span className="text-white/60">{tech.driver?.course || 'General Curriculum'}</span> strengthens <span className="text-white/60">{tech.name}</span> via <span className="text-white/60">{tech.so?.so_id || 'SO'}</span>.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center border border-dashed border-white/10 rounded-2xl p-6">
              <CheckCircle2 className="text-emerald-400 mb-2" size={24} />
              <p className="text-[11px] text-white/60 font-bold">Optimal Performance</p>
            </div>
          )}
        </div>

        {/* Professional Insight (Right Column) */}
        <div className="flex flex-col border-l border-white/10 pl-0 md:pl-8">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Professional Skills</p>
          {nonTech.name ? (
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[9px] font-black text-amber-300 uppercase tracking-widest">
                      Risk Detected
                    </span>
                  </div>
                  <h4 className="text-[18px] font-black text-white leading-tight mb-1 truncate" title={nonTech.name}>
                    {nonTech.name}
                  </h4>
                  <p className="text-[12px] text-white/60 font-medium italic truncate">
                    {nonTech.so?.so_id || 'SO'}: {nonTech.so?.so_name || 'Alignment'}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[24px] font-black text-white leading-none tracking-tighter tabular-nums">
                    {Math.round(nonTech.val)}<span className="text-[12px] text-white/50 ml-0.5">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-[12px] text-white/80 leading-relaxed">
                  {(() => {
                    const courseName = nonTech.driver?.course;
                    const getCourseSem = (name) => {
                      if (!name) return 0;
                      const normalized = name.trim();
                      if (COURSE_SEMESTER_MAP[normalized]) return COURSE_SEMESTER_MAP[normalized];
                      const key = Object.keys(COURSE_SEMESTER_MAP).find(
                        k => k.toLowerCase() === normalized.toLowerCase()
                      );
                      return key ? COURSE_SEMESTER_MAP[key] : 0;
                    };

                    const courseSem = getCourseSem(courseName);
                    const isMasteredInCourse = (nonTech.driver?.avg_score || 0) >= 75;
                    const isCurrent = courseSem > 0 && courseSem === latestSem;
                    const isPast = courseSem > 0 && courseSem < latestSem;
                    const isFuture = courseSem > latestSem;

                    if (isCurrent) {
                      return <>Improve your <span className="font-bold text-white uppercase tracking-tight">{nonTech.name}</span> skills in <span className="font-bold text-white uppercase tracking-tight">{courseName}</span> since your performance is lower here.</>;
                    }
                    if (isFuture) {
                      return <>Build <span className="font-bold text-white uppercase tracking-tight">{nonTech.name}</span> proficiency to prepare for your next course: <span className="font-bold text-white uppercase tracking-tight">{courseName}</span>.</>;
                    }
                    if (isPast || isMasteredInCourse) {
                      return <>Reinforce <span className="font-bold text-white uppercase tracking-tight">{nonTech.name}</span> concepts from <span className="font-bold text-white uppercase tracking-tight">{courseName || 'Completed Subjects'}</span> in your current projects.</>;
                    }
                    return <>Continue focusing on <span className="font-bold text-white uppercase tracking-tight">{nonTech.name}</span> development.</>;
                  })()}
                </p>
                <div className="">
                  <p className="text-[11px] text-white/40 font-medium italic">
                    Course alignment: <span className="text-white/60">{nonTech.driver?.course || 'General Curriculum'}</span> strengthens <span className="text-white/60">{nonTech.name}</span> via <span className="text-white/60">{nonTech.so?.so_id || 'SO'}</span>.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center border border-dashed border-white/10 rounded-2xl p-6">
              <CheckCircle2 className="text-emerald-400 mb-2" size={24} />
              <p className="text-[11px] text-white/60 font-bold">Optimal Performance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




/* ─── Proficiency Growth helpers ─── */
/* ─── Proficiency Growth helpers ─── */


function RankedSkillsChart({ sortedSkills, animated }) {
  if (sortedSkills.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-[12px] text-gray-400 font-medium">No skill data available.</p>
      </div>
    );
  }

  // Group skills into the 10 categories based on the GRADING_SYSTEM ranges
  const categorizedBoxes = GRADING_SYSTEM.map((level, idx) => {
    const nextLevel = GRADING_SYSTEM[idx - 1]; // next higher level (since the array is sorted high to low)
    const skills = sortedSkills.filter(([, val]) => {
      const isAboveMin = val >= level.min;
      const isBelowNextMin = nextLevel ? val < nextLevel.min : true;
      return isAboveMin && isBelowNextMin;
    });

    // Calculate range text for student clarity
    const rangeText = nextLevel
      ? `${level.min}-${(nextLevel.min - 0.1).toFixed(1)}%`
      : `${level.min}-100%`;

    return { ...level, skills, rangeText };
  }).filter(box => box.skills.length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {categorizedBoxes.map((box, idx) => (
        <div key={idx} className={`rounded-2xl border ${box.border} ${box.bg} p-5 flex flex-col shadow-sm transition-all hover:shadow-md`}>
          <div className="flex justify-between items-start mb-5">
            <div className="flex flex-col">
              <h4 className={`text-[13px] font-black ${box.text} tracking-tight`}>{box.label}</h4>
              <span className={`text-[10px] font-bold ${box.text} opacity-50 tabular-nums`}>{box.rangeText}</span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/60 ${box.text} border ${box.border}`}>{box.skills.length}</span>
          </div>
          <div className="flex-1 space-y-3.5">
            {box.skills.map(([name, val]) => (
              <div key={name} className="group">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className={`text-[11px] font-bold truncate ${box.text} opacity-90 group-hover:opacity-100 transition-opacity`} title={name}>{name}</span>
                  <span className={`text-[10px] font-black tabular-nums ${box.text}`}>{val.toFixed(1)}</span>
                </div>
                <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${box.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: animated ? `${val}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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

function topCoursesForSkill(skill, perCourse, mode, latestSem = 0, isFiltered = false) {
  if (!skill || !Array.isArray(perCourse) || perCourse.length === 0) return [];

  const getSemester = (courseName) => {
    if (!courseName) return 0;
    const normalized = courseName.trim();
    if (COURSE_SEMESTER_MAP[normalized]) return COURSE_SEMESTER_MAP[normalized];
    const key = Object.keys(COURSE_SEMESTER_MAP).find(
      k => k.toLowerCase() === normalized.toLowerCase()
    );
    return key ? COURSE_SEMESTER_MAP[key] : 0;
  };

  return perCourse
    .map(c => ({
      course: c.course,
      current: c.predicted_skills?.[skill] ?? 0,
      potential: c.scenario_high?.[skill] ?? 0,
      avg_score: c.ilo_avg || 0, // Overall subject average
      semester: getSemester(c.course)
    }))
    .filter(r => {
      // CRITICAL: Only include courses that actually HAVE graded data.
      if (!r.avg_score || r.avg_score <= 0) return false;

      const base = r.current > 0.5 || r.potential > 0.5;

      if (mode === 'achieved') {
        // 'Achieved' mode shows courses where the student has reached the competency threshold (>= 75).
        return base && r.avg_score >= 75;
      }

      if (mode === 'developing') {
        // 'Developing' mode shows courses where there is room for growth.
        // We include anything below 75%, OR courses above 75% that still have 
        // a noticeable potential gap (> 1.0) to their predicted ceiling.
        const growthGap = r.potential - r.current;
        return base && (r.avg_score < 75 || growthGap > 1.0);
      }
      return base;
    })
    .sort((a, b) => {
      const scoreA = mode === 'achieved' ? a.current : (a.potential - a.current);
      const scoreB = mode === 'achieved' ? b.current : (b.potential - b.current);

      if (Math.abs(scoreB - scoreA) > 1.0) {
        return scoreB - scoreA;
      }

      return b.semester - a.semester;
    })
    .slice(0, 3);
}

function SkillHintRow({ skill, perCourse, mode, isOpen, onToggle, valueNode, barNode, divider, latestSem = 0, isFiltered = false }) {
  const recs = topCoursesForSkill(skill, perCourse, mode, latestSem, isFiltered);
  return (
    <div className={divider ? 'border-b border-gray-100 pb-3' : ''}>
      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 min-w-0 group/skill"
        >
          <span className={`text-[13px] font-semibold truncate transition-colors ${isOpen ? 'text-[#70170f]' : 'text-gray-800 group-hover/skill:text-[#70170f]'}`} title={skill}>
            {skill}
          </span>
          <div className={`shrink-0 transition-colors ${isOpen ? 'text-[#70170f]' : 'text-gray-400 group-hover/skill:text-[#70170f]'}`}>
            <AlertCircle size={13} />
          </div>
        </button>
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
                  <div className="flex items-center gap-2 tabular-nums shrink-0">
                    {(() => {
                      const level = GRADING_SYSTEM.find(l => r.current >= l.min) || GRADING_SYSTEM[GRADING_SYSTEM.length - 1];
                      const gain = r.potential - r.current;

                      return (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${level.bg} ${level.text} px-1.5 py-0.5 rounded border ${level.border}`}>
                            {r.current.toFixed(1)}
                          </span>
                          {mode === 'developing' && gain > 0 && (
                            <span className="text-[10px] text-emerald-600 font-black">
                              +{gain.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
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
  const [showAllActivities, setShowAllActivities] = useState(false);
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

  const { profile, classes, predictions, iloCoverage, loading, refetch: refetchPredictions } = useStudentData(getFilterParams());
  const { items: notifications, refetch: refetchActivity } = useActivityFeed(10);
  const unreadCount = notifications.filter(n => n.unread).length;
  const lastGradeTs = useRef(null);

  useEffect(() => {
    if (!notifOpen || unreadCount === 0) return;
    studentService.markActivityRead()
      .then(() => refetchActivity())
      .catch(() => { });
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

  // Global Latest Semester: The student's actual current standing in the program.
  // We use this for the 'Achieved' vs 'Developing' logic, so that filtering
  // doesn't hide signals.
  const studentCurrentSem = (() => {
    // We prioritize the official profile standing (e.g., Year 4, Sem 2 = Sem 8).
    // This makes the logic immune to filters.
    if (profile?.year_level && profile?.semester) {
      return (profile.year_level - 1) * 2 + profile.semester;
    }
    // Fallback: We look at all classes (archived and active) to find the highest semester reached.
    const all = [...(classes || [])];
    if (!all.length) return 8; // Default to senior if no class data
    const sems = all.map(c => c.semester || 0);
    return Math.max(0, ...sems);
  })();

  // Latest Semester context for the filtered view (used in UI logic)
  const latestSem = (() => {
    const courses = predictions?.per_course || [];
    if (!courses.length) return studentCurrentSem;
    const sems = courses.map(c => COURSE_SEMESTER_MAP[c.course] || 0);
    return Math.max(0, ...sems);
  })();

  // ML insight values — Smart Insights leans on the trained pipeline output
  // for both ceilings (scenario_high) and outcome alignment (skill_so_map).
  const topSkillName = predictions?.top_skills?.[0];
  const topSkillVal = topSkillName != null ? aggSkills[topSkillName] : null;

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
  // Primary SO each highlighted skill aligns to (from backend skill_so_map).
  const skillSoMap = predictions?.skill_so_map || {};

  const isTechnical = (skillName) => {
    const techSkills = [
      "Mathematics & Science Foundations",
      "Programming & Software Development",
      "Hardware & Circuit Design",
      "Embedded & Microprocessor Systems",
      "Networking & Communications",
      "Operating Systems & Architecture",
      "Signal Processing & Control Systems",
      "Data Science & AI/ML",
      "Engineering Design & Research",
      "Modern Engineering Tools"
    ];
    return techSkills.includes(skillName);
  };

  const weakTechSkillName = Object.keys(aggSkills)
    .filter(s => isTechnical(s) && aggSkills[s] > 0 && aggSkills[s] < 75)
    .sort((a, b) => aggSkills[a] - aggSkills[b])[0] || null;

  const weakProfessionalSkillName = Object.keys(aggSkills)
    .filter(s => !isTechnical(s) && aggSkills[s] > 0 && aggSkills[s] < 75)
    .sort((a, b) => aggSkills[a] - aggSkills[b])[0] || null;

  const weakTechVal = weakTechSkillName != null ? aggSkills[weakTechSkillName] : null;
  const weakProfessionalVal = weakProfessionalSkillName != null ? aggSkills[weakProfessionalSkillName] : null;

  const weakSkillName = weakTechSkillName || weakProfessionalSkillName;
  const weakSkillVal = weakTechVal || weakProfessionalVal;

  const topSkillCeiling = meanCeilingForSkill(topSkillName);
  const weakSkillCeiling = meanCeilingForSkill(weakSkillName);

  const weakTechSO = weakTechSkillName ? skillSoMap[weakTechSkillName] : null;
  const weakProfessionalSO = weakProfessionalSkillName ? skillSoMap[weakProfessionalSkillName] : null;

  const isFiltered = semester !== 'All Semesters';

  const weakTechDriver = weakTechSkillName
    ? topCoursesForSkill(weakTechSkillName, predictions?.per_course || [], 'developing', studentCurrentSem, isFiltered)[0] || null
    : null;
  const weakProfessionalDriver = weakProfessionalSkillName
    ? topCoursesForSkill(weakProfessionalSkillName, predictions?.per_course || [], 'developing', studentCurrentSem, isFiltered)[0] || null
    : null;

  const weakSkillSO = weakTechSO || weakProfessionalSO;
  const weakSkillDriver = weakTechDriver || weakProfessionalDriver;

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
  const AT_RISK_THRESHOLD = 75; // Aligned with 'Needs to Focus' level in radar chart
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
          const gap = high[s] - cur[s];
          if (gap > 0.1) {
            total += gap;
            count += 1;
          }
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

      const meanGap = keys.reduce((acc, k) => {
        const g = high[k] - cur[k];
        return acc + (g > 0 ? g : 0);
      }, 0) / keys.length;

      if (meanGap > 0 && (!best || meanGap > best.gap)) {
        best = { course: c.course, gap: meanGap };
      }
    });
    return best;
  })();

  const TOTAL_SKILLS = 20;
  const overallAvg = totalActive
    ? activeSkills.reduce((acc, [, v]) => acc + v, 0) / totalActive
    : 0;

  return (
    <>
      <div className="p-8 space-y-8 bg-linear-to-br from-[#fff8f8] via-[#fffdfd] to-[#fdf2f2] rounded-3xl border border-[#f2dfdf] shadow-[0_22px_55px_-35px_rgba(0,0,0,0.15)] min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-[#70170f] uppercase tracking-[0.2em] mb-1">PERFORMANCE HUB</p>
            <h1 className="text-[2.2rem] font-black text-gray-900 leading-tight">Academic Analytics</h1>
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
                className="relative w-9 h-9 border border-[#ead3d3] rounded-xl flex items-center justify-center hover:bg-[#fff5f5] transition-colors"
              >
                <Bell size={16} className="text-[#8b6363]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#fffdfd]" />
                )}
              </button>
              <NotificationDropdown
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unreadCount={unreadCount}
                onShowAll={() => setShowAllActivities(true)}
              />
            </div>
          </div>
        </div>

        {/* 4 Stat Cards — ML-driven, refetched on grade_released */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="SKILLS ATTAINED"
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
            sub={atRiskSkills.length > 0
              ? `below ${AT_RISK_THRESHOLD}% — focusing on ${lowestRiskSkill}`
              : totalActive ? 'all skills above 75% — excellent!' : 'awaiting graded scores'}
            badge={atRiskSkills.length > 0 ? 'NEEDS TO FOCUS' : null}
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
                      latestSem={studentCurrentSem}
                      isFiltered={isFiltered}
                      isOpen={openHintSkill === key}
                      onToggle={() => setOpenHintSkill(openHintSkill === key ? null : key)}
                      valueNode={(() => {
                        const level = GRADING_SYSTEM.find(l => val >= l.min) || GRADING_SYSTEM[GRADING_SYSTEM.length - 1];
                        return (
                          <span className={`text-[11px] font-black ${level.bg} ${level.text} px-2.5 py-1 rounded-lg tabular-nums border ${level.border}`}>
                            {val.toFixed(1)}
                          </span>
                        );
                      })()}
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
                      latestSem={studentCurrentSem}
                      isFiltered={isFiltered}
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
                {predictedPotential.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                    <p className="text-[12px] text-gray-400 font-medium italic text-center px-4">No predicted growth yet, Semester just started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Priority Recommendations | Smart Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-3 h-full">
            <IntegratedInsights
              tech={{
                name: weakTechSkillName,
                val: weakTechVal,
                so: weakTechSO,
                driver: weakTechDriver
              }}
              nonTech={{
                name: weakProfessionalSkillName,
                val: weakProfessionalVal,
                so: weakProfessionalSO,
                driver: weakProfessionalDriver
              }}
              latestSem={studentCurrentSem}
            />
          </div>

          <div className={`${panelBase} p-8 flex flex-col h-full lg:col-span-2`}>
            <div>
              <h3 className="text-[20px] font-black text-gray-900 leading-tight mb-8">Priority Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 flex-1">
              {weakSkillName && weakSkillVal < 75 ? (
                <>
                  <div className="p-4 border border-amber-100 bg-[#fffdfa] rounded-xl flex items-center gap-4 hover:border-amber-300 transition-all hover:shadow-sm cursor-pointer group ring-1 ring-amber-50">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center shrink-0 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <GraduationCap size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Focus on {weakSkillName} in <span className="font-bold">{weakSkillDriver?.course || 'Critical Course'}</span> to resolve this proficiency risk.</p>
                    </div>
                  </div>

                  <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Zap size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Analyze your recent assessment errors in <span className="font-bold">{weakSkillName}</span> and focus on the technical indicators where you scored below the 75% threshold.</p>
                    </div>
                  </div>

                  <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Search size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Analyze the technical indicators for {weakSkillName} and retake the relevant formative assessments to reach the 75% threshold.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Target size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Align your high performance in your current courses with industry job requirements.</p>
                    </div>
                  </div>

                  <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Microscope size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Engage in high-complexity projects to maintain your competitive edge.</p>
                    </div>
                  </div>

                  <div className="p-4 border border-[#f0dddd] bg-white/75 rounded-xl flex items-center gap-4 hover:border-[#e3bebe] transition-all hover:shadow-sm cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-[#fff2f2] flex items-center justify-center shrink-0 text-[#8a6161] group-hover:bg-[#70170f] group-hover:text-white transition-all duration-300 shadow-sm">
                      <Activity size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-black leading-relaxed">Share your technical mastery with peers to solidify your leadership skills.</p>
                    </div>
                  </div>
                </>
              )}
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
            <RankedSkillsChart sortedSkills={sortedSkills} animated={barsAnimated} />
          </div>
        </div>
      </div>

      {showAllActivities && <AllActivitiesModal onClose={() => setShowAllActivities(false)} />}
    </>
  );
}
