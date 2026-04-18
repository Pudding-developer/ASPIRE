import React from 'react';
import {
  TrendingUp, Github, Bell, Filter, TrendingDown, Minus, ArrowUpRight,
  ChevronRight, BookOpen, Star, Plus, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import projectBg from '../../../../assets/project_card_bg.png';

// Hooks
import useStudentData from '../hooks/useStudentData';
import useGithubData from '../../github/hooks/useGithubData';
import usePipeline from '../hooks/usePipeline';
import { StudentDashboardSkeleton } from '../../shared/StudentPageSkeletons';

const panelBase = 'bg-gradient-to-br from-white via-[#fffbfb] to-[#fff3f3] border border-[#f1d7d7] rounded-2xl shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)]';
const subtleBtn = 'border border-[#eed8d8] rounded-xl py-2 text-[13px] font-semibold text-[#6f4a4a] hover:bg-[#fff5f5] transition-colors';

/* ─── Stat Card ─── */
export function StatCard({ label, value, sub, trend, badge }) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div className={`${panelBase} p-5 hover:shadow-[0_16px_36px_-20px_rgba(188,19,19,0.5)] transition-shadow`}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[2rem] font-extrabold text-gray-900 leading-none">{value}</p>
          {sub && <p className="text-[12px] text-gray-500 mt-1">{sub}</p>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trendColor} text-[12px] font-semibold`}>
            <TrendIcon size={14} />
          </div>
        )}
        {badge && (
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
            {badge} <ArrowUpRight size={10} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── ILO Donut ─── */
export function ILOCoverage({ coverage }) {
  const segments = [
    { label: 'Technical Depth',     pct: coverage.techPct || 0, color: '#bc1313' },
    { label: 'Analytical Rigor',    pct: coverage.analyticalPct || 0, color: '#e97b7b' },
    { label: 'Professional Ethics', pct: coverage.ethicsPct || 0, color: '#fcd5d5' },
  ];
  
  const size = 120, stroke = 16, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={`${panelBase} p-6`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Integrated ILO Coverage</p>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Learning Outcome Status</h3>
      <div className="flex items-center gap-8">
        <div className="relative shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {segments.map((s, i) => {
              if (!s.pct) return null;
              const dash = (s.pct / 100) * circ;
              const gap  = circ - dash;
              const el = (
                <circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-extrabold text-gray-900">{coverage.totalMastery}%</span>
            <span className="text-[9px] text-gray-400 font-semibold">MASTERY</span>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[13px] text-gray-600">{s.label}</span>
              </div>
              <span className="text-[13px] font-bold text-gray-800">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Activity ─── */
export function RecentActivity() {
  const items = [
    { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', title: 'Calculus 2 Grade Released', sub: 'A Achieved · 2 hours ago' },
    { icon: Star,     color: 'bg-yellow-100 text-yellow-600',   title: 'Skill Milestone Reached', sub: 'Advanced in Python · Yesterday' },
  ];
  return (
    <div className={`${panelBase} p-6 flex flex-col justify-between`}>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Recent Activity</p>
        <h3 className="text-[16px] font-bold text-gray-900 mb-5">System Feed</h3>
        <div className="space-y-4">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${it.color}`}>
                <it.icon size={14} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800 leading-snug">{it.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className={`mt-5 w-full ${subtleBtn}`}>
        View all activities
      </button>
    </div>
  );
}

