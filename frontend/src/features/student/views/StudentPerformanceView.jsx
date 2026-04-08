import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen
} from 'lucide-react';

import useStudentData from '../hooks/useStudentData';

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

/* ─── Notification Dropdown ─── */
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
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No new notifications.</div>
        ) : (
          notifications.map(n => (
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
          ))
        )}
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
function CompetencyRadar({ skills }) {
  if (!skills || Object.keys(skills).length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full flex items-center justify-center">
        <p className="text-gray-400 font-medium">Insufficient data for competency tracking</p>
      </div>
    );
  }

  // Pick top 6 skills
  const sortedSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]).slice(0, 6);
  // Pad if less than 3
  while (sortedSkills.length < 3) sortedSkills.push(['Pending Data', 0]);

  const labels = sortedSkills.map(s => s[0].toUpperCase().substring(0, 15));
  // Normalize score up to max 100
  const values = sortedSkills.map(s => Math.min(Math.max((s[1] || 0) / 100, 0), 1));

  const size = 500;
  const center = size / 2;
  const radius = size / 2 - 80;

  const angles = labels.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / labels.length);

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
          {levels.map((level, i) => (
            <path
              key={`web-${i}`}
              d={makePath(level)}
              fill={level === 1 ? 'rgba(252,213,213,0.10)' : 'none'}
              stroke="#f9a8a8"
              strokeWidth={level === 1 ? 1.5 : 1}
            />
          ))}

          <path
            d={dataPolygon}
            fill="rgba(200,200,200,0.30)"
            stroke="#7a0d0d"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

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
function SmartInsight({ topSkills, weakSkills }) {
  const top = topSkills?.[0] || 'Unknown Skill';
  const weak = weakSkills?.[0] || 'Unknown Skill';

  return (
    <div className="bg-[#1a0505] rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#bc1313] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700" />

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb size={14} className="text-[#bc1313]" />
          <span className="text-[10px] font-bold text-[#bc1313] uppercase tracking-widest">SMART INSIGHT</span>
        </div>

        <p className="text-[20px] font-medium text-white leading-snug mb-3 pr-4">
          "Surpassing target outcomes in <span className="font-bold underline decoration-[#bc1313] decoration-2 underline-offset-4">{top}</span>."
        </p>

        <p className="text-[15px] text-gray-400 font-light leading-relaxed pr-8">
          Recommended: Focus on <span className="text-gray-200">"{weak}"</span> to bridge the gap in your overall competency profile.
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
        {items.length === 0 ? <p className="text-xs text-gray-400 font-medium">None</p> : items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-gray-700 truncate mr-2" title={item.name}>{item.name}</span>
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

  const { scores, classes, predictions, iloCoverage, loading } = useStudentData();
  const notifications = []; // Mock left empty as requested dynamically
  const unreadCount = 0;

  if (loading) {
    return <div className="p-8 text-gray-500 font-semibold flex justify-center items-center h-full">Loading Analytics...</div>;
  }

  const hasActiveFilters = semester !== 'All Semesters' || category !== 'All Subjects';

  // Group classes to display in table
  const courseMap = {};
  classes.forEach(c => {
    courseMap[c.id] = { ...c, totalScore: 0, count: 0, ilos: new Set() };
  });

  scores.forEach(s => {
    if (courseMap[s.class_id]) {
      courseMap[s.class_id].totalScore += s.percentage;
      courseMap[s.class_id].count += 1;
      courseMap[s.class_id].ilos.add(`ILO${s.ilo_number}`);
    } else {
       // Class not in classes array (edge case)
       courseMap[s.class_id] = { 
         subject_name: s.subject_name,
         semester: 'Unknown',
         totalScore: s.percentage,
         count: 1, 
         ilos: new Set([`ILO${s.ilo_number}`])
       };
    }
  });

  const tableData = Object.values(courseMap).filter(c => c.count > 0).map(c => {
    const avg = c.count ? Math.round(c.totalScore / c.count) : 0;
    return {
      ...c,
      avgScore: avg,
      gradeLetter: avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F'
    };
  });

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
        <StatCard label="GLOBAL RANK" main={predictions?.overall_outcome ? "Model Fit" : "N/A"} sub={predictions?.overall_outcome} />
        <StatCard label="AVG. ILO MASTERY" main={`${iloCoverage.totalMastery || 0}%`} badge={null} sub="Current mastery" />
        <StatCard label="SKILLS VELOCITY" main={HighPerforming.length} sub="High Momentum Skills" />
        <StatCard label="COMPLETION STATUS" main="Enrolled" sub={`${classes.length} classes active`} progress="60%" />
      </div>

      {/* Row 2: Radar | Achieved Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CompetencyRadar skills={predictions?.aggregated_skills} />
        </div>

        {/* Skills Lists Config */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">ACHIEVED SKILLS</p>
            <div className="space-y-4 mb-8">
              {HighPerforming.slice(0, 3).map(skill => (
                <div key={skill.name} className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-[13px] font-semibold text-gray-800 truncate mr-2">{skill.name}</span>
                  <span className="text-[9px] font-extrabold bg-[#1a0505] text-white px-2 py-0.5 rounded-full tracking-wider">EXPERT</span>
                </div>
              ))}
              {HighPerforming.length === 0 && <p className="text-xs text-gray-400">None achieved yet.</p>}
            </div>

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">PREDICTED SKILLSETS</p>
            <div className="space-y-5">
              {Satisfactory.slice(0, 3).map(skill => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-semibold text-gray-800 truncate mr-2">{skill.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{skill.val} Confidence</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full"><div className="h-full bg-[#bc1313] rounded-full" style={{ width: skill.val }} /></div>
                </div>
              ))}
              {Satisfactory.length === 0 && <p className="text-xs text-gray-400">Not enough data.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Insight | Priority Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartInsight topSkills={predictions?.top_skills} weakSkills={predictions?.weak_skills} />
        
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">PRIORITY RECOMMENDATIONS</p>
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-600 group-hover:bg-[#bc1313] group-hover:text-white transition-colors duration-300">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Focus on missing assignments</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Improve grade consistency.</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
            </div>

            <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 hover:border-gray-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-600 group-hover:bg-[#bc1313] group-hover:text-white transition-colors duration-300">
                <Microscope size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-gray-900 leading-snug">Practice weak skills</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Review the concepts you missed in midterms.</p>
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
            items={HighPerforming}
          />
          <GrowthColumn
            title="SATISFACTORY" threshold="70-89%"
            borderClass="border-t-4 border-t-blue-500 border-x-gray-100 border-b-gray-100" textClass="text-blue-700" badgeClass="bg-blue-50 text-blue-700"
            items={Satisfactory}
          />
          <GrowthColumn
            title="AT RISK" threshold="Below 70%"
            borderClass="border-t-4 border-t-red-500 border-x-gray-100 border-b-gray-100" textClass="text-red-700" badgeClass="bg-red-50 text-red-600"
            items={AtRisk}
          />
        </div>
      </div>

      {/* Row 5: Detailed Course Mastery Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-bold text-gray-900">Detailed Course Mastery</h3>
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
            {tableData.length === 0 ? (
               <tr><td colSpan="5" className="py-4 text-center text-gray-500">No grades recorded yet.</td></tr>
            ) : tableData.map(c => (
              <tr key={c.id || c.subject_name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-4 font-bold text-gray-900">{c.subject_name}</td>
                <td className="py-4 text-gray-500">{c.semester || 'N/A'}</td>
                <td className="py-4 font-extrabold">{c.gradeLetter}</td>
                <td className="py-4 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full flex-1">
                      <div className="h-full bg-[#1a0505] rounded-full" style={{ width: `${Math.min(c.avgScore, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-bold w-4 text-right">{c.avgScore}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from(c.ilos).map(ilo => (
                      <span key={ilo} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded">{ilo}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
