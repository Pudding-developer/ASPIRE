import { useState } from 'react';
import {
  Github, Star, GitFork, RefreshCw,
  AlertCircle, Circle, LogOut
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useGithubData from '../hooks/useGithubData';
import ContributionActivity from '../components/ContributionActivity';
import ActivityHistoryModal from '../components/ActivityHistoryModal';

/* ─── Language color map ─── */
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
  CSS: '#563d7c', Python: '#3572A5', Java: '#b07219', Dart: '#00B4AB',
  Ruby: '#701516', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  PHP: '#4F5D95', Rust: '#dea584', Go: '#00ADD8', Kotlin: '#A97BFF',
  Swift: '#F05138', Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B',
  Shell: '#89e051', Dockerfile: '#384d54', SCSS: '#c6538c',
  Code: '#8b949e',
};
const getLangColor = (lang) => LANG_COLORS[lang] || '#8b949e';

/* ─── Contribution cell color (GitHub scale) ─── */
function getContribColor(count) {
  if (!count) return '#161b22';
  if (count <= 3)  return '#0e4429';
  if (count <= 6)  return '#006d32';
  if (count <= 10) return '#26a641';
  return '#39d353';
}

/* ─── GitHub-style Contribution Graph ─── */
function ContributionGraph({ calendar = [] }) {
  const [tooltip, setTooltip] = useState(null);

  // Sort and group into weeks (Sun → Sat columns)
  const sorted = [...calendar].sort((a, b) => new Date(a.date) - new Date(b.date));
  const weeks = [];
  let week = [];

  sorted.forEach((day, i) => {
    const dow = new Date(day.date).getUTCDay();
    if (i === 0 && dow !== 0) {
      for (let p = 0; p < dow; p++) week.push(null);
    }
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // Month labels above graph
  const monthLabels = [];
  let lastMonth = null;
  weeks.forEach((w, wi) => {
    const first = w.find(Boolean);
    if (!first) return;
    const m = new Date(first.date).toLocaleString('default', { month: 'short' });
    if (m !== lastMonth) { monthLabels.push({ col: wi, label: m }); lastMonth = m; }
  });

  const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const CELL = 13;
  const GAP  = 3;

  return (
    <div className="relative overflow-x-auto">
      <div style={{ display: 'flex', gap: 8 }}>

        {/* Day-of-week labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: CELL + GAP + 2 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ height: CELL, lineHeight: `${CELL}px`, fontSize: 10, color: '#8b949e', textAlign: 'right', width: 28, whiteSpace: 'nowrap' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Graph */}
        <div>
          {/* Month row */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`, gap: GAP, marginBottom: 4 }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} style={{ fontSize: 10, color: '#8b949e', overflow: 'visible', whiteSpace: 'nowrap' }}>
                  {lbl ? lbl.label : ''}
                </div>
              );
            })}
          </div>

          {/* Cells grid: rows = day of week, cols = weeks */}
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {weeks.map((w, wi) =>
              w.map((day, di) => {
                if (!day) return <div key={`${wi}-${di}`} style={{ width: CELL, height: CELL }} />;
                const count = day.contributionCount;
                const color = getContribColor(count);
                const label = new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                });
                return (
                  <div
                    key={`${wi}-${di}`}
                    style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: color, cursor: 'default' }}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setTooltip({ x: r.left + window.scrollX, y: r.top + window.scrollY - 36,
                        text: count === 0
                          ? `No contributions on ${label}`
                          : `${count} contribution${count !== 1 ? 's' : ''} on ${label}` });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span style={{ fontSize: 10, color: '#8b949e' }}>Less</span>
        {['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: c, border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
        <span style={{ fontSize: 10, color: '#8b949e' }}>More</span>
      </div>

      {/* Tooltip portal */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y, zIndex: 9999,
          background: '#1c2128', border: '1px solid #30363d', borderRadius: 8,
          padding: '5px 10px', fontSize: 11, color: '#c9d1d9',
          pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

/* ─── Skill Pill ─── */
function SkillPill({ name, pct, dotColor }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-full text-[12px] font-medium text-[#c9d1d9] shadow-sm hover:bg-[#30363d] transition-colors cursor-default">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      {name}
      <span className="font-bold text-[#8b949e]">{pct}%</span>
    </span>
  );
}

/* ─── Main View ─── */
export default function StudentGitHubView({ user }) {
  const {
    status, summary, repos, contributions,
    loading, runAnalysis, isAnalyzing,
    connectGithub, disconnectGithub, isDisconnecting,
  } = useGithubData();

  const location = useLocation();
  const navigate = useNavigate();
  const urlError = new URLSearchParams(location.search).get('error');
  const clearUrlError = () => navigate('/student/github', { replace: true });

  const [showActivityModal, setShowActivityModal] = useState(false);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={28} className="text-[#8b949e] animate-spin" />
          <p className="text-[#8b949e] text-sm font-medium">Loading GitHub Analytics...</p>
        </div>
      </div>
    );
  }

  const isConnected = status?.connected;
  const hasAnalysis = status?.has_analysis;

  /* ── Not connected ── */
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-center gap-4 p-8">
        <Github size={52} className="text-[#8b949e]" />
        <h2 className="text-2xl font-extrabold text-[#c9d1d9]">GitHub Not Connected</h2>
        <p className="text-sm text-[#8b949e] max-w-sm">Connect your GitHub account to analyze your repositories, commits, and detect your technical stack.</p>
        <button onClick={connectGithub}
          className="mt-2 px-6 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)]">
          <Github size={16} /> Connect GitHub
        </button>
      </div>
    );
  }

  /* ── Analysis required ── */
  if (!hasAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-center gap-4 p-8">
        <Github size={52} className="text-[#c9d1d9]" />
        <h2 className="text-2xl font-extrabold text-[#c9d1d9]">Analysis Required</h2>
        <p className="text-sm text-[#8b949e] max-w-sm">Your GitHub is connected. Run the first analysis to pull your repositories, skills, and contribution data.</p>
        <button onClick={runAnalysis} disabled={isAnalyzing}
          className="mt-2 px-6 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)] disabled:opacity-50">
          <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Analyzing…' : 'Run Analysis Now'}
        </button>
      </div>
    );
  }

  /* ── Derive language totals ── */
  const langTotals = {};
  let totalBytes = 0;
  repos.forEach(repo => {
    Object.entries(repo.languages || {}).forEach(([lang, size]) => {
      langTotals[lang] = (langTotals[lang] || 0) + size;
      totalBytes += size;
    });
  });
  const topLangs = Object.entries(langTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const skillList = topLangs.slice(0, 8).map(([lang, size]) => ({
    name: lang,
    pct: Math.round((size / (totalBytes || 1)) * 100),
    dotColor: getLangColor(lang),
  }));

  /* ── Connected dashboard ── */
  return (
    <div className="p-6 lg:p-8 bg-[#0d1117] min-h-screen text-[#c9d1d9] space-y-6">

      {/* Error banner */}
      {urlError && (
        <div className="p-4 bg-[#bc1313]/10 border border-[#bc1313]/50 rounded-xl flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-[#ff7b72]" />
            <p className="text-sm font-semibold text-[#ff7b72]">{decodeURIComponent(urlError)}</p>
          </div>
          <button onClick={clearUrlError} className="text-[#8b949e] hover:text-[#c9d1d9] text-lg leading-none">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {status.github_avatar_url && (
            <img src={status.github_avatar_url} alt="avatar"
              className="w-14 h-14 rounded-full border-2 border-[#30363d]" />
          )}
          <div>
            <h1 className="text-[1.5rem] font-extrabold text-[#c9d1d9] leading-tight">{status.github_username}</h1>
            <p className="text-[11px] text-[#8b949e] mt-0.5 flex items-center gap-1.5">
              <Circle size={6} className="fill-[#2ea043] text-[#2ea043]" />
              Synced {new Date(status.last_analyzed).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={disconnectGithub} disabled={isAnalyzing || isDisconnecting}
            className="flex items-center gap-2 px-4 py-2 bg-[#bc1313]/10 text-[#ff7b72] border border-[#bc1313]/50 rounded-xl text-[13px] font-bold hover:bg-[#bc1313]/20 transition-all disabled:opacity-50">
            {isDisconnecting ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
          <button onClick={runAnalysis} disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-xl text-[13px] font-bold hover:bg-[#30363d] hover:border-[#8b949e] transition-all disabled:opacity-50">
            <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? 'Running…' : 'Re-analyze'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL CONTRIBUTIONS', value: contributions?.total_contributions ?? summary?.total_contributions ?? 0 },
          { label: 'TOTAL COMMITS',      value: summary?.total_commits || 0        },
          { label: 'PRIMARY LANGUAGE',   value: summary?.top_language || '—'       },
          { label: 'CURRENT STREAK',     value: `${summary?.current_streak || 0} days`  },
          { label: 'LONGEST STREAK',     value: `${summary?.longest_streak || 0} days`  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2">{label}</p>
            <p className="text-[1.65rem] font-extrabold text-[#c9d1d9] leading-none truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Repos + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Repositories */}
        <div className="lg:col-span-2">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-[#c9d1d9]">Repositories</h3>
              <span className="bg-[#1f2428] border border-[#30363d] px-2 py-0.5 rounded-full text-[11px] font-bold text-[#c9d1d9]">
                {repos.length}
              </span>
            </div>
            {repos.length === 0 ? (
              <p className="text-center text-[#8b949e] py-8">No repositories found.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 max-h-[640px] overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' }}>
                {repos.map(repo => (
                  <div key={repo.repo_name}
                    className="border border-[#30363d] bg-[#0d1117] rounded-xl p-4 flex flex-col gap-2 hover:border-[#8b949e] transition-colors">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <a href={`https://github.com/${repo.repo_full_name}`} target="_blank" rel="noreferrer"
                        className="text-[14px] font-semibold text-[#58a6ff] hover:underline leading-tight">
                        {repo.repo_name}
                      </a>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {repo.is_pinned && (
                          <span className="text-[9px] border border-[#58a6ff]/50 text-[#58a6ff] px-1.5 py-0.5 rounded-full">Pinned</span>
                        )}
                      </div>
                    </div>

                    {/* Topics */}
                    {repo.topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {repo.topics.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] font-medium bg-[#1158c71a] text-[#58a6ff] px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-[12px] text-[#8b949e] leading-relaxed line-clamp-2 flex-1">
                      {repo.description || 'No description provided.'}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-3 text-[12px] text-[#8b949e]">
                        <span className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors">
                          <Star size={12} /> {repo.stargazer_count}
                        </span>
                        <span className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors">
                          <GitFork size={12} /> {repo.fork_count}
                        </span>
                        {repo.commit_count > 0 && (
                          <span className="text-[11px]">{repo.commit_count.toLocaleString()} commits</span>
                        )}
                      </div>
                      {repo.primary_language && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8b949e]">
                          <span className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getLangColor(repo.primary_language) }} />
                          {repo.primary_language}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Contribution Graph */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <h3 className="text-[15px] font-bold text-[#c9d1d9] mb-1">Contribution Activity</h3>
            <p className="text-[12px] text-[#8b949e] mb-4">
              {contributions?.total_contributions ?? summary?.total_contributions ?? 0} contributions in the last year
            </p>
            {contributions?.calendar?.length
              ? <ContributionGraph calendar={contributions.calendar.slice(-90)} />
              : <p className="text-[#8b949e] text-xs text-center py-4">No contribution data available.</p>
            }
          </div>

          <ContributionActivity 
            activities={contributions?.activities || []} 
            onClickShowMore={() => setShowActivityModal(true)} 
          />



          {/* Language pills */}
          {skillList.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
              <h3 className="text-[15px] font-bold text-[#c9d1d9] mb-4">Detected Languages</h3>
              <div className="flex flex-wrap gap-2">
                {skillList.map(s => <SkillPill key={s.name} {...s} />)}
              </div>
            </div>
          )}

        </div>
      </div>

      <ActivityHistoryModal 
        isOpen={showActivityModal} 
        onClose={() => setShowActivityModal(false)} 
        activities={contributions?.activities || []} 
      />
    </div>
  );
}