/* ─── Developing Skills ─── */
export function DevelopingSkills({ weakSkills, aggregatedSkills }) {
  if (!weakSkills || !weakSkills.length) {
    return (
      <div className={`${panelBase} p-6`}>
        <h3 className="text-[16px] font-bold text-gray-900 mb-1">Developing Skills</h3>
        <p className="text-[12px] text-gray-400 mb-5">Not enough data to predict developing skills yet.</p>
      </div>
    );
  }

  return (
    <div className={`${panelBase} p-6`}>
      <h3 className="text-[16px] font-bold text-gray-900 mb-1">Developing Skills</h3>
      <p className="text-[12px] text-gray-400 mb-5">Ongoing competencies requiring attention</p>
      <div className="space-y-5">
        {weakSkills.slice(0, 3).map((skillName) => {
          const current = Math.round(aggregatedSkills[skillName] || 0);
          const target = 80;
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
export function ExcelledSkills({ topSkills }) {
  if (!topSkills || !topSkills.length) {
    return (
      <div className={`${panelBase} p-6 h-full flex flex-col`}>
        <h3 className="text-[16px] font-bold text-gray-900 mb-5">Excelled Skills</h3>
        <p className="text-[12px] text-gray-400 mb-5">Not enough data to predict excelled skills yet.</p>
      </div>
    );
  }

  return (
    <div className={`${panelBase} p-6 h-full flex flex-col`}>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Excelled Skills</h3>
      <div className="flex flex-wrap content-start items-start gap-2 mb-5 flex-1">
        {topSkills.map((s) => (
          <span key={s} className="px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-full">{s}</span>
        ))}
      </div>
      <button className={`w-full ${subtleBtn} mt-auto`}>
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
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
        <h2 className="text-[22px] font-extrabold text-gray-900 mb-5">Top Academic Projects</h2>
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
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Portfolio</p>
      <h2 className="text-[22px] font-extrabold text-gray-900 mb-5">Top Academic Projects</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {topRepos.map((repo) => {
          const repoName = repo.repo_name || repo.name || repo.repo_full_name || 'Untitled Repository';
          const starCount = repo.stargazer_count || repo.stargazers_count || 0;
          const forkCount = repo.fork_count || repo.forks_count || 0;

          return (
          <div key={repo.repo_full_name || repoName} className="bg-linear-to-br from-white via-[#fffafa] to-[#fff3f3] border border-[#f1d7d7] rounded-2xl overflow-hidden shadow-[0_12px_30px_-18px_rgba(188,19,19,0.45)] hover:shadow-[0_16px_36px_-18px_rgba(188,19,19,0.55)] transition-shadow group flex flex-col">
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
        );})}
      </div>
    </div>
  );
}

/* ─── GitHub Card ─── */
export function GitHubCard({ githubStatus, onConnect }) {
  if (!githubStatus?.connected) {
    return (
      <div className={`${panelBase} p-6`}>
        <h3 className="text-[16px] font-bold text-gray-900 mb-2">GitHub</h3>
        <p className="text-[12px] text-gray-500 mb-4">Connect GitHub to track projects.</p>
        <button 
          onClick={onConnect}
          className={`w-full ${subtleBtn} flex items-center justify-center gap-2`}
        >
           Connect <Github size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`${panelBase} p-6`}>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">GitHub</h3>
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
      <div className="w-12 h-12 bg-[#bc1313]/10 text-[#bc1313] rounded-full flex items-center justify-center mb-3">
        <Plus size={24} />
      </div>
      <h3 className="text-[16px] font-bold text-gray-900 mb-2">Join a new Class</h3>
      <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
        Enter a class code provided by your instructor to join their roster and access your materials.
      </p>
      <button 
        onClick={() => onNavigate('enrolled-classes')}
        className="w-full bg-[#bc1313] hover:bg-[#890E0E] text-white py-2.5 rounded-xl text-[13px] font-bold transition-colors"
      >
        Join Class
      </button>
    </div>
  );
}

/* ─── Enrolled Classes Overview ─── */
export function EnrolledClassesOverview({ classes, onNavigate }) {
  if (!classes || classes.length === 0) {
    return <JoinClassCard onNavigate={onNavigate} />;
  }

  const previewClasses = classes.slice(0, 3);
  const hiddenCount = Math.max(0, classes.length - previewClasses.length);

  return (
    <div className={`${panelBase} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold text-gray-900">Enrolled Classes</h3>
        <span className="text-[11px] font-semibold text-gray-500">{classes.length} total</span>
      </div>

      <div className="space-y-3">
        {previewClasses.map((cls) => (
          <button
            key={cls.id}
            onClick={() => onNavigate('enrolled-classes')}
            className="w-full text-left border border-[#f0dddd] hover:border-[#e8c6c6] bg-white/70 rounded-xl p-3 transition-colors"
          >
            <p className="text-[13px] font-bold text-gray-900 leading-snug truncate">{cls.subject_name}</p>
            <p className="text-[11px] text-gray-500 mt-1">{cls.course_code} • {cls.section}</p>
          </button>
        ))}
      </div>

      {hiddenCount > 0 && (
        <p className="text-[11px] text-gray-500 mt-3">+{hiddenCount} more classes</p>
      )}

      <button
        onClick={() => onNavigate('enrolled-classes')}
        className={`w-full ${subtleBtn} mt-4`}
      >
        View all classes
      </button>
    </div>
  );
}

/* ─── Career Choice Card ─── */
export function CareerChoiceCard({ report }) {
  if (!report || !report.careerOptions || !report.careerOptions.length) {
    return (
      <div className={`${panelBase} p-6 flex flex-col justify-center h-full`}>
        <h3 className="text-[16px] font-bold text-gray-900 mb-2">Career Map</h3>
        <p className="text-[12px] text-gray-500 mb-4">No AI career report generated yet. We analyze your performance to map out a career path.</p>
        <button className={`w-full ${subtleBtn} mt-auto`}>
          Generate map
        </button>
      </div>
    );
  }

  const topCareer = report.careerOptions[0];
  const pct = Math.round((topCareer.matchScore || 0) * 100);
  const size = 64, stroke = 6, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  return (
    <div className={`${panelBase} p-6`}>
      <h3 className="text-[16px] font-bold text-gray-900 mb-5">Top Career Match</h3>
      
      <div className="flex items-center gap-4 mb-5">
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
              stroke="#bc1313"
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-extrabold text-gray-900">{pct}%</span>
          </div>
        </div>
        
        <div>
          <h4 className="text-[14px] font-bold text-gray-900 leading-tight">{topCareer.title}</h4>
          <p className="text-[11px] text-gray-500 mt-1">High probability of success</p>
        </div>
      </div>
      
      <button className={`w-full ${subtleBtn}`}>
        View detailed roadmap
      </button>
    </div>
  );
}

/* ─── CTA Banner ─── */
export function CTABanner() {
  return (
    <div className="bg-linear-to-r from-[#2e0b0b] via-[#3d0f0f] to-[#541515] border border-[#6b2222]/40 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_20px_40px_-24px_rgba(188,19,19,0.75)]">
      <div>
        <h3 className="text-[18px] font-bold text-white mb-1">Ready for your next career milestone?</h3>
        <p className="text-[13px] text-gray-400">Our AI engine has prepared updated career paths based on your latest grades and GitHub activity.</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button className="px-5 py-2.5 bg-[#bc1313] hover:bg-[#890E0E] text-white text-[13px] font-bold rounded-xl transition-colors flex items-center gap-2">
          VIEW ROADMAP <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Dashboard Main View ─── */
export default function StudentDashboardView({ user, onNavigate }) {
  const { classes, predictions, iloCoverage, loading: studentLoading } = useStudentData();
  const { status: githubStatus, repos, loading: githubLoading, connectGithub } = useGithubData();
  const { report, loading: pipelineLoading } = usePipeline(user?.id);

  if (studentLoading) {
    return <StudentDashboardSkeleton />;
  }

  const fullName = user?.full_name || 'Student';
  
  // Aggregate stats from backend
  const masteryScore = iloCoverage.totalMastery || 0;
  const overallOutcome = predictions?.overall_outcome || 'N/A';

  return (
    <div className="p-8 space-y-8 bg-linear-to-br from-[#fff8f8] via-[#fffdfd] to-[#fdf2f2] rounded-3xl border border-[#f2dfdf] shadow-[0_22px_55px_-35px_rgba(188,19,19,0.35)]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Student Overview</p>
          <h1 className="text-[2.2rem] font-extrabold text-gray-900 leading-tight">Welcome back, {fullName}.</h1>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#ead3d3] rounded-xl text-[13px] font-semibold text-[#7a5454] hover:bg-[#fff5f5] transition-colors">
            <Filter size={14} /> Filter
          </button>
          <button className="relative w-9 h-9 border border-[#ead3d3] rounded-xl flex items-center justify-center hover:bg-[#fff5f5] transition-colors">
            <Bell size={16} className="text-[#8b6363]" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Mastery"     value={`${masteryScore}%`}    trend="up"   />
        <StatCard label="Computed Outcome"    value={overallOutcome}        sub="Model Aggregate" />
        <StatCard label="Top Skill"           value={predictions?.top_skills?.[0] || 'N/A'} sub="Strongest predicted skillset" />
        <StatCard label="Career Target"       value="ON TRACK"              badge="On Track" />
      </div>

      {/* Body: Main Left Column & Sidebar Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          {/* ILO + Activity row */}
          <div className="grid md:grid-cols-2 gap-6">
            <ILOCoverage coverage={iloCoverage} />
            <RecentActivity />
          </div>

          {/* Skills row */}
          <div className="grid md:grid-cols-2 gap-6">
            <DevelopingSkills weakSkills={predictions?.weak_skills} aggregatedSkills={predictions?.aggregated_skills} />
            <ExcelledSkills topSkills={predictions?.top_skills} />
          </div>

          {/* Projects */}
          <TopProjects repos={repos} />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <GitHubCard githubStatus={githubStatus} onConnect={connectGithub} />
          <EnrolledClassesOverview classes={classes} onNavigate={onNavigate} />
          <CareerChoiceCard report={report} />
        </div>
        
      </div>

      {/* Full-width CTA */}
      <CTABanner />

    </div>
  );
}
