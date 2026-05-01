import React, { useState, useRef, useEffect } from 'react';
import {
  Filter, Bell, Lightbulb, GraduationCap, Microscope,
  ChevronRight, AlertCircle, CheckCircle2, ChevronDown, X, BookOpen, ArrowLeft
} from 'lucide-react';

import useStudentData from '../../dashboard/hooks/useStudentData';
import useInterventions from '../hooks/useInterventions';
import { StudentPerformanceSkeleton } from '../../shared/StudentPageSkeletons';
import StudentCourseDetailView from './StudentCourseDetailView';

const panelBase = 'bg-gradient-to-br from-white via-[#fffbfb] to-[#fcf4f2] border border-[#eed7d3] rounded-2xl shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)]';

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
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-linear-to-br from-white via-[#fff9f9] to-[#fcf4f2] border border-[#efd4d4] rounded-2xl shadow-[0_20px_40px_-24px_rgba(188,19,19,0.45)] z-50 p-5 space-y-5">
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
                semester === s ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-[#fff5f5]'
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
                category === c ? 'bg-[#1a0505] text-white' : 'text-gray-700 hover:bg-[#fff5f5]'
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
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-linear-to-br from-white via-[#fff9f9] to-[#fcf4f2] border border-[#efd4d4] rounded-2xl shadow-[0_20px_40px_-24px_rgba(188,19,19,0.45)] z-50 overflow-hidden">
      <div className="p-4 border-b border-[#f2dfdf] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[12px] font-bold text-gray-900">Score Updates</h4>
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
          notifications.map(n => (
            <div key={n.id} className={`p-4 border-b border-[#f8ebeb] hover:bg-[#fff5f5]/70 transition-colors cursor-pointer ${n.unread ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.unread ? 'bg-[#70170f]/10 text-[#70170f]' : 'bg-gray-100 text-gray-400'}`}>
                  <BookOpen size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-900 leading-snug">{n.instructor}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.subject} &middot; {n.time}</p>
                </div>
                {n.unread && <span className="w-2 h-2 bg-[#70170f] rounded-full shrink-0 mt-2" />}
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
function CompetencyRadar({ skills }) {
  if (!skills || Object.keys(skills).length === 0) {
    return (
      <div className={`${panelBase} p-6 h-full flex items-center justify-center`}>
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
    <div className={`${panelBase} p-6 h-full relative`}>
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
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#70170f] opacity-5 blur-[100px] rounded-full group-hover:opacity-10 transition-opacity duration-700" />

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb size={14} className="text-[#70170f]" />
          <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-widest">SMART INSIGHT</span>
        </div>

        <p className="text-[20px] font-medium text-white leading-snug mb-3 pr-4">
          "Surpassing target outcomes in <span className="font-bold underline decoration-[#70170f] decoration-2 underline-offset-4">{top}</span>."
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

/* ─── Outcome Badge helpers ─── */
const OUTCOME_STYLES = {
  'EXCEEDING EXPECTATIONS': 'bg-green-50 text-green-700 border-green-200',
  'ON TRACK':               'bg-blue-50 text-blue-700 border-blue-200',
  'NEEDS ATTENTION':        'bg-amber-50 text-amber-700 border-amber-200',
  'CRITICAL':               'bg-red-50 text-red-700 border-red-200',
};
function outcomeChipClass(label) {
  if (!label) return 'bg-gray-50 text-gray-600 border-gray-200';
  const key = label.toUpperCase();
  return OUTCOME_STYLES[key] || 'bg-gray-50 text-gray-600 border-gray-200';
}

/* ─── Expandable Course Card ─── */
function CourseBreakdownCard({ course, onViewDetails }) {
  const [open, setOpen] = useState(false);

  const ilos      = course.ilo_scores || {};
  const iloKeys   = Object.keys(ilos).sort();
  const skills    = course.predicted_skills || {};

  const mastery   = Math.round(course.ilo_avg || 0);
  const strongest = course.strongest_skill;
  const weakest   = course.weakest_skill;

  const potentialSkill = strongest;
  const potentialNew   = course.scenario_high?.[potentialSkill];
  const potentialNow   = skills[potentialSkill];
  const showPotential  =
    potentialSkill && typeof potentialNew === 'number' && typeof potentialNow === 'number';

  return (
    <div className="border border-[#f0dddd] rounded-2xl bg-white/75 overflow-hidden transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(188,19,19,0.45)]">
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

function MlInsightCard({ topSkill, topVal, weakSkill, weakVal, target }) {
  const aboveOrBelow = topVal != null && topVal >= target ? 'above' : 'below';
  const fmt = (v) => (v != null ? v.toFixed(1) : '—');
  return (
    <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: '#0d0101' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#70170f]" />
        <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-widest">ML Insight</span>
      </div>
      <p className="text-[13px] text-gray-100 leading-relaxed mb-3">
        <span className="font-bold">{topSkill || 'No data'}</span> is your highest-scoring skill at{' '}
        <span className="font-bold">{fmt(topVal)}</span> — {aboveOrBelow} course target.
      </p>
      <p className="text-[13px] text-gray-300 leading-relaxed">
        <span className="font-bold">{weakSkill || 'No data'}</span> has the widest gap at{' '}
        <span className="font-bold">{fmt(weakVal)}</span> — flagged as highest priority.
      </p>
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
  const notifications = []; // Mock left empty as requested dynamically
  const unreadCount = 0;

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

  return (
    <div className="p-8 space-y-6 bg-linear-to-br from-[#fff8f8] via-[#fffdfd] to-[#fdf2f2] rounded-3xl border border-[#f2dfdf] shadow-[0_22px_55px_-35px_rgba(188,19,19,0.35)]">

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
                <span className="flex items-center gap-1 px-2.5 py-1 bg-[#fff1f1] border border-[#efd7d7] rounded-lg text-[11px] font-semibold text-[#6e4b4b]">
                  {semester}
                  <button onClick={() => setSemester('All Semesters')} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </span>
              )}
              {category !== 'All Subjects' && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-[#fff1f1] border border-[#efd7d7] rounded-lg text-[11px] font-semibold text-[#6e4b4b]">
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
                    : 'border-[#ead3d3] text-[#7a5454] hover:bg-[#fff5f5]'
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
              className="relative w-9 h-9 border border-[#ead3d3] rounded-xl flex items-center justify-center hover:bg-[#fff5f5] transition-colors"
            >
              <Bell size={16} className="text-[#8b6363]" />
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

        {/* Skills Lists — ML-driven */}
        <div className={`${panelBase} p-6 flex flex-col h-full`}>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">ACHIEVED SKILLS</p>
            <div className="space-y-4 mb-8">
              {topThird.slice(0, 3).map(([name, val]) => {
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
                      <span className="text-[10px] font-extrabold bg-[#1a0505] text-white px-2 py-0.5 rounded-full tracking-wider shrink-0 tabular-nums">
                        {val.toFixed(1)}
                      </span>
                    }
                  />
                );
              })}
              {topThird.length === 0 && <p className="text-xs text-gray-400">None achieved yet.</p>}
            </div>

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-5">PREDICTED SKILLSETS</p>
            <div className="space-y-5">
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
                      <span className="text-[10px] text-gray-500 font-medium tabular-nums shrink-0">
                        +{s.gap.toFixed(1)} potential
                      </span>
                    }
                    barNode={
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-[#70170f] rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                    }
                  />
                );
              })}
              {predictedPotential.length === 0 && <p className="text-xs text-gray-400">Not enough data.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Insight | Priority Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartInsight topSkills={predictions?.top_skills} weakSkills={predictions?.weak_skills} />
        
        <div className={`${panelBase} p-6 flex flex-col justify-center`}>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">PRIORITY RECOMMENDATIONS</p>
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
          </div>
        </div>
      </div>

      {/* Row 4: Proficiency Growth Analysis */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 leading-tight">Proficiency Growth Analysis</h3>
            <p className="text-[11px] text-gray-500 font-medium mt-1">
              All {skillsTotal} skill categor{skillsTotal === 1 ? 'y' : 'ies'} · ranked by score · relative performance
            </p>
          </div>
          <GrowthLegend />
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-green-600 leading-none tabular-nums">{topThird.length}</span>
            <span className="text-[12px] font-semibold text-gray-600">top performing</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-amber-500 leading-none tabular-nums">{midThird.length}</span>
            <span className="text-[12px] font-semibold text-gray-600">developing</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-baseline gap-2">
            <span className="text-[26px] font-extrabold text-red-600 leading-none tabular-nums">{botThird.length}</span>
            <span className="text-[12px] font-semibold text-gray-600">needs focus</span>
          </div>
        </div>

        {/* Two-part layout: ranked chart left, ILO + ML insight right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RankedSkillsChart sortedSkills={sortedSkills} third={skillsThird} animated={barsAnimated} />
          </div>
          <div className="space-y-4">
            <IloBreakdownCard iloScores={overallIlo} />
            <MlInsightCard
              topSkill={topSkillName}
              topVal={topSkillVal}
              weakSkill={weakSkillName}
              weakVal={weakSkillVal}
              target={skillAvg}
            />
          </div>
        </div>
      </div>

      {/* Row 5: Course Breakdown — expandable cards driven by predictions.per_course */}
      <div className={`${panelBase} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PER-COURSE ANALYSIS</p>
            <h3 className="text-[16px] font-bold text-gray-900">Course Breakdown</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            {(predictions?.per_course?.length || 0)} course{(predictions?.per_course?.length || 0) === 1 ? '' : 's'}
          </span>
        </div>

        {(!predictions?.per_course || predictions.per_course.length === 0) ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            No course predictions available yet. Submit assessment scores to see your breakdown.
          </div>
        ) : (
          <div className="space-y-3">
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
  );
}
