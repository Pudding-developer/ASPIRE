import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Award, BarChart2, CheckCircle2, ChevronRight, Info, TrendingUp, Zap, Compass, Trophy, Star, AlertCircle, GraduationCap, Sparkles } from 'lucide-react';
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
  if (val >= 90) return { label: 'EXCEPTIONAL', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  if (val >= 75) return { label: 'COMPETENT', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
  return { label: 'NEEDS ATTENTION', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
}

const SO_NAMES = {
  1: "Discipline Knowledge",
  2: "Investigation",
  3: "Design/Dev. of Solutions",
  4: "Leadership",
  5: "Problem Analysis",
  6: "Ethics",
  7: "Communication",
  8: "Environment",
  9: "Lifelong Learning",
  10: "Engineering & Society",
  11: "Modern Tools",
  12: "Project Management",
  13: "Social Responsibility",
};

const COURSE_ILO_SO_MAP = {
  "ENGG 401": {
    1: [{ so: 5, pi: "R" }, { so: 13, pi: "I" }],
    2: [{ so: 3, pi: "I" }, { so: 10, pi: "I" }, { so: 10, pi: "R" }, { so: 11, pi: "R" }],
    3: [{ so: 3, pi: "I" }, { so: 10, pi: "I" }, { so: 10, pi: "R" }, { so: 11, pi: "R" }],
  },
  "GEd 101": {
    1: [{ so: 9, pi: "R" }],
    2: [{ so: 7, pi: "R" }, { so: 9, pi: "R" }],
    3: [{ so: 7, pi: "R" }, { so: 9, pi: "R" }],
  },
  "GEd 102": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 1, pi: "I" }],
    3: [{ so: 1, pi: "I" }],
  },
  "GEd 105": {
    1: [{ so: 9, pi: "I" }, { so: 10, pi: "I" }],
    2: [{ so: 10, pi: "I" }, { so: 13, pi: "I" }],
    3: [{ so: 13, pi: "I" }],
  },
  "GEd 106": {
    1: [{ so: 6, pi: "R" }],
    2: [{ so: 6, pi: "R" }, { so: 7, pi: "R" }],
    3: [{ so: 6, pi: "R" }],
  },
  "MATH 401": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 1, pi: "I" }],
    3: [{ so: 1, pi: "I" }],
    4: [{ so: 1, pi: "I" }],
  },
  "SCl 401": {
    1: [{ so: 1, pi: "I" }, { so: 5, pi: "I" }],
    2: [{ so: 1, pi: "I" }],
    3: [{ so: 2, pi: "I" }],
    4: [{ so: 1, pi: "I" }],
  },
  "CpE 401": {
    1: [{ so: 1, pi: "I" }, { so: 5, pi: "I" }, { so: 9, pi: "I" }, { so: 11, pi: "R" }, { so: 13, pi: "R" }],
    2: [{ so: 10, pi: "R" }, { so: 11, pi: "R" }],
    3: [{ so: 10, pi: "R" }, { so: 11, pi: "R" }],
    4: [{ so: 11, pi: "R" }],
  },
  "ENGG 402": {
    1: [{ so: 2, pi: "R" }, { so: 9, pi: "R" }, { so: 10, pi: "R" }, { so: 11, pi: "R" }],
    2: [{ so: 7, pi: "R" }],
    3: [{ so: 7, pi: "R" }],
  },
  "GEd 104": {
    1: [{ so: 7, pi: "I" }, { so: 10, pi: "I" }],
    2: [{ so: 10, pi: "I" }],
  },
  "GEd 108": {
    1: [{ so: 9, pi: "R" }],
    2: [{ so: 4, pi: "R" }],
    3: [{ so: 9, pi: "R" }],
  },
  "GEd 109": {
    1: [{ so: 10, pi: "I" }],
    2: [{ so: 6, pi: "I" }],
    3: [{ so: 6, pi: "I" }, { so: 9, pi: "I" }],
  },
  "MATH 102": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 1, pi: "I" }],
    3: [{ so: 1, pi: "I" }],
  },
  "SCI 403": {
    1: [{ so: 1, pi: "R" }, { so: 5, pi: "R" }],
    2: [{ so: 1, pi: "R" }, { so: 5, pi: "R" }],
    3: [{ so: 2, pi: "R" }],
  },
  "GEd 103": {
    1: [{ so: 10, pi: "I" }],
    2: [{ so: 10, pi: "I" }],
    3: [{ so: 4, pi: "I" }, { so: 9, pi: "I" }],
  },
  "GEd 107": {
    1: [{ so: 6, pi: "I" }],
    2: [{ so: 6, pi: "I" }],
    3: [{ so: 6, pi: "I" }],
  },
  "SCI 402": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 2, pi: "I" }],
    3: [{ so: 6, pi: "I" }],
  },
  "CpE 403": {
    1: [{ so: 9, pi: "I" }],
    2: [{ so: 10, pi: "I" }],
    3: [{ so: 9, pi: "I" }, { so: 10, pi: "I" }],
  },
  "CpE 404": {
    1: [{ so: 11, pi: "I" }],
    2: [{ so: 11, pi: "I" }],
    3: [{ so: 11, pi: "I" }],
    4: [{ so: 10, pi: "I" }],
  },
  "CpE 405": {
    1: [{ so: 5, pi: "R" }],
    2: [{ so: 1, pi: "R" }],
    3: [{ so: 5, pi: "R" }],
    4: [{ so: 1, pi: "R" }],
  },
  "EE 423": {
    1: [{ so: 1, pi: "R" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 2, pi: "R" }],
  },
  "ENGG 403": {
    1: [{ so: 11, pi: "R" }],
    2: [{ so: 11, pi: "R" }],
    3: [{ so: 11, pi: "R" }],
  },
  "ENGG 404": {
    1: [{ so: 5, pi: "R" }],
    2: [{ so: 12, pi: "I" }],
    3: [{ so: 12, pi: "I" }],
    4: [{ so: 9, pi: "R" }],
  },
  "MATH 403": {
    1: [{ so: 2, pi: "R" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 2, pi: "R" }],
  },
  "MATH 404": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 5, pi: "R" }],
  },
  "CpE 406": {
    1: [{ so: 3, pi: "R" }],
    2: [{ so: 11, pi: "D" }],
    3: [{ so: 3, pi: "R" }],
    4: [{ so: 4, pi: "R" }, { so: 12, pi: "R" }],
  },
  "CpE 407": {
    1: [{ so: 10, pi: "R" }],
    2: [{ so: 9, pi: "R" }],
    3: [{ so: 6, pi: "D" }],
    4: [{ so: 7, pi: "R" }],
  },
  "CpE 408": {
    1: [{ so: 1, pi: "R" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 5, pi: "R" }],
    4: [{ so: 1, pi: "R" }],
  },
  "CpEE 401": {
    1: [{ so: 3, pi: "I" }],
    2: [{ so: 3, pi: "I" }],
    3: [{ so: 11, pi: "R" }],
    4: [{ so: 11, pi: "R" }],
  },
  "ECE 421": {
    1: [{ so: 1, pi: "R" }],
    2: [{ so: 11, pi: "R" }],
    3: [{ so: 2, pi: "I" }],
  },
  "ENGG 411": {
    1: [{ so: 10, pi: "I" }],
    2: [{ so: 13, pi: "I" }],
    3: [{ so: 10, pi: "I" }],
    4: [{ so: 9, pi: "R" }],
  },
  "ENGG 414": {
    1: [{ so: 1, pi: "R" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 5, pi: "R" }],
    4: [{ so: 1, pi: "R" }],
  },
  "CpE 410": {
    1: [{ so: 5, pi: "R" }],
    2: [{ so: 11, pi: "D" }],
    3: [{ so: 2, pi: "R" }],
  },
  "CpE 411": {
    1: [{ so: 11, pi: "D" }],
    2: [{ so: 5, pi: "R" }],
    3: [{ so: 5, pi: "R" }, { so: 11, pi: "D" }],
  },
  "CpE 412": {
    1: [{ so: 11, pi: "I" }],
    2: [{ so: 5, pi: "I" }],
    3: [{ so: 2, pi: "I" }],
  },
  "CpE 413": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 5, pi: "I" }],
    3: [{ so: 2, pi: "I" }],
  },
  "CpE 414": {
    1: [{ so: 1, pi: "I" }, { so: 11, pi: "I" }],
    2: [{ so: 5, pi: "D" }],
    3: [{ so: 2, pi: "D" }],
  },
  "CpE 415": {
    1: [{ so: 11, pi: "R" }],
    2: [{ so: 11, pi: "R" }],
    3: [{ so: 11, pi: "R" }],
  },
  "ENGG 416": {
    1: [{ so: 1, pi: "R" }],
    2: [{ so: 3, pi: "R" }],
    3: [{ so: 6, pi: "R" }, { so: 7, pi: "R" }],
  },
  "CpE 417": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 5, pi: "D" }],
    3: [{ so: 2, pi: "D" }],
    4: [{ so: 2, pi: "D" }],
  },
  "CpE 418": {
    1: [{ so: 3, pi: "D" }],
    2: [{ so: 3, pi: "D" }],
    3: [{ so: 3, pi: "D" }],
    4: [{ so: 7, pi: "D" }],
  },
  "CpE 419": {
    1: [{ so: 5, pi: "R" }],
    2: [{ so: 11, pi: "R" }],
    3: [{ so: 2, pi: "R" }],
    4: [{ so: 2, pi: "R" }],
  },
  "CpE 420": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 1, pi: "D" }],
    3: [{ so: 1, pi: "D" }],
    4: [{ so: 5, pi: "D" }],
  },
  "CpE 421": {
    1: [{ so: 13, pi: "R" }],
    2: [{ so: 10, pi: "R" }],
    3: [{ so: 10, pi: "R" }],
    4: [{ so: 9, pi: "D" }],
  },
  "CpE 422": {
    1: [{ so: 1, pi: "D" }, { so: 3, pi: "D" }],
    2: [{ so: 2, pi: "D" }],
    3: [{ so: 3, pi: "D" }, { so: 12, pi: "D" }],
    4: [{ so: 4, pi: "D" }, { so: 7, pi: "D" }],
  },
  "CpEE 402": {
    1: [{ so: 11, pi: "D" }],
    2: [{ so: 11, pi: "D" }],
    3: [{ so: 3, pi: "R" }],
    4: [{ so: 3, pi: "R" }],
  },
  "CpE 423": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 11, pi: "D" }],
    3: [{ so: 2, pi: "D" }],
  },
  "CpE 424": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 5, pi: "D" }],
    3: [{ so: 9, pi: "D" }],
  },
  "CpE 425": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 2, pi: "D" }],
    3: [{ so: 5, pi: "D" }],
  },
  "CpE 426": {
    1: [{ so: 9, pi: "D" }],
    2: [{ so: 11, pi: "D" }],
    3: [{ so: 11, pi: "D" }],
  },
  "CpE 427": {
    1: [{ so: 5, pi: "D" }],
    2: [{ so: 5, pi: "D" }],
    3: [{ so: 2, pi: "D" }, { so: 11, pi: "D" }],
    4: [{ so: 11, pi: "D" }],
  },
  "CpE 428": {
    1: [{ so: 3, pi: "D" }],
    2: [{ so: 4, pi: "D" }],
    3: [{ so: 3, pi: "D" }],
  },
  "CpE 429": {
    1: [{ so: 6, pi: "D" }, { so: 13, pi: "D" }],
    2: [{ so: 10, pi: "D" }],
    3: [{ so: 8, pi: "D" }, { so: 10, pi: "D" }],
  },
  "IE 424": {
    1: [{ so: 8, pi: "I" }, { so: 11, pi: "I" }],
    2: [{ so: 11, pi: "I" }],
    3: [{ so: 2, pi: "I" }],
  },
  "CpEE 403": {
    1: [{ so: 11, pi: "D" }],
    2: [{ so: 3, pi: "D" }, { so: 11, pi: "D" }],
    3: [{ so: 3, pi: "D" }],
  },
  "Litr 102": {
    1: [{ so: 1, pi: "I" }],
    2: [{ so: 9, pi: "I" }],
    3: [{ so: 7, pi: "I" }],
  },
  "ENGG 405": {
    1: [{ so: 8, pi: "D" }, { so: 13, pi: "D" }],
    2: [{ so: 3, pi: "D" }, { so: 7, pi: "D" }],
    3: [{ so: 4, pi: "D" }],
  },
  "ENGG 417": {
    1: [{ so: 6, pi: "D" }, { so: 13, pi: "D" }],
    2: [{ so: 9, pi: "D" }, { so: 10, pi: "D" }],
    3: [{ so: 7, pi: "D" }],
  },
  "CpE 430": {
    1: [{ so: 1, pi: "D" }, { so: 5, pi: "D" }],
    2: [{ so: 2, pi: "D" }, { so: 6, pi: "D" }],
    3: [{ so: 7, pi: "D" }, { so: 12, pi: "D" }],
    4: [{ so: 13, pi: "D" }],
  },
};

