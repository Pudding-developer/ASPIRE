import React from 'react';
import {
  TrendingUp, Github, Bell, TrendingDown, Minus, ArrowUpRight,
  ChevronRight, BookOpen, Star, Plus, AlertCircle, X, GraduationCap, Target, Rocket, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import projectBg from '../../../../assets/project_card_bg.png';

// Hooks
import useStudentData from '../hooks/useStudentData';
import useGithubData from '../../github/hooks/useGithubData';
import usePipeline from '../hooks/usePipeline';
import useActivityFeed from '../hooks/useActivityFeed';
import { StudentDashboardSkeleton } from '../../shared/StudentPageSkeletons';
import { useState, useEffect, useRef } from 'react';
import { studentService } from '../../../../services/studentService';
import RoadmapViewer from '../../career-coach/components/RoadmapViewer';
import AllActivitiesModal from '../components/AllActivitiesModal';

const ACTIVITY_VISUALS = {
  grade_released: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
  career_updated: { icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  github_synced: { icon: Github, color: 'bg-blue-100 text-blue-600' },
  skill_milestone: { icon: Star, color: 'bg-yellow-100 text-yellow-600' },
};

function formatActivityTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  if (isNaN(then.getTime())) return '';
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

const panelBase = 'bg-white border border-[#eed7d3] rounded-2xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.1)]';
const primaryBtn = 'bg-[#9f0707] hover:bg-[#430202] text-white py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-lg shadow-[#9f0707]/10';
const subtleBtn = 'border border-[#eed8d8] rounded-xl py-2 text-[13px] font-semibold text-[#6f4a4a] hover:bg-[#fff5f5] transition-colors';

/* ─── Stat Card ─── */
export function StatCard({ label, value, sub, trend, badge, badgeTone = 'green', icon: Icon }) {
  const badgeClass = badgeTone === 'red'
    ? 'bg-red-50 text-red-600 border-red-200'
    : badgeTone === 'amber'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-600 border-emerald-200';

  return (
    <div className={`${panelBase} p-6 flex flex-col min-h-[160px] hover:shadow-[0_16px_36px_-20px_rgba(0,0,0,0.25)] transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#fff2f2] text-[#70170f] flex items-center justify-center">
            <Icon size={14} />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <p className={`${value?.length > 15 ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-900 leading-tight`}>{value}</p>
          {badge && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {badge}
            </span>
          )}
          {trend && (
            <div className={`flex items-center ${trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp size={20} strokeWidth={2.5} /> : <TrendingDown size={20} strokeWidth={2.5} />}
            </div>
          )}
        </div>
        {sub && (
          <p className="text-[11px] text-gray-400 font-medium truncate mt-1" title={sub}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}


/* ─── Notification Dropdown ─── */
export function NotificationDropdown({ open, onClose, notifications, unreadCount, onShowAll }) {
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
            const visual = ACTIVITY_VISUALS[n.type] ?? { icon: Star, color: 'bg-gray-100 text-gray-500' };
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
                    <p className="text-[10px] text-gray-400 mt-1">{formatActivityTime(n.created_at)}</p>
                  </div>
                  {n.unread && <span className="w-2 h-2 bg-[#70170f] rounded-full shrink-0 mt-2" />}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-3 border-t border-[#f2dfdf] bg-white shrink-0">
        <button onClick={() => { onClose(); onShowAll(); }} className={`w-full ${primaryBtn} py-2`}>
          View all activities
        </button>
      </div>
    </div>
  );
}

/* ─── Developing Skills ─── */
export function DevelopingSkills({ weakSkills, aggregatedSkills }) {
  const DEVELOPING_TARGET = 80;
  const hasAnySkillData = Object.values(aggregatedSkills || {}).some(
    v => typeof v === 'number'
  );
  const belowTarget = (weakSkills || []).filter(
    name => (aggregatedSkills?.[name] || 0) < DEVELOPING_TARGET
  );

  if (!belowTarget.length) {
    const allDeveloped = hasAnySkillData;
    return (
      <div className={`${panelBase} p-6 flex flex-col h-full`}>
        <h3 className="text-[20px] font-black text-gray-900 mb-1">Developing Skills</h3>
        <p className="text-[11px] text-gray-400 mb-5">Ongoing competencies requiring attention</p>
        <div className="flex-1 flex items-center justify-center">
          {allDeveloped ? (
            <div className="flex flex-col items-center text-center max-w-[320px] px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[13px] font-bold text-emerald-700 mb-1">
                All skills at target proficiency
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Every tracked skill has reached the {DEVELOPING_TARGET}% target. Keep up the consistent performance.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center max-w-[300px] px-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[12px] text-gray-400">
                Not enough data to predict developing skills yet.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${panelBase} p-6 flex flex-col h-full`}>
      <h3 className="text-[20px] font-black text-gray-900 mb-1">Developing Skills</h3>
      <p className="text-[11px] text-gray-400 mb-5">Ongoing competencies requiring attention</p>
      <div className="space-y-5 flex-1">
        {belowTarget.slice(0, 3).map((skillName) => {
          const current = Math.round(aggregatedSkills[skillName] || 0);
          const target = DEVELOPING_TARGET;
          return (
            <div key={skillName}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-semibold text-gray-800">{skillName}</span>
                <span className="text-[10px] font-bold uppercase text-red-500">NEEDS ATTENTION</span>
              </div>
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: `${current}%`, background: '#ef4444' }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-gray-400/60"
                  style={{ left: `${target}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Current Proficiency: {current}%</span>
                <span>Target: {target}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Excelled Skills ─── */
export function ExcelledSkills({ topSkills, onNavigate }) {
  if (!topSkills || !topSkills.length) {
    return (
      <div className="bg-[#fff5f5] border border-[#e8a0a0] rounded-2xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.2)] p-6 flex flex-col h-full justify-center">
        <h3 className="text-[20px] font-black text-gray-900 mb-5">Excelled Skills</h3>
        <p className="text-[12px] text-gray-400">Not enough data to predict excelled skills yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fff5f5] border border-[#e8a0a0] rounded-2xl shadow-[0_12px_30px_-18px_rgba(0,0,0,0.2)] p-6 flex flex-col h-full">
      <h3 className="text-[20px] font-black text-gray-900 mb-5">Excelled Skills</h3>
      <div className="flex flex-wrap content-start items-start gap-2 mb-5 flex-1">
        {topSkills.map((s) => (
          <span key={s} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-500 text-[12px] font-semibold rounded-full">{s}</span>
        ))}
      </div>
      <button
        onClick={() => onNavigate('my-performance')}
        className={`w-full ${primaryBtn} mt-auto`}
      >
        View all achieved skills
      </button>
    </div>
  );
}

/* ─── Top Projects / GitHub Repos ─── */
export function TopProjects({ repos }) {
  if (!repos || !repos.length) {
    return (
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
        <h2 className="text-[20px] font-black text-gray-900 mb-5">Top Academic Projects</h2>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center text-gray-500 text-[13px]">
          No projects available yet. Connect your GitHub or complete assignments.
        </div>
      </div>
    );
  }

  const topRepos = [...repos]
    .sort((leftRepo, rightRepo) => {
      const leftStars = leftRepo.stargazer_count || leftRepo.stargazers_count || 0;
      const rightStars = rightRepo.stargazer_count || rightRepo.stargazers_count || 0;
      if (rightStars !== leftStars) return rightStars - leftStars;

      const leftCommits = leftRepo.commit_count || 0;
      const rightCommits = rightRepo.commit_count || 0;
      if (rightCommits !== leftCommits) return rightCommits - leftCommits;

      const leftPushed = leftRepo.pushed_at ? new Date(leftRepo.pushed_at).getTime() : 0;
      const rightPushed = rightRepo.pushed_at ? new Date(rightRepo.pushed_at).getTime() : 0;
      return rightPushed - leftPushed;
    })
    .slice(0, 3);

  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
      <h2 className="text-[20px] font-black text-gray-900 mb-5">Top Academic Projects</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {topRepos.map((repo) => {
          const repoName = repo.repo_name || repo.name || repo.repo_full_name || 'Untitled Repository';
          const starCount = repo.stargazer_count || repo.stargazers_count || 0;
          const forkCount = repo.fork_count || repo.forks_count || 0;

          return (
            <div key={repo.repo_full_name || repoName} className="bg-linear-to-br from-white via-[#fffafa] to-[#fcf4f2] border border-[#eed7d3] rounded-2xl overflow-hidden shadow-[0_12px_30px_-18px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.25)] transition-shadow group flex flex-col">
              <div className="relative h-32 overflow-hidden">
                <img src={projectBg} alt={repoName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  {repo.primary_language || 'CODE'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-gray-900 mb-1 leading-snug truncate">{repoName}</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{repo.description || "No description provided."}</p>
                </div>
                <div className="mt-3 flex gap-4 text-[11px] text-gray-400 font-semibold">
                  <span>⭐ {starCount}</span>
                  <span>📋 {forkCount} forks</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── GitHub Card ─── */
export function GitHubCard({ githubStatus, onConnect }) {
  if (!githubStatus?.connected) {
    return (
      <div className={`${panelBase} p-6`}>
        <h3 className="text-[20px] font-black text-gray-900 mb-2">GitHub</h3>
        <p className="text-[12px] text-gray-500 mb-4">Connect GitHub to track projects.</p>
        <button
          onClick={onConnect}
          className={`w-full ${primaryBtn} flex items-center justify-center gap-2`}
        >
          Connect <Github size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`${panelBase} p-6`}>
      <h3 className="text-[20px] font-black text-gray-900 mb-5">GitHub</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
            <Github size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 leading-snug truncate">{githubStatus.github_username}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">Analysis {githubStatus.has_analysis ? 'Ready' : 'Pending'}</p>
          </div>
        </div>
        <span className="bg-emerald-50/90 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-md shrink-0 ml-2 border border-emerald-200">Connected</span>
      </div>
    </div>
  );
}

/* ─── Join Class Card ─── */
export function JoinClassCard({ onNavigate }) {

  return (
    <div className={`${panelBase} p-6 flex flex-col items-center justify-center text-center`}>
      <div className="w-12 h-12 bg-[#70170f]/10 text-[#70170f] rounded-full flex items-center justify-center mb-3">
        <Plus size={24} />
      </div>
      <h3 className="text-[20px] font-black text-gray-900 mb-2">Join a new Class</h3>
      <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
        Enter a class code provided by your instructor to join their roster and access your materials.
      </p>
      <button
        onClick={() => onNavigate('enrolled-classes')}
        className="w-full bg-[#9f0707] hover:bg-[#4a0e09] text-white py-2.5 rounded-xl text-[13px] font-bold transition-colors mt-auto"
      >
        Join Class
      </button>
    </div>
  );
}

/* ─── Top Courses Card ─── */
export function TopCoursesCard({ predictions, onNavigate }) {
  // Derive per-course mean proficiency from the ML pipeline output.
  // predictions.per_course is an array of { course, predicted_skills: {skill: score} }
  const perCourse = predictions?.per_course || [];

  const ranked = perCourse
    .map(c => {
      const vals = Object.values(c.predicted_skills || {}).filter(v => typeof v === 'number' && v > 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { course: c.course, proficiency: Math.round(avg) };
    })
    .filter(c => c.proficiency > 0)
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 4);

  if (!ranked.length) {
    return (
      <div className={`${panelBase} p-6 flex flex-col`}>
        <h3 className="text-[20px] font-black text-gray-900 mb-2">Top Courses</h3>
        <p className="text-[12px] text-gray-400">No course performance data yet.</p>
      </div>
    );
  }

  const top = ranked[0].proficiency || 1;

  return (
    <div className={`${panelBase} p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[20px] font-black text-gray-900">Top Courses</h3>
        <span className="text-[10px] font-black text-[#70170f] uppercase tracking-widest">by Proficiency</span>
      </div>

      <div className="space-y-4 flex-1">
        {ranked.map((c, i) => {
          const barPct = top > 0 ? (c.proficiency / top) * 100 : 0;
          const isTop = i === 0;
          return (
            <div key={c.course}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isTop && (
                    <span className="w-4 h-4 bg-[#9f0707] text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0">#1</span>
                  )}
                  <span className="text-[12px] font-semibold text-gray-800 truncate" title={c.course}>{c.course}</span>
                </div>
                <span className={`text-[12px] font-black tabular-nums shrink-0 ${isTop ? 'text-[#9f0707]' : 'text-gray-700'}`}>
                  {c.proficiency}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, background: 'linear-gradient(to right, #6b0505, #9f0707, #e97b7b)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onNavigate('my-performance')}
        className={`w-full ${primaryBtn} mt-5`}
      >
        View full performance
      </button>
    </div>
  );
}

/* ─── Career Choice Card ─── */
export function CareerChoiceCard({ report, chosenCareer, onNavigate }) {
  const [showRoadmap, setShowRoadmap] = useState(false);
  let careerMatches = [];
  try {
    const pipelineData = report?.report || (typeof report?.report_data === 'string' ? JSON.parse(report.report_data) : report?.report_data);
    careerMatches = pipelineData?.career_matches || [];
  } catch (e) {
    // ignore
  }

  const targetCareer = chosenCareer
    ? careerMatches.find(o => o.title === chosenCareer) || { title: chosenCareer, match_score: 0 }
    : careerMatches[0];

  if (!targetCareer) {
    return (
      <div className={`${panelBase} p-6 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-black text-gray-900 mb-1">Career Map</h3>
          <p className="text-[12px] text-gray-500">No AI career report generated yet. We analyze your performance to map out a career path.</p>
        </div>
        <button 
          onClick={() => onNavigate('career-coach')}
          className={`shrink-0 px-6 py-3 ${subtleBtn}`}
        >
          Generate map
        </button>
      </div>
    );
  }

  const pct = Math.round(targetCareer.match_score || 0);
  const description = targetCareer.reasoning
    ? targetCareer.reasoning.split('.')[0] + '.'
    : 'Run the AI analyzer to get detailed insights.';
  const size = 80, stroke = 8, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  return (
    <div className={`${panelBase} p-6 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
      <div className="flex-1 min-w-0">
        <h3 className="text-[18px] font-black text-gray-900 mb-4">{chosenCareer ? 'Your Career Goal' : 'Top Career Match'}</h3>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke="#fcd5d5"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke="#70170f"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[14px] font-extrabold text-gray-900">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{targetCareer.title}</h4>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{pct > 0 ? description : 'Not analyzed yet'}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <button
          onClick={() => setShowRoadmap(true)}
          className="w-full md:w-auto bg-[#9f0707] hover:bg-[#430202] text-white px-6 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 shadow-lg shadow-[#9f0707]/10"
        >
          View Career Roadmap
        </button>
      </div>

      {showRoadmap && targetCareer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRoadmap(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Detailed Analysis</p>
                <h2 className="text-[20px] font-black text-gray-900">{targetCareer.title} Roadmap</h2>
              </div>
              <button onClick={() => setShowRoadmap(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <RoadmapViewer careerTitle={targetCareer.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CTA Banner ─── */
export function CTABanner({ onNavigate }) {
  return (
    <div className="bg-linear-to-br from-[#2e0b0b] via-[#3d0f0f] to-[#541515] border border-[#6b2222]/40 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.4)]">
      <div>
        <h3 className="text-[18px] font-black text-white mb-1 leading-snug">Ready for your next career milestone?</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">Our AI engine has prepared updated career paths based on your latest grades and GitHub activity.</p>
      </div>
      <button
        onClick={() => onNavigate('career-coach')}
        className="w-full px-5 py-2.5 bg-[#9f0707] hover:bg-[#430202] text-white text-[13px] font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#9f0707]/20 flex items-center justify-center gap-2"
      >
        VIEW ROADMAP <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── Dashboard Main View ─── */
export default function StudentDashboardView({ user, onNavigate }) {
  const { classes, predictions, iloCoverage, loading: studentLoading } = useStudentData();
  const { status: githubStatus, repos, loading: githubLoading, connectGithub } = useGithubData();
  const { report, loading: pipelineLoading } = usePipeline(user?.id);
  const [chosenCareer, setChosenCareer] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const { items: notifications, refetch: refetchActivity } = useActivityFeed(10);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    if (!notifOpen || unreadCount === 0) return;
    studentService.markActivityRead()
      .then(() => refetchActivity())
      .catch(() => { });
  }, [notifOpen, unreadCount, refetchActivity]);

  useEffect(() => {
    studentService.getChosenCareer()
      .then(data => { if (data?.chosen_career) setChosenCareer(data.chosen_career); })
      .catch(() => { });

    const handleCareerChosen = (e) => setChosenCareer(e.detail);
    window.addEventListener('aspire_career_chosen', handleCareerChosen);
    return () => window.removeEventListener('aspire_career_chosen', handleCareerChosen);
  }, []);

  if (studentLoading) {
    return <StudentDashboardSkeleton />;
  }

  const fullName = user?.full_name || 'Student';

  // Aggregate stats from backend
  const masteryScore = iloCoverage.totalMastery || 0;
  const overallOutcome = predictions?.overall_outcome || 'N/A';

  // Career Match Calculation
  let careerMatches = [];
  try {
    const pipelineData = report?.report || (typeof report?.report_data === 'string' ? JSON.parse(report.report_data) : report?.report_data);
    careerMatches = pipelineData?.career_matches || [];
  } catch (e) { }

  const targetCareer = chosenCareer
    ? careerMatches.find(o => o.title === chosenCareer) || { title: chosenCareer, match_score: 0 }
    : careerMatches[0];

  const matchPct = Math.round(targetCareer?.match_score || 0);

  return (
    <div className="p-8 space-y-8 bg-linear-to-br from-[#fff8f8] via-[#fffdfd] to-[#fdf2f2] rounded-3xl border border-[#f2dfdf] shadow-[0_22px_55px_-35px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg ring-1 ring-[#70170f]/10"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <p className="text-[10px] font-black text-[#70170f] uppercase tracking-[0.2em] mb-1">Student Overview</p>
            <h1 className="text-[2.2rem] font-black text-gray-900 leading-tight">Hello, {fullName}.</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="relative">
            <button
              onClick={() => setNotifOpen(true)}
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Mastery" value={`${masteryScore}%`} trend="up" icon={GraduationCap} />
        <StatCard label="Computed Outcome" value={overallOutcome} icon={Target} />
        <StatCard label="Top Skill" value={predictions?.top_skills?.[0] || 'N/A'} sub="Strongest predicted skillset" icon={Rocket} />
        <StatCard
          label="Career Target"
          value={matchPct >= 75 ? 'On Track' : matchPct >= 60 ? 'Developing' : 'Needs Focus'}
          sub={matchPct >= 75
            ? `Achieved ${matchPct}% match`
            : matchPct >= 60
            ? `${matchPct}% match — developing`
            : `${matchPct}% match — requires growth`}
          badge={matchPct >= 75 ? 'On Track' : matchPct >= 60 ? 'Developing' : 'Needs Focus'}
          badgeTone={matchPct >= 75 ? 'green' : matchPct >= 60 ? 'amber' : 'red'}
          icon={Activity}
        />
      </div>

      {/* Body: Main Left Column & Sidebar Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Career Goal row */}
          <CareerChoiceCard report={report} chosenCareer={chosenCareer} onNavigate={onNavigate} />

          {/* Skills row */}
          <div className="grid md:grid-cols-2 gap-6">
            <DevelopingSkills weakSkills={predictions?.weak_skills} aggregatedSkills={predictions?.aggregated_skills} />
            <ExcelledSkills topSkills={predictions?.top_skills} onNavigate={onNavigate} />
          </div>

          {/* Projects */}
          <TopProjects repos={repos} />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex flex-col gap-6">
          <GitHubCard githubStatus={githubStatus} onConnect={connectGithub} />
          <TopCoursesCard predictions={predictions} onNavigate={onNavigate} />
          <CTABanner onNavigate={onNavigate} />
        </div>

      </div>

      {showAllActivities && <AllActivitiesModal onClose={() => setShowAllActivities(false)} />}
    </div>
  );
}
