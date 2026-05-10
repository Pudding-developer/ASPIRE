import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Award, BarChart2, CheckCircle2, ChevronRight, Info, TrendingUp, Zap, Compass, Trophy, Star, AlertCircle, GraduationCap } from 'lucide-react';
import { studentService } from '../../../../services/studentService';
/* ─── Shared UI Components ─── */
const Skeleton = () => (
  <div className="p-10 space-y-8 bg-[#f8fafc] min-h-screen animate-pulse">
    <div className="h-8 w-64 bg-gray-200 rounded-md mb-4"></div>
    <div className="h-28 bg-white rounded-xl mb-8 border border-gray-200"></div>
    <div className="h-80 bg-white rounded-xl border border-gray-200"></div>
  </div>
);

const panelBase = 'bg-white rounded-xl border border-gray-200 shadow-sm';

function classifyError(message) {
  const m = String(message || '');
  if (m.startsWith('Unknown course')) return 'unknown_course';
  if (m.startsWith('Not enrolled in')) return 'not_enrolled';
  if (m.startsWith('No scores recorded')) return 'no_scores';
  return 'generic';
}

function CourseFallback({ courseName, kind, message, onBack }) {
  const COPY = {
    unknown_course: {
      title: 'No skill analysis for this course',
      body:
        "This course isn't part of the Computer Engineering skill model — it's typically a general-education or non-technical subject. Your grades are still recorded by your instructor, but skill predictions and competency charts are only generated for CpE technical courses.",
      hint: 'Open a technical course (e.g. Computer Programming, Logic Circuits, Data Structures) to see the full analytics view.',
    },
    not_enrolled: {
      title: 'Not enrolled in this course',
      body:
        "You're not enrolled in any class teaching this course. The course exists in the system, but you haven't joined a section for it.",
      hint: 'Ask your instructor for a class code, or browse Enrolled Classes to confirm your sections.',
    },
    no_scores: {
      title: 'No scores recorded yet',
      body:
        "Your instructor hasn't posted any graded assessments for this course yet. Skill analytics will appear here once at least one ILO has been graded.",
      hint: 'Check back after your next assessment is graded.',
    },
    generic: {
      title: "Couldn't load this course",
      body: message || 'An unexpected error occurred while loading the course details.',
      hint: 'Try again in a moment, or pick a different course.',
    },
  }[kind];

  return (
    <div className="p-8 md:p-12 bg-[#f8fafc] min-h-screen font-sans text-gray-800">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-10 text-[13px] font-semibold tracking-wide"
      >
        <ArrowLeft size={16} /> Return to Overview
      </button>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wider rounded uppercase">
            Course Detail
          </span>
          <span className="text-gray-500 text-[13px] font-medium truncate">{courseName}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className={`${panelBase} p-10`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#70170f]/10 flex items-center justify-center shrink-0">
              <Info size={18} className="text-[#70170f]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-gray-900 tracking-tight mb-2">{COPY.title}</h2>
              <p className="text-[13px] text-gray-600 leading-relaxed">{COPY.body}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-5">
            <p className="text-[12px] text-gray-500 leading-relaxed">{COPY.hint}</p>
          </div>

          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#70170f] text-white rounded-lg text-[12px] font-bold hover:bg-[#4a0e09] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Performance
          </button>
        </div>
      </div>
    </div>
  );
}

function getStanding(avg) {
  const val = parseFloat(avg || 0);
  if (val < 75) return { label: 'NEEDS ATTENTION', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
  if (val < 85) return { label: 'ON TRACK', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
  return { label: 'EXCEEDING', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
}

const ILO_SO_MAP = {
  1: { id: 'SO 1', name: 'Discipline Knowledge' },
  2: { id: 'SO 5', name: 'Problem Analysis' },
  3: { id: 'SO 3', name: 'Design/Dev. of Solutions' },
  4: { id: 'SO 2', name: 'Investigation' }
};

export default function StudentCourseDetailView({ courseName, user, onBack }) {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorKind, setErrorKind] = useState(null);

  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setData(null);
    setAssessments([]);

    Promise.all([
      studentService.getCourseDashboard(courseName),
      studentService.getScores()
    ])
      .then(([dashRes, scoresRes]) => {
        setData(dashRes.data);

        const relevantScores = (scoresRes.data || []).filter(s => s.subject_name === courseName);
        const grouped = {};
        relevantScores.forEach(s => {
          if (!grouped[s.assessment_name]) {
            grouped[s.assessment_name] = {
              name: s.assessment_name,
              type: s.assessment_type,
              submitted_at: s.submitted_at,
              ilos: []
            };
          }
          grouped[s.assessment_name].ilos.push(s);
        });
        setAssessments(Object.values(grouped).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        const msg = err?.message || 'Failed to load course details.';
        setError(msg);
        setErrorKind(classifyError(msg));
        setLoading(false);
      });
  }, [courseName]);

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <CourseFallback
        courseName={courseName}
        kind={errorKind}
        message={error}
        onBack={onBack}
      />
    );
  }
  if (!data) return null;

  // Find top Student Outcome (SO)
  const topSoId = data.so?.scores ? Object.keys(data.so.scores).reduce((a, b) => data.so.scores[a] > data.so.scores[b] ? a : b) : null;
  const topSoIndex = topSoId ? parseInt(topSoId.replace('SO', '')) - 1 : -1;
  const topSoName = topSoIndex >= 0 ? data.so.names[topSoIndex] : 'N/A';
  const topSoScore = topSoId ? data.so.scores[topSoId] : 0;

  return (
    <div className="p-8 md:p-12 bg-[#f8fafc] min-h-screen font-sans text-gray-800">

      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-10 text-[13px] font-semibold tracking-wide">
        <ArrowLeft size={16} /> Returns to Overview
      </button>

      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 bg-[#70170f]/10 text-[#70170f] text-[11px] font-bold tracking-wider rounded uppercase">Course Breakdown</span>
            <span className="text-gray-500 text-[13px] font-medium">{data.course_code} — {data.course}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{data.student_name || user?.full_name || 'Student Profile'}</h1>
        </div>
      </div>





      {/* Main Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-8 w-full mb-10 items-start">

        {/* Left Column: Metrics & Competency Alignment */}
        <div className="w-full xl:w-[45%] flex flex-col gap-8">
          {/* Top: 2 KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${panelBase} p-6 flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Syllabus Mastery</p>
                <Trophy size={18} className="text-[#70170f]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{data.ilo?.weighted_avg?.toFixed(1) || 0}<span className="text-xl font-medium text-gray-400 ml-1">%</span></div>
                <p className="text-[13px] text-gray-500">Course Objective Completion</p>
              </div>
            </div>

            <div className={`${panelBase} p-6 flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Course Standing</p>
                <TrendingUp size={18} className={getStanding(data.ilo?.weighted_avg).color} />
              </div>
              <div>
                <div className={`text-2xl font-bold mb-1 tracking-tight uppercase ${getStanding(data.ilo?.weighted_avg).color}`}>
                  {getStanding(data.ilo?.weighted_avg).label}
                </div>
                <p className="text-[13px] text-gray-500">Current performance level</p>
              </div>
            </div>
          </div>

          {/* Bottom: Syllabus Mastery Breakdown (Moved to Left) */}
          <div className={`${panelBase} p-6 w-full`}>
            <div className="mb-6">
              <h3 className="text-[15px] font-bold text-gray-900">Syllabus Mastery Breakdown</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">Performance across individual learning outcomes</p>
            </div>
            <div className="flex flex-row items-center gap-8">
              <OverallDonut value={data.ilo?.weighted_avg || 0} />
              <div className="flex-1 grid grid-cols-1 gap-y-4">
                {data.ilo?.percentages?.map((val, i) => (
                  <ILOBar key={i} index={i + 1} percentage={val} raw={data.ilo.raw[i]} max={data.ilo.totals[i]} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Competency Alignment (Restructured) */}
        <div className={`${panelBase} p-6 flex-1 xl:flex-none xl:w-[45%]`}>
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-gray-900">Competency Alignment</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">Student Outcomes (SOs) mapped to course ILOs</p>
          </div>
          
          <div className="flex flex-row items-center gap-8">
            <SODonut 
              id="AVG"
              name="Overall Alignment"
              score={data.ilo?.percentages?.reduce((a, b) => a + b, 0) / (data.ilo?.percentages?.length || 1)} 
              size={120}
            />
            
            <div className="flex-1 grid grid-cols-1 gap-y-4">
              {data.ilo?.percentages?.map((val, i) => {
                const so = ILO_SO_MAP[i + 1] || { id: `SO ${i + 1}`, name: 'General Competency' };
                return (
                  <SkillBar 
                    key={i} 
                    name={`${so.id}: ${so.name}`} 
                    score={val} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>



      {/* Trajectory Analysis */}
      <div className={`${panelBase} p-8 mb-10 w-full`}>
        <div className="mb-8">
          <h3 className="text-[16px] font-bold text-gray-900">Outcome Mastery Trajectory</h3>
          <p className="text-[13px] text-gray-500 mt-1">Modeled projection boundaries for aligned program outcomes</p>
        </div>
        <TrajectoryChart
          activeSkills={data.ilo?.percentages?.map((val, i) => {
            const so = ILO_SO_MAP[i + 1] || { id: `SO ${i + 1}`, name: 'General Competency' };
            return { skill: `${so.id}: ${so.name}`, predicted: val };
          })}
          predicted={data.skills?.predicted}
          scenarios={data.trend}
        />
      </div>

      {/* Assessments Section */}
      {assessments.length > 0 && (
        <div className="mb-10 w-full">
          <h3 className="text-[15px] font-bold text-gray-900 mb-5 pl-2">Assessments <span className="text-gray-400 font-normal text-[13px] ml-2">Graded assignments and exams</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, i) => {
              const totalScore = assessment.ilos.reduce((sum, ilo) => sum + ilo.score, 0);
              const totalMax = assessment.ilos.reduce((sum, ilo) => sum + ilo.max_score, 0);
              const isMissing = totalScore === 0;

              return (
                <div key={i} className={`${panelBase} p-6 flex flex-col ${isMissing ? 'opacity-70' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-[14px] font-bold ${isMissing ? 'text-gray-600' : 'text-gray-900'}`}>{assessment.name}</h4>
                        {isMissing && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold tracking-wider rounded uppercase">Missing Data</span>}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mt-1">{assessment.type}</p>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {new Date(assessment.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className={`mt-1 mb-3 flex items-center justify-between p-2.5 rounded-lg border ${isMissing ? 'bg-gray-50 border-gray-100' : 'bg-[#70170f]/5 border-[#70170f]/10'}`}>
                    <span className={`text-[12px] font-bold ${isMissing ? 'text-gray-500' : 'text-[#70170f]'}`}>Total Score</span>
                    <span className={`text-[14px] font-black ${isMissing ? 'text-gray-600' : 'text-gray-900'}`}>
                      {totalScore} <span className="text-[12px] font-semibold text-gray-500">/ {totalMax}</span>
                    </span>
                  </div>

                  <div className="space-y-3 mt-2 border-t border-gray-100 pt-4">
                    {assessment.ilos.sort((a, b) => a.ilo_number - b.ilo_number).map((ilo, j) => (
                      <div key={j} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end">
                          <span className="text-[11px] font-bold text-gray-700">ILO {ilo.ilo_number}</span>
                          <span className="text-[11px] font-semibold text-gray-500"><span className="text-gray-900">{ilo.score}</span> / {ilo.max_score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isMissing ? 'bg-gray-300' : 'bg-[#70170f]'}`} style={{ width: `${Math.min(ilo.percentage, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Insights Row */}
      <div className="flex flex-col lg:flex-row gap-6 w-full pb-8">
        <div className={`${panelBase} p-8 w-full lg:w-[45%]`}>
          <h3 className="text-[14px] font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Leading Attributes</h3>
          <div className="space-y-4">
            {Object.entries(data.skills?.predicted || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name, val], i) => (
                <div key={i} className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-600 font-medium">{name}</span>
                  <span className="font-semibold text-emerald-600">{val.toFixed(1)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className={`${panelBase} p-8 w-full lg:w-[45%]`}>
          <h3 className="text-[14px] font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Focus Areas</h3>
          <div className="space-y-4">
            {Object.entries(data.skills?.predicted || {})
              .sort((a, b) => a[1] - b[1])
              .slice(0, 3)
              .map(([name, val], i) => (
                <div key={i} className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-600 font-medium">{name}</span>
                  <span className="font-semibold text-[#70170f]">{val.toFixed(1)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// Subcomponents

function OverallDonut({ value }) {
  const size = 100; // Even smaller for 'fitted' look
  const strokeW = 10;
  const rad = (size - strokeW) / 2;
  const circum = 2 * Math.PI * rad;
  const fillPct = (value / 100) * circum;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={rad} fill="#f8fafc" stroke="#f1f5f9" strokeWidth={strokeW} />
        <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#70170f" strokeWidth={strokeW}
          strokeDasharray={circum} strokeDashoffset={circum - fillPct} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{value.toFixed(0)}<span className="text-sm text-gray-500 font-medium ml-0.5">%</span></span>
      </div>
    </div>
  );
}

function ILOBar({ index, percentage, raw, max }) {
  let fillClr = 'bg-red-500';
  if (percentage >= 85) fillClr = 'bg-green-500';
  else if (percentage >= 75) fillClr = 'bg-orange-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[12px] font-bold text-gray-700">ILO {index}</span>
        <span className="text-[12px] text-gray-500 font-medium px-2"><span className="text-gray-900">{raw}</span> / {max}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${fillClr} rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function SODonut({ id, name, score, size = 90 }) {
  const strokeW = size * 0.09; // Scale stroke width with size
  const rad = (size - strokeW) / 2;
  const circum = 2 * Math.PI * rad;
  const fillPct = (Math.min(score, 100) / 100) * circum;

  let color = '#ef4444'; // Red
  if (score >= 85) color = '#22c55e'; // Green
  else if (score >= 75) color = '#f97316'; // Orange

  return (
    <div className="flex flex-col items-center w-full max-w-[140px]">
      <div className="relative mb-3" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base Background */}
          <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
          
          {/* Segmented Track Highlights (Subtle) */}
          {/* Red Zone (0-75) */}
          <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#fee2e2" strokeWidth={strokeW}
            strokeDasharray={`${circum * 0.75} ${circum * 0.25}`} strokeDashoffset={0} />
          {/* Orange Zone (75-85) */}
          <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#ffedd5" strokeWidth={strokeW}
            strokeDasharray={`${circum * 0.10} ${circum * 0.90}`} strokeDashoffset={-circum * 0.75} />
          {/* Green Zone (85-100) */}
          <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#dcfce7" strokeWidth={strokeW}
            strokeDasharray={`${circum * 0.15} ${circum * 0.85}`} strokeDashoffset={-circum * 0.85} />

          {/* Actual Score Indicator */}
          <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={color} strokeWidth={strokeW}
            strokeDasharray={circum} strokeDashoffset={circum - fillPct} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">{id}</span>
          <span className="text-[15px] font-black text-gray-900 leading-none">{score.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-700 text-center leading-tight line-clamp-2">{name}</p>
    </div>
  );
}

function SkillBar({ name, score }) {
  const pct = Math.min(score, 100) / 100;

  let fillClr = 'bg-red-500';
  if (score >= 85) fillClr = 'bg-green-500';
  else if (score >= 75) fillClr = 'bg-orange-500';

  return (
    <div className="w-full min-w-0">
      <div className="flex justify-between items-end mb-2 gap-4">
        <h4 className="text-[13px] font-semibold text-gray-800 truncate flex-1 leading-none pb-0.5">{name}</h4>
        <span className="text-[13px] font-bold text-gray-900 shrink-0 whitespace-nowrap leading-none pb-0.5">{score.toFixed(1)}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full relative overflow-hidden">
        <div className={`absolute top-0 left-0 h-full rounded-full ${fillClr}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}



// Chart mapping trajectory lines
function TrajectoryChart({ activeSkills, predicted, scenarios }) {
  if (!activeSkills || activeSkills.length === 0) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Not enough data to plot</div>;

  const w = 1000;
  const h = 250;

  // X coords for each skill
  const points = activeSkills.map((s, i) => ({
    x: (i / (activeSkills.length - 1 || 1)) * w, // internal SVG coordinate
    pctX: (i / (activeSkills.length - 1 || 1)) * 100, // percentage for absolute positioning
    skill: s.skill,
    cur: predicted[s.skill] || 0,
    low: scenarios?.scenario_low?.[s.skill] || 0,
    high: scenarios?.scenario_high?.[s.skill] || 0
  }));

  const maxVal = Math.max(...points.map(p => Math.max(p.cur, p.low, p.high)), 100);
  // Padding for labels
  const scaleY = (val) => h - (val / maxVal) * (h - 40) - 20;

  const makePath = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${scaleY(p[key])}`).join(' ');

  return (
    <div className="w-full relative rounded-xl overflow-hidden pb-16 pt-6 bg-white">
      <div className="w-full relative" style={{ height: h }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="absolute top-0 left-0" preserveAspectRatio="none">
          {/* Minimal Grid */}
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1="0" y1={h / 4} x2={w} y2={h / 4} stroke="#f1f5f9" strokeDasharray="4" strokeWidth="1" />
          <line x1="0" y1={(3 * h) / 4} x2={w} y2={(3 * h) / 4} stroke="#f1f5f9" strokeDasharray="4" strokeWidth="1" />

          {/* Flat Fill Area */}
          <path d={`${makePath('high')} L ${w} ${scaleY(0)} L 0 ${scaleY(0)} Z`} fill="rgba(241, 245, 249, 0.4)" />

          {/* Professional Lines */}
          <path d={makePath('low')} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 6" />
          <path d={makePath('cur')} fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <path d={makePath('high')} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 6" />
        </svg>

        {/* Render Clean Data Dots */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            {/* Main Value Indicator */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-[#0f172a] z-20" style={{ left: `calc(${p.pctX}% - 5px)`, top: `${scaleY(p.cur) - 5}px` }} />

            {/* Range Dots */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-gray-300 z-10" style={{ left: `calc(${p.pctX}% - 3px)`, top: `${scaleY(p.low) - 3}px` }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 z-10" style={{ left: `calc(${p.pctX}% - 3px)`, top: `${scaleY(p.high) - 3}px` }} />

            {/* Data Label */}
            <div className="absolute z-30" style={{ left: `calc(${p.pctX}% - 20px)`, top: `${scaleY(p.cur) - 24}px`, width: '40px', textAlign: 'center' }}>
              <span className="text-gray-800 text-[11px] font-bold">
                {p.cur.toFixed(0)}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Structural Legend */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center gap-8 text-[12px] font-medium text-gray-600 z-10">
        <div className="flex items-center gap-2.5"><div className="w-3 h-0 border-t-2 border-gray-300 border-dashed" /> Low Bound</div>
        <div className="flex items-center gap-2.5"><div className="w-3 h-0.5 bg-gray-900" /> Modeled Mean</div>
        <div className="flex items-center gap-2.5"><div className="w-3 h-0 border-t-2 border-emerald-400 border-dashed" /> High Bound</div>
      </div>
    </div>
  );
}