export default function StudentCourseDetailView({ courseName, user, onBack }) {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorKind, setErrorKind] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [activeTab, setActiveTab] = useState('performance');
  const [focusedSegment, setFocusedSegment] = useState(null); // { index: number, type: 'ilo' | 'so' }
  const [activeMode, setActiveMode] = useState(null); // 'ilo' | 'so' | null

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





      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10 items-start">

        {/* LEFT COLUMN (45%): Overview & Detailed Evidence */}
        <div className="w-full lg:max-w-[45%] flex flex-col gap-6">
          {/* Top Stacked KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${panelBase} p-6`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Syllabus Mastery</p>
                <Trophy size={16} className="text-[#70170f]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{data.ilo?.weighted_avg?.toFixed(1) || 0}<span className="text-xl font-medium text-gray-400 ml-1">%</span></div>
              <p className="text-[12px] text-gray-500 mt-1">Course Objective Completion</p>
            </div>

            <div className={`${panelBase} p-6`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Course Standing</p>
                <TrendingUp size={16} className={getStanding(data.ilo?.weighted_avg).color} />
              </div>
              <div className={`text-2xl font-bold mb-1 tracking-tight uppercase ${getStanding(data.ilo?.weighted_avg).color}`}>
                {getStanding(data.ilo?.weighted_avg).label}
              </div>
              <p className="text-[12px] text-gray-500 mt-1">Current performance level</p>
            </div>
          </div>

          {/* Syllabus & Competency Alignment */}
          <div className={`${panelBase} p-8`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-gray-100 pb-8">
              <div>
                <h3 className="text-[18px] font-bold text-gray-900 tracking-tight">Syllabus & Competency Alignment</h3>
                <p className="text-[13px] text-gray-500 mt-1">Direct mapping of course ILOs to SOs</p>
              </div>

              <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100 select-none">
                <div
                  onClick={() => setActiveMode(activeMode === 'ilo' ? null : 'ilo')}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${activeMode === 'so' ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="w-3 h-3 bg-[#6d28d9] rounded-sm" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${activeMode === 'ilo' ? 'text-[#6d28d9]' : 'text-gray-700'}`}>ILO</span>
                </div>
                <div
                  onClick={() => setActiveMode(activeMode === 'so' ? null : 'so')}
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${activeMode === 'ilo' ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="w-3 h-3 bg-[#ea580c] rounded-sm" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${activeMode === 'so' ? 'text-[#ea580c]' : 'text-gray-700'}`}>SO</span>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {data.ilo?.percentages?.map((val, i) => {
                const courseMap = COURSE_ILO_SO_MAP[data.course_code] || {};
                const soEntries = courseMap[i + 1] || [];

                // Group by SO number to combine duplicate rows into combined PIs (e.g. "I/R")
                const groupedSOs = {};
                soEntries.forEach(e => {
                  if (!groupedSOs[e.so]) groupedSOs[e.so] = [];
                  groupedSOs[e.so].push(e.pi);
                });

                // Build array of { so, name, pis } objects
                const soLabels = Object.keys(groupedSOs).map(so => ({
                  so: parseInt(so),
                  name: SO_NAMES[so] || `SO ${so}`,
                  pis: [...new Set(groupedSOs[so])].join('/'),
                }));

                const rawScore = data.ilo?.raw?.[i] ?? 0;
                const totalScore = data.ilo?.totals?.[i] ?? 100;

                return (
                  <div key={i} className="group">
                    {/* ILO header row */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest shrink-0">ILO {i + 1}</span>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>
                      {soLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {soLabels.map(l => (
                            <span
                              key={l.so}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-800"
                            >
                              <span className="font-black text-indigo-900">SO {l.so}</span>
                              <span className="text-indigo-700">"{l.name}"</span>
                              <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-900 rounded text-[9px] font-black tracking-wide">{l.pis}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px] text-gray-400 italic">No SO Mapping</span>
                      )}
                    </div>

                    <div className="space-y-4 pl-1">
                      <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[12px] text-gray-500">Mastery</span>
                          <span className="text-[11px] font-bold text-gray-500">{rawScore} / {totalScore}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 cursor-pointer overflow-hidden">
                          <div className={`h-full transition-all ${activeMode === 'so' ? 'bg-gray-300' : 'bg-[#6d28d9]'}`} style={{ width: `${val}%` }} />
                        </div>
                      </div>
                      <div className="relative">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[12px] text-gray-500">Alignment</span>
                          <span className="text-[11px] font-bold text-gray-700">{val.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 cursor-pointer overflow-hidden">
                          <div className={`h-full transition-all ${activeMode === 'ilo' ? 'bg-gray-300' : 'bg-[#ea580c]'}`} style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (55%): Action & History */}
        <div className="w-full lg:max-w-[55%] flex flex-col gap-6">
          {/* Focus Areas & AI Insight Twin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Recommended Skill Focus */}
            <div className="rounded-xl bg-[#70170f]/95 backdrop-blur-md p-6 flex flex-col shadow-xl text-white border border-white/10 min-h-[220px]">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[18px] font-bold text-white tracking-tight">Focus Areas</h3>
                <Target size={16} className="text-white/60" />
              </div>
              <p className="text-[13px] text-white/70 mb-6">Recommended Skill Focus</p>

              <div className="space-y-2.5">
                {Object.entries(data.so?.scores || {})
                  .filter(([id]) => {
                    // DYNAMIC: Only show SOs that are actually mapped to this course's ILOs
                    const courseMap = COURSE_ILO_SO_MAP[data.course_code] || {};
                    const mappedSoIds = new Set();
                    Object.values(courseMap).forEach(entries => {
                      entries.forEach(e => mappedSoIds.add(`SO ${e.so}`));
                    });
                    return mappedSoIds.has(id);
                  })
                  .sort(([, a], [, b]) => a - b)
                  .slice(0, 2)
                  .map(([id, score]) => (
                    <div key={id} className="flex justify-between items-center text-[12px] mb-2.5">
                      <span className="font-bold text-white/80">{id}</span>
                      <span className="font-black text-white">{score.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>

              {/* Technical Proficiencies Checklist */}
              {(() => {
                const courseData = {
                  'ENGG 403': {
                    skills: [
                      { label: "CAD Layering & Organization", level: "Critical" },
                      { label: "Engineering Design Principles", level: "Essential" },
                      { label: "Component & Assembly Understanding", level: "Technical" }
                    ]
                  },
                  'CpE 411': {
                    skills: [
                      { label: "Big O Complexity Analysis", level: "Critical" },
                      { label: "Core Structure Implementation", level: "Essential" },
                      { label: "Memory/Pointer Management", level: "Technical" }
                    ]
                  },
                  'ENGG 416': {
                    skills: [
                      { label: "Research Design & Framework", level: "Critical" },
                      { label: "Statistical Data Validation", level: "Essential" },
                      { label: "Technical Paper Composition", level: "Technical" }
                    ]
                  }
                }[data.course_code] || {
                  skills: [{ label: "General Course Proficiency", level: "Required" }]
                };

                return (
                  <ul className="space-y-3 mt-1">
                    {courseData.skills.map((skill, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-white leading-tight">{skill.label}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            {/* Card 2: Focus Insight */}
            <div className="rounded-xl bg-red-50 p-6 flex flex-col shadow-sm border border-[#70170f] min-h-[220px]">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[18px] font-bold text-[#70170f] tracking-tight">Focus Insight</h3>
                <Sparkles size={16} className="text-[#70170f]" />
              </div>
              <p className="text-[13px] text-[#70170f]/70 mb-6">Personalized Coaching Trace</p>

              <div className="flex-1">
                {(() => {
                  const missing = assessments.find(a => a.ilos.reduce((s, i) => s + i.score, 0) === 0);
                  const currentAvg = data.ilo?.weighted_avg || 0;

                  // Tracing lowest ILO from history
                  const allIloScores = assessments.flatMap(a => a.ilos);
                  const lowestIlo = allIloScores.length > 0
                    ? allIloScores.sort((a, b) => a.percentage - b.percentage)[0]
                    : null;
                  const courseMap = COURSE_ILO_SO_MAP[data.course_code] || {};
                  const firstEntry = lowestIlo ? courseMap[lowestIlo.ilo_number]?.[0] : null;
                  const lowSoId = firstEntry ? `SO ${firstEntry.so}` : 'SO 2';

                  const courseSuggestions = {
                    'ENGG 403': {
                      'SO 2': "parametric design logic",
                      'SO 4': "CAD software tool usage",
                      'SO 1': "fundamental drafting principles"
                    },
                    'CpE 411': {
                      'SO 1': "data structure fundamentals",
                      'SO 2': "algorithm implementation logic",
                      'SO 5': "performance analysis & optimization"
                    }
                  }[data.course_code] || {};

                  if (missing) {
                    return (
                      <p className="text-[14px] text-gray-800 leading-relaxed">
                        Your standing is currently capped by a <span className="font-bold text-[#70170f] underline decoration-[#70170f]/40 underline-offset-4">Missing Assessment</span> ({missing.name}). Completing this will immediately boost your <span className="font-bold text-[#70170f]">Syllabus Mastery</span>.
                      </p>
                    );
                  }

                  if (currentAvg >= 90) {
                    return (
                      <p className="text-[14px] text-gray-800 leading-relaxed">
                        You've achieved <span className="font-bold text-emerald-700">EXCEPTIONAL</span> status! To maintain this mastery, continue refining your <span className="font-bold text-[#70170f]">{courseSuggestions[lowSoId] || "course skills"}</span> across upcoming projects.
                      </p>
                    );
                  }

                  const nextTarget = currentAvg < 75 ? "COMPETENT" : "EXCEPTIONAL";
                  return (
                    <p className="text-[14px] text-gray-800 leading-relaxed">
                      To reach <span className="font-bold text-[#70170f]">{nextTarget}</span> standing, focus on <span className="font-bold text-[#70170f]">ILO {lowestIlo?.ilo_number}</span> ({courseSuggestions[lowSoId] || "technical core"}). This is your primary path to proficiency.
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Assessments */}
          <div className="space-y-4">
            <div className="pl-2">
              <h3 className="text-[18px] font-bold text-gray-900 mb-1 tracking-tight">Assessments</h3>
              <p className="text-[13px] text-gray-500">Graded assignments and exams</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {assessments.map((assessment, i) => {
                const totalScore = assessment.ilos.reduce((sum, ilo) => sum + ilo.score, 0);
                const totalMax = assessment.ilos.reduce((sum, ilo) => sum + ilo.max_score, 0);
                const isMissing = totalScore === 0;

                return (
                  <div key={i} className={`${panelBase} p-5 flex flex-col hover:border-gray-300 transition-all cursor-default`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-[15px] font-bold truncate ${isMissing ? 'text-[#70170f]' : 'text-gray-900'}`}>{assessment.name}</h4>
                          <span className={`text-[15px] font-bold ${isMissing ? 'text-[#70170f]/70' : 'text-[#70170f]'}`}>
                            {totalScore} <span className={`text-[13px] font-bold ${isMissing ? 'text-[#70170f]/50' : 'text-gray-400'}`}>/ {totalMax}</span>
                          </span>
                        </div>
                        <p className={`text-[13px] mt-0.5 ${isMissing ? 'text-[#70170f]/70' : 'text-gray-500'}`}>{assessment.type}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${isMissing ? 'text-[#70170f] bg-[#70170f]/10 border-[#70170f]/20' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                        {new Date(assessment.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className={`space-y-2.5 border-t pt-4 flex-1 flex flex-col ${isMissing ? 'border-[#70170f]/20' : 'border-gray-100'}`}>
                      {isMissing ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 bg-red-50 rounded-lg border border-[#70170f] shadow-sm">
                          <AlertCircle size={20} className="text-[#70170f] mb-2" />
                          <p className="text-[11px] font-black text-[#70170f] uppercase tracking-wider text-center">
                            Missing Assessment,<br />Please Comply!
                          </p>
                        </div>
                      ) : (
                        assessment.ilos.sort((a, b) => a.ilo_number - b.ilo_number).map((ilo, j) => {
                          const isPassing = ilo.percentage > 75;
                          const barColor = isPassing ? 'bg-emerald-500' : 'bg-rose-500';

                          return (
                            <div key={j} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-600">ILO {ilo.ilo_number}</span>
                                <span className={`${isPassing ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {ilo.score}/{ilo.max_score}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${ilo.percentage}%` }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
  const h = 240; // Slightly shorter for narrower width

  // X coords for each outcome
  const points = activeSkills.map((s, i) => {
    const currentScore = predicted?.[s.so_id] || s.predicted || 0;
    const lowBound = scenarios?.scenario_low?.[s.so_id] ?? (currentScore * 0.85);
    const highBound = scenarios?.scenario_high?.[s.so_id] ?? (currentScore * 1.15);

    return {
      x: (i / (activeSkills.length - 1 || 1)) * w,
      pctX: (i / (activeSkills.length - 1 || 1)) * 100,
      so_id: s.so_id,
      label: s.skill,
      cur: currentScore,
      low: lowBound,
      high: highBound
    };
  });

  const maxVal = 100;
  const scaleY = (val) => h - (val / maxVal) * (h - 80) - 40;

  const makePath = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${scaleY(p[key])}`).join(' ');

  // Create the Mastery Band (Ribbon) path
  const highPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${scaleY(p.high)}`).join(' ');
  const lowPathReverse = [...points].reverse().map((p) => `L ${p.x} ${scaleY(p.low)}`).join(' ');
  const bandPath = `${highPath} ${lowPathReverse} Z`;

  return (
    <div className="w-full relative rounded-xl overflow-hidden pb-16 pt-10 bg-white">
      <div className="w-full relative" style={{ height: h }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="absolute top-0 left-0" preserveAspectRatio="none">
          {/* Horizontal Grid lines */}
          {[0, 25, 50, 75, 100].map(val => (
            <React.Fragment key={val}>
              <line x1="0" y1={scaleY(val)} x2={w} y2={scaleY(val)} stroke="#f1f5f9" strokeWidth="1" />
              <text x="4" y={scaleY(val) - 4} fontSize="10" fill="#94a3b8" fontWeight="600">{val}%</text>
            </React.Fragment>
          ))}

          {/* Mastery Band (Shaded Potential Zone) */}
          <path d={bandPath} fill="url(#bandGradient)" opacity="0.6" />

          <defs>
            <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Paths */}
          <path d={makePath('high')} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
          <path d={makePath('low')} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
          <path d={makePath('cur')} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Dynamic Data Markers */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            {/* Main Mastery Node */}
            <div className="absolute w-4 h-4 rounded-full border-4 border-white bg-gray-900 shadow-md z-20"
              style={{ left: `calc(${p.pctX}% - 8px)`, top: `${scaleY(p.cur) - 8}px` }} />

            {/* Potential Indicators (Ghost Nodes) */}
            <div className="absolute w-2 h-2 rounded-full bg-emerald-500/40 z-10"
              style={{ left: `calc(${p.pctX}% - 4px)`, top: `${scaleY(p.high) - 4}px` }} />
            <div className="absolute w-2 h-2 rounded-full bg-orange-400/40 z-10"
              style={{ left: `calc(${p.pctX}% - 4px)`, top: `${scaleY(p.low) - 4}px` }} />

            {/* Top Label (Score) */}
            <div className="absolute z-30" style={{ left: `calc(${p.pctX}% - 25px)`, top: `${scaleY(p.cur) - 32}px`, width: '50px', textAlign: 'center' }}>
              <div className="bg-gray-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                {p.cur.toFixed(1)}%
              </div>
            </div>

            {/* Bottom Label (SO Code) */}
            <div className="absolute z-30" style={{ left: `calc(${p.pctX}% - 30px)`, bottom: '-45px', width: '60px', textAlign: 'center' }}>
              <p className="text-gray-900 text-[11px] font-black tracking-tight leading-none mb-1">{p.so_id}</p>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-tighter leading-none truncate">{p.label.split(': ')[1]}</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Modern Legend */}
      <div className="absolute top-4 right-8 flex gap-6 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-100 rounded-sm border border-emerald-200" /> High Potential</div>
        <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-gray-900" /> Current Mastery</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-50 rounded-sm border border-orange-100" /> Baseline</div>
      </div>
    </div>
  );
}
