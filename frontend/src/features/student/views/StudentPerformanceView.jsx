import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen
} from 'lucide-react';

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
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-5 space-y-5">
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
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                semester === s ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-gray-50'
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
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                category === c ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-gray-50'
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

/* ─── Notification Bell ─── */
const MOCK_NOTIFICATIONS = [
  { id: 1, instructor: 'Prof. Reyes', subject: 'Data Structures', message: 'Posted Midterm Exam scores', time: '2 hours ago', unread: true },
  { id: 2, instructor: 'Engr. Santos', subject: 'Circuit Analysis', message: 'Updated Quiz 3 ILO scores', time: '5 hours ago', unread: true },
  { id: 3, instructor: 'Prof. Cruz', subject: 'Discrete Mathematics', message: 'Posted Final Exam scores', time: '1 day ago', unread: false },
  { id: 4, instructor: 'Engr. Bautista', subject: 'Digital Logic Design', message: 'Posted Laboratory Exercise 5 scores', time: '2 days ago', unread: false },
];

function NotificationDropdown({ open, onClose, notifications }) {
  const ref = useRef(null);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[12px] font-bold text-gray-900">Score Updates</h4>
          {unreadCount > 0 && (
            <span className="text-[9px] font-bold bg-[#bc1313] text-white px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={14} /></button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${n.unread ? 'bg-red-50/30' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.unread ? 'bg-[#bc1313]/10 text-[#bc1313]' : 'bg-gray-100 text-gray-400'}`}>
                <BookOpen size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-900 leading-snug">{n.instructor}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{n.subject} &middot; {n.time}</p>
              </div>
              {n.unread && <span className="w-2 h-2 bg-[#bc1313] rounded-full flex-shrink-0 mt-2" />}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button className="w-full text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest py-1 hover:text-gray-700 transition-colors">
          View All Notifications
        </button>
      </div>
    </div>
  );
}

/* ─── Base Stat Card ─── */
function StatCard({ label, main, sub, badge, progress }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
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
function CompetencyRadar() {
  const size = 500;
  const center = size / 2;
  const radius = size / 2 - 80;

  const labels = ['PROBLEM SOLVING', 'ETHICS', 'COMMUNICATION', 'TEAMWORK', 'INQUIRY', 'DESIGN'];
  const values = [0.92, 0.72, 0.88, 0.96, 0.68, 0.78];

  const angles = labels.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 6);

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

  const dataPts = values.map((v, i) => getPoint(v, angles[i]));
  const dataPolygon = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full relative">
      <div className="mb-2">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">OUTCOME PROFICIENCY</p>
        <h3 className="text-[22px] font-extrabold text-gray-900 leading-tight">Core Competencies</h3>
      </div>

      <div className="flex justify-center items-center mt-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Hexagonal web rings - salmon/pink */}
          {levels.map((level, i) => (
            <path
              key={`web-${i}`}
              d={makePath(level)}
              fill={level === 1 ? 'rgba(252,213,213,0.10)' : 'none'}
              stroke="#f9a8a8"
              strokeWidth={level === 1 ? 1.5 : 1}
            />
          ))}

          {/* Data polygon - light gray fill, thick dark-red border */}
          <path
            d={dataPolygon}
            fill="rgba(200,200,200,0.30)"
            stroke="#7a0d0d"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Labels outside each vertex */}
          {angles.map((angle, i) => {
            const dist = radius * 1.3;
            const x = center + dist * Math.cos(angle);
            const y = center + dist * Math.sin(angle);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const anchor = cosA < -0.25 ? 'end' : cosA > 0.25 ? 'start' : 'middle';
            const dy = sinA < -0.7 ? -5 : sinA > 0.7 ? 12 : 4;
            return (
              <text
                key={`lbl-${i}`}
                x={x}
                y={y + dy}
                textAnchor={anchor}
                fill="#6b7280"
                style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.07em', fontFamily: 'inherit' }}
              >
                {labels[i]}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ─── Insight Alert ─── */
function SmartInsight() {
  return (
    <div className="bg-[#1a0505] rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#bc1313] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700" />

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb size={14} className="text-[#bc1313]" />
          <span className="text-[10px] font-bold text-[#bc1313] uppercase tracking-widest">SMART INSIGHT</span>
        </div>

        <p className="text-[20px] font-medium text-white leading-snug mb-3 pr-4">
          "Surpassing target outcomes in <span className="font-bold underline decoration-[#bc1313] decoration-2 underline-offset-4">Quantitative Analysis</span>."
        </p>

        <p className="text-[15px] text-gray-400 font-light leading-relaxed pr-8">
          Recommended: Focus on <span className="text-gray-200">"Software Security"</span> to bridge the gap for Senior Architect role.
        </p>
      </div>

      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-8">
        — AI CAREER ROADMAP HELPER
      </p>
    </div>
  );
}

/* ─── Growth Columns ─── */
function GrowthColumn({ title, threshold, colorClass, borderClass, textClass, badgeClass, items }) {
  return (
    <div className={`bg-white border ${borderClass} rounded-2xl p-6 shadow-sm flex-1`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <h4 className={`text-[11px] font-bold ${textClass} uppercase tracking-widest`}>{title}</h4>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>{threshold}</span>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-gray-700">{item.name}</span>
            <span className="text-[12px] font-bold text-gray-900">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── View Main Component ─── */
export default function StudentPerformanceView() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [semester, setSemester] = useState('All Semesters');
  const [category, setCategory] = useState('All Subjects');
  const [notifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => n.unread).length;
  const hasActiveFilters = semester !== 'All Semesters' || category !== 'All Subjects';

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">STUDENT OVERVIEW</p>
          <h1 className="text-[2.2rem] font-extrabold text-gray-900 leading-tight">Performance Analytics</h1>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {semester !== 'All Semesters' && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-[11px] font-semibold text-gray-700">
                  {semester}
                  <button onClick={() => setSemester('All Semesters')} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </span>
              )}
              {category !== 'All Subjects' && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-[11px] font-semibold text-gray-700">
                  {category}
                  <button onClick={() => setCategory('All Subjects')} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen(!filterOpen); setNotifOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-semibold transition-colors ${
                hasActiveFilters
                  ? 'border-[#1a0505] bg-[#1a0505] text-white hover:bg-[#2a1010]'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} /> Filter
              {hasActiveFilters && (
                <span className="w-4 h-4 bg-white/20 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {(semester !== 'All Semesters' ? 1 : 0) + (category !== 'All Subjects' ? 1 : 0)}
                </span>
              )}
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

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setFilterOpen(false); }}
              className="relative w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Bell size={16} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#bc1313] rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              notifications={notifications}
            />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GLOBAL RANK" main="Top 3%" sub="Institutional Percentile" />
        <StatCard label="AVG. ILO MASTERY" main="88.5%" badge="+1.2%" sub="Growth this month" />
        <StatCard label="SKILLS VELOCITY" main="1.4x" sub="High Momentum" />
        <StatCard label="COMPLETION STATUS" main="94%" sub="" progress="94%" />
      </div>

      {/* Row 2: Radar | Achieved Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompetencyRadar />
        </div>

        {/* Skills Lists Config */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">ACHIEVED SKILLS</p>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[13px] font-semibold text-gray-800">Data Structures</span>
                <span className="text-[9px] font-extrabold bg-[#1a0505] text-white px-2 py-0.5 rounded-full tracking-wider">EXPERT</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[13px] font-semibold text-gray-800">Logic Design</span>
                <span className="text-[9px] font-extrabold bg-[#1a0505] text-white px-2 py-0.5 rounded-full tracking-wider">ADV.</span>
              </div>
            </div>

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">PREDICTED SKILLSETS</p>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-semibold text-gray-800">Machine Learning</span>
                  <span className="text-[10px] text-gray-500 font-medium">80% Confidence</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full"><div className="h-full bg-[#bc1313] rounded-full" style={{ width: '80%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-semibold text-gray-800">Cloud Architecture</span>
                  <span className="text-[10px] text-gray-500 font-medium">65% Confidence</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full"><div className="h-full bg-[#bc1313] rounded-full opacity-70" style={{ width: '65%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Insight | Priority Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartInsight />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">PRIORITY RECOMMENDATIONS</p>
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-600 group-hover:bg-[#bc1313] group-hover:text-white transition-colors duration-300">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Enroll in Advanced Distributed Systems</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Core requirement for Software Engineering Track</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-600 group-hover:bg-[#bc1313] group-hover:text-white transition-colors duration-300">
                <Microscope size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Complete Lab Hours for CS-402</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Required for Practical Certification</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Proficiency Growth Analysis */}
      <div>
        <h3 className="text-[16px] font-bold text-gray-900 mb-4 px-1">Proficiency Growth Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GrowthColumn
            title="HIGH PERFORMING" threshold="90%+"
            borderClass="border-t-4 border-t-green-500 border-x-gray-100 border-b-gray-100" textClass="text-green-700" badgeClass="bg-green-50 text-green-700"
            items={[{ name: 'Artificial Intelligence', val: '98%' }, { name: 'Database Systems', val: '92%' }, { name: 'Academic Writing', val: '90%' }]}
          />
          <GrowthColumn
            title="SATISFACTORY" threshold="70-89%"
            borderClass="border-t-4 border-t-blue-500 border-x-gray-100 border-b-gray-100" textClass="text-blue-700" badgeClass="bg-blue-50 text-blue-700"
            items={[{ name: 'Operating Systems', val: '84%' }, { name: 'Software Engineering', val: '79%' }, { name: 'User Experience', val: '87%' }]}
          />
          <GrowthColumn
            title="AT RISK" threshold="Below 70%"
            borderClass="border-t-4 border-t-red-500 border-x-gray-100 border-b-gray-100" textClass="text-red-700" badgeClass="bg-red-50 text-red-600"
            items={[{ name: 'Discrete Math', val: '68%' }, { name: 'Network Security', val: '72%' }]}
          />
        </div>
      </div>

      {/* Row 5: Detailed Course Mastery Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-bold text-gray-900">Detailed Course Mastery</h3>
          <button
            onClick={() => { setFilterOpen(true); setNotifOpen(false); }}
            className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter size={12} /> {hasActiveFilters ? `${semester !== 'All Semesters' ? semester : ''} ${category !== 'All Subjects' ? category : ''}`.trim() : 'Filter Semester'}
          </button>
        </div>

        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[30%]">MODULE NAME</th>
              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[20%]">SEMESTER</th>
              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%]">GRADE</th>
              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[20%]">MASTERY SCORE</th>
              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[15%]">MAPPED ILOS</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-medium text-gray-800">
            <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-4 font-bold text-gray-900">Computer Science 101</td>
              <td className="py-4 text-gray-500">Spring 2024</td>
              <td className="py-4 font-extrabold">A+</td>
              <td className="py-4 pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full flex-1">
                    <div className="h-full bg-[#1a0505] rounded-full" style={{ width: '98%' }} />
                  </div>
                  <span className="text-[10px] font-bold w-4 text-right">98</span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex gap-1.5">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">ALGORITHM</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">LOGIC</span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-4 font-bold text-gray-900">Distributed Computing</td>
              <td className="py-4 text-gray-500">Spring 2024</td>
              <td className="py-4 font-extrabold">A</td>
              <td className="py-4 pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full flex-1">
                    <div className="h-full bg-[#1a0505] rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-[10px] font-bold w-4 text-right">85</span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex gap-1.5">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">SYSTEMS</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">SCALE</span>
                </div>
              </td>
            </tr>
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-4 font-bold text-gray-900">Ethical Engineering</td>
              <td className="py-4 text-gray-500">Autumn 2023</td>
              <td className="py-4 font-extrabold">B+</td>
              <td className="py-4 pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-full h-1.5 bg-gray-100 rounded-full flex-1">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                  <span className="text-[10px] font-bold w-4 text-right">75</span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex gap-1.5">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">ETHICS</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">LAW</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
