import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Award, BarChart2, CheckCircle2, ChevronRight } from 'lucide-react';
import { studentService } from '../../../../services/studentService';
import SkillInterventions from '../components/SkillInterventions';

/* ─── Shared UI Components ─── */
const Skeleton = () => (
  <div className="p-10 space-y-8 bg-[#f8fafc] min-h-screen animate-pulse">
    <div className="h-8 w-64 bg-gray-200 rounded-md mb-4"></div>
    <div className="h-28 bg-white rounded-xl mb-8 border border-gray-200"></div>
    <div className="h-80 bg-white rounded-xl border border-gray-200"></div>
  </div>
);

const panelBase = 'bg-white rounded-xl border border-gray-200 shadow-sm';

export default function StudentCourseDetailView({ courseName, user, interventions, interventionsUpdatedAt, onBack }) {
  const courseInterventions = (interventions || []).filter(i => i.subject_name === courseName);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentService.getCourseDashboard(courseName)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err?.message || "Failed to load course details.");
        setLoading(false);
      });
  }, [courseName]);

  if (loading) return <Skeleton />;
  if (error) return <div className="p-8 text-red-500">{error} <button onClick={onBack} className="ml-4 underline">Go Back</button></div>;
  if (!data) return null;

  return (
    <div className="p-8 md:p-12 bg-[#f8fafc] min-h-screen font-sans text-gray-800">
      
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-10 text-[13px] font-semibold tracking-wide">
        <ArrowLeft size={16} /> Returns to Overview
      </button>

      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 bg-[#bc1313]/10 text-[#bc1313] text-[11px] font-bold tracking-wider rounded uppercase">Course Analytics</span>
            <span className="text-gray-500 text-[13px] font-medium">{data.course_code} — {data.course}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{data.student_name || user?.full_name || 'Student Profile'}</h1>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className={`${panelBase} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
             <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Weighted Avg</p>
             <Target size={18} className="text-[#bc1313]" />
          </div>
          <div>
             <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{data.ilo?.weighted_avg?.toFixed(1) || 0}<span className="text-xl font-medium text-gray-400 ml-1">%</span></div>
             <p className="text-[13px] text-gray-500">Overall Course Performance</p>
          </div>
        </div>
        
        <div className={`${panelBase} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
             <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Peak Competency</p>
             <Award size={18} className="text-emerald-600" />
          </div>
          <div>
             <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{data.skills?.predicted?.[data.skills?.strongest] || 0}</div>
             <p className="text-[13px] text-gray-500 truncate" title={data.skills?.strongest}>{data.skills?.strongest || 'N/A'}</p>
          </div>
        </div>

        <div className={`${panelBase} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
             <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Skills Tracked</p>
             <BarChart2 size={18} className="text-blue-600" />
          </div>
          <div>
             <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{data.skills?.active?.length || 0}</div>
             <p className="text-[13px] text-gray-500">Active dimensions evaluated</p>
          </div>
        </div>

        <div className={`${panelBase} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
             <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">Validation (CV R²)</p>
             <CheckCircle2 size={18} className="text-indigo-600" />
          </div>
          <div>
             <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{(data.model?.cv_r2_mean * 100).toFixed(1)}<span className="text-xl font-medium text-gray-400 ml-1">%</span></div>
             <p className="text-[13px] text-gray-500 mt-1">Algorithmic Confidence</p>
          </div>
        </div>
      </div>

      {/* Skill Interventions for this course */}
      <div className={`${panelBase} p-8 mb-10 w-full`}>
        <SkillInterventions
          interventions={courseInterventions}
          updatedAt={interventionsUpdatedAt}
        />
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col xl:flex-row gap-8 w-full mb-10">
        
        {/* Left: ILO Status */}
        <div className={`${panelBase} p-8 w-full xl:w-[35%] shrink-0`}>
          <div className="mb-8">
            <h3 className="text-[16px] font-bold text-gray-900">Learning Outcome Attainment</h3>
            <p className="text-[13px] text-gray-500 mt-1">Aggregated mastery across published course ILOs</p>
          </div>
          <div className="flex justify-center mb-10">
            <OverallDonut value={data.ilo?.weighted_avg || 0} />
          </div>
          <div className="space-y-6">
            {data.ilo?.percentages?.map((val, i) => (
              <ILOBar key={i} index={i+1} percentage={val} raw={data.ilo.raw[i]} max={data.ilo.totals[i]} />
            ))}
          </div>
        </div>

        {/* Right: Active Developing Skills */}
        <div className={`${panelBase} p-8 flex-1 w-full`}>
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">Mapped Competencies</h3>
              <p className="text-[13px] text-gray-500 mt-1">Granular scoring across all active skill dimensions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-7 w-full overflow-hidden">
            {data.skills?.active?.map((skill, i) => (
              <SkillBar key={i} name={skill.skill} score={skill.predicted} />
            ))}
          </div>
        </div>
      </div>

      {/* Excelled Sub-Skills Row */}
      <div className="mb-10 w-full">
        <h3 className="text-[15px] font-bold text-gray-900 mb-5 pl-2">Top Excelling Dimensions <span className="text-gray-400 font-normal text-[13px] ml-2">Highest algorithmic predictors</span></h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           {data.skills?.top_excelled?.map((skill, i) => (
             <div key={i} className={`${panelBase} p-6 flex flex-col items-center justify-center`}>
                <ExcelledSkillDonut rank={i+1} skillName={skill.skill} score={skill.predicted} />
             </div>
           ))}
        </div>
      </div>

      {/* Trajectory Analysis */}
      <div className={`${panelBase} p-8 mb-10 w-full`}>
        <div className="mb-8">
          <h3 className="text-[16px] font-bold text-gray-900">Longitudinal Skill Trajectory</h3>
          <p className="text-[13px] text-gray-500 mt-1">Modeled projection boundaries for the current student</p>
        </div>
        <TrajectoryChart activeSkills={data.skills?.active} predicted={data.skills?.predicted} scenarios={data.trend} />
      </div>

      {/* Key Insights Row */}
      <div className="flex flex-col lg:flex-row gap-6 w-full pb-8">
        <div className={`${panelBase} p-8 w-full lg:w-[45%]`}>
           <h3 className="text-[14px] font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Leading Attributes</h3>
           <div className="space-y-4">
             {Object.entries(data.skills?.predicted || {})
                .sort((a,b) => b[1] - a[1])
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
                .sort((a,b) => a[1] - b[1])
                .slice(0, 3)
                .map(([name, val], i) => (
                  <div key={i} className="flex justify-between items-center text-[13px]">
                     <span className="text-gray-600 font-medium">{name}</span>
                     <span className="font-semibold text-[#bc1313]">{val.toFixed(1)}</span>
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
  const size = 180;
  const strokeW = 16;
  const rad = (size - strokeW) / 2;
  const circum = 2 * Math.PI * rad;
  const fillPct = (value / 100) * circum;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={rad} fill="#f8fafc" stroke="#f1f5f9" strokeWidth={strokeW} />
        <circle cx={size/2} cy={size/2} r={rad} fill="none" stroke="#bc1313" strokeWidth={strokeW}
                strokeDasharray={circum} strokeDashoffset={circum - fillPct} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{value.toFixed(0)}<span className="text-xl text-gray-500 font-medium ml-0.5">%</span></span>
      </div>
    </div>
  );
}

function ILOBar({ index, percentage, raw, max }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[12px] font-bold text-gray-700">ILO {index}</span>
        <span className="text-[12px] text-gray-500 font-medium px-2"><span className="text-gray-900">{raw}</span> / {max}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-800 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function SkillBar({ name, score }) {
  const pct = Math.min(score, 100) / 100;
  
  let fillClr = 'bg-gray-400';
  if (score >= 70) fillClr = 'bg-emerald-500';
  else if (score <= 40) fillClr = 'bg-amber-600';
  else if (score >= 50) fillClr = 'bg-gray-800';

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

function ExcelledSkillDonut({ rank, skillName, score }) {
  const size = 96;
  const strokeW = 10;
  const rad = (size - strokeW) / 2;
  const circum = 2 * Math.PI * rad;
  const fillPct = (Math.min(score, 100) / 100) * circum;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative mb-4" style={{ width: size, height: size }}>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-100 text-gray-700 border border-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold z-10">{rank}</div>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={rad} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
          <circle cx={size/2} cy={size/2} r={rad} fill="none" stroke="#0f172a" strokeWidth={strokeW}
                  strokeDasharray={circum} strokeDashoffset={circum - fillPct} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{score.toFixed(0)}</span>
        </div>
      </div>
      <p className="text-[12px] font-medium text-gray-700 text-center leading-snug w-full line-clamp-2">{skillName}</p>
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
            <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1={h/4} x2={w} y2={h/4} stroke="#f1f5f9" strokeDasharray="4" strokeWidth="1" />
            <line x1="0" y1={(3*h)/4} x2={w} y2={(3*h)/4} stroke="#f1f5f9" strokeDasharray="4" strokeWidth="1" />
            
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
