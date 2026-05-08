import React, { useState, useEffect, useRef } from 'react';
import { Layers, Zap, AlertCircle, Bot, CheckCircle2, Lightbulb, AlertTriangle, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import useCareerCoach from '../hooks/useCareerCoach';

import CareerEmptyState from '../components/CareerEmptyState';
import CareerPicker from '../components/CareerPicker';
import CareerPathCard from '../components/CareerPathCard';
import CareerMatchDonut from '../components/CareerMatchDonut';
import CareerAllPathsModal from '../components/CareerAllPathsModal';
import CareerSectionHeading from '../components/CareerSectionHeading';
import RoadmapViewer from '../components/RoadmapViewer';
import AnalysisProgressionModal from '../components/AnalysisProgressionModal';
import AnalysisProgressionCard from '../components/AnalysisProgressionCard';



/* Map raw backend/litellm errors to messages a student can act on. */
function friendlyPipelineError(raw) {
  const s = String(raw);
  if (
    s.includes('RESOURCE_EXHAUSTED') ||
    s.includes('RateLimitError') ||
    s.includes('429') ||
    /Timeout: Connection timed out after None/i.test(s)
  ) {
    return 'The AI service hit its rate limit. Wait ~60 seconds and try again.';
  }
  if (s.includes('BILLING_DISABLED') || s.includes('billing to be enabled')) {
    return 'AI Pipeline error: Google Cloud billing is disabled for this project. Please enable billing in the Google Cloud Console.';
  }
  if (/network|ECONNRESET|ENETUNREACH|fetch failed/i.test(s)) {
    return 'Network error talking to the AI service. Check your connection and try again.';
  }
  if (s.includes('VertexAIException') || s.length > 200) {
    return 'AI Pipeline execution failed. Please check backend logs or configuration.';
  }
  return s;
}


export default function StudentCareerView({ user }) {
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [activeTab, setActiveTab] = useState('Roadmap');

  const {
    pipelineData,
    reportCreatedAt,
    loading,
    error,
    careerMatches,
    selectedPath,
    selectedIndex,
    setSelectedIndex,
    activeTitle,
    optimalIndex,
    gaps,
    skills,
    insights,
    recommendations,
    runPipeline,
    pipelineStatus,
    isRunning,
    progression,
    chosenCareer,
    setChosenCareer,
    careerLoading,
    visibleCareerTitles,
    showCareer,
    hideCareer,
  } = useCareerCoach(user.id);

  const [toast, setToast] = useState(null);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const seenReportRef = useRef(undefined);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Show toast on pipeline error
  useEffect(() => {
    if (error) {
      setToast({ message: friendlyPipelineError(error), type: 'error' });
    }
  }, [error]);

  // Pop the progression modal each time a NEW analysis report lands.
  // The first render seeds seenReportRef with the existing report timestamp
  // so we don't show the modal for an old report on initial page load.
  useEffect(() => {
    if (seenReportRef.current === undefined) {
      seenReportRef.current = reportCreatedAt || null;
      return;
    }
    if (reportCreatedAt && reportCreatedAt !== seenReportRef.current) {
      seenReportRef.current = reportCreatedAt;
      if (progression) setProgressionOpen(true);
    }
  }, [reportCreatedAt, progression]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mb-4 px-8"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!pipelineData || !careerMatches || careerMatches.length === 0) {
    if (isRunning) {
      return (
        <CareerEmptyState
          onGenerate={runPipeline}
          isRunning={isRunning}
          pipelineStatus={pipelineStatus}
          error={error}
        />
      );
    }
    return (
      <CareerPicker
        chosenCareer={chosenCareer}
        onChoose={setChosenCareer}
        careerLoading={careerLoading}
        onGenerateReport={runPipeline}
        isRunning={isRunning}
        pipelineError={error}
      />
    );
  }

  return (
    <div className="p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#70170f] animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-[0.2em]">AI CAREER COACH ACTIVE</span>
          </div>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-none">Career Strategy Engine</h1>
          <p className="text-[12px] text-gray-500 mt-2 font-medium">Personalized roadmap based on your academic performance & GitHub activity</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3">
            <button
              onClick={() => setShowAllPaths(true)}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <Layers size={14} className="text-[#70170f]" /> VIEW ALL PATHS
            </button>
            <button
              onClick={() => runPipeline({ force: true })}
              disabled={isRunning}
              className="px-5 py-2.5 bg-[#70170f] text-white rounded-xl text-[12px] font-bold hover:bg-[#4a0e09] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Zap size={14} className={isRunning ? 'animate-pulse' : ''} /> {isRunning ? 'ANALYZING...' : 'REFRESH ANALYSIS'}
            </button>
          </div>

          {isRunning && pipelineStatus && pipelineStatus.status !== 'failed' && (
            <div className="w-full max-w-xs bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-gray-700 truncate pr-2">
                  {pipelineStatus.current_step || 'Starting...'}
                </span>
                <span className="text-[10px] font-bold text-[#70170f]">
                  {pipelineStatus.percentage ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#70170f] transition-all duration-500"
                  style={{ width: `${pipelineStatus.percentage ?? 0}%` }}
                />
              </div>
            </div>
          )}


        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto">
        {['Roadmap', 'Insights'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#70170f]' : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#70170f] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {/* Path Card Warning & Selection (Show for all tabs except Chat maybe? No, show always) */}
        {activeTab !== 'AI Chat' && (
          <>
            {selectedIndex >= 0 && selectedIndex !== optimalIndex && (
              <div className="bg-[#fff4f4] border border-[#f2cdcd] p-3.5 mb-6 rounded-lg flex items-start gap-3">
                <div className="w-4.5 h-4.5 rounded-full bg-[#70170f] text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-extrabold italic">!</div>
                <p className="text-[12px] text-gray-800 leading-relaxed">
                  <strong>AI Recommendation:</strong> Your data shows stronger alignment with <strong className="text-[#70170f]">{careerMatches[optimalIndex]?.title}</strong>.
                </p>
              </div>
            )}
            {(() => {
              if (visibleCareerTitles.size === 0) {
                return (
                  <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 mb-8 text-center">
                    <p className="text-[12px] text-gray-500 mb-3">
                      No career paths pinned yet. Open <strong>View All Paths</strong> to add one.
                    </p>
                    <button
                      onClick={() => setShowAllPaths(true)}
                      className="px-4 py-2 bg-[#70170f] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#4a0e09] transition-colors inline-flex items-center gap-2"
                    >
                      <Layers size={12} /> Browse All Paths
                    </button>
                  </div>
                );
              }

              // Build a card entry for every pinned title. If the AI scored
              // that title we use the analysis; otherwise we render a stub
              // card flagged as `unanalyzed` so the student still sees what
              // they pinned.
              const matchByTitle = new Map(careerMatches.map((m, i) => [m.title, { match: m, idx: i }]));
              const visibleEntries = [...visibleCareerTitles].map((title) => {
                const hit = matchByTitle.get(title);
                if (hit) return { ...hit, unanalyzed: false };
                return {
                  match: { title, match_score: null, matched_skills: [], gap_skills: [], reasoning: '' },
                  idx: -1,
                  unanalyzed: true,
                };
              });

              return (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x mb-8">
                  {visibleEntries.map(({ match, idx, unanalyzed }) => (
                    <CareerPathCard
                      key={match.title}
                      match={match}
                      index={idx}
                      selected={selectedIndex === idx && !unanalyzed
                        ? true
                        : selectedIndex === -1 && unanalyzed && match.title === activeTitle}
                      optimal={!unanalyzed && idx === optimalIndex}
                      onSelect={() => setSelectedIndex(match.title)}
                      isChosenGoal={chosenCareer === match.title}
                      onSetAsGoal={() => setChosenCareer(match.title)}
                      onHide={() => hideCareer(match.title)}
                      unanalyzed={unanalyzed}
                      careerLoading={careerLoading}
                    />
                  ))}
                </div>
              );
            })()}
          </>
        )}

        {activeTab === 'Roadmap' && (
          <div className="space-y-8">
            {!selectedPath && activeTitle && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-amber-900 mb-1">
                    Aspirational career goal
                  </p>
                  <p className="text-[12px] text-amber-800 leading-relaxed mb-3">
                    {activeTitle} hasn't been analyzed yet for your profile. The roadmap below shows the standard learning path, but you'll need to run the AI analyzer to get a personalized match score, skill breakdown, and gap analysis.
                  </p>
                  <button
                    onClick={runPipeline}
                    disabled={isRunning}
                    className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={11} className={isRunning ? 'animate-pulse' : ''} />
                    {isRunning ? 'ANALYZING...' : 'RUN AI ANALYZER'}
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Primary Objective — takes 2/3 of the row */}
              <div className="lg:col-span-2">
                <CareerSectionHeading title="PRIMARY OBJECTIVE" />
                <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-[20px] font-extrabold text-gray-900 leading-tight">Senior {activeTitle}</h2>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MATCH SCORE</span>
                      {selectedPath ? (
                        <span className="text-[16px] font-black text-[#70170f]">
                          {selectedPath.match_score}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Not analyzed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 scale-110"><CareerMatchDonut score={selectedPath?.match_score || 0} /></div>
                </div>
              </div>

              {/* Analysis Progression — takes 1/3 of the row, all data inline */}
              <div>
                <CareerSectionHeading title="ANALYSIS PROGRESSION" />
                <div className="mt-4">
                  <AnalysisProgressionCard progression={progression} />
                </div>
              </div>
            </div>
            <CareerSectionHeading title="LEARNING ROADMAP" />
            <RoadmapViewer careerTitle={activeTitle} />

            <CareerSectionHeading title="SKILL GAP ANALYSIS" />
            {/* Gaps grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gaps.map((g, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-gray-700">{g.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${g.status === 'acquired' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {g.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Recommendations — filtered to match the active career's gap skills */}
            {recommendations && recommendations.length > 0 && (() => {
              // Build a set of the active career's gap skill names (lower-case for matching)
              const gapSkillNames = selectedPath
                ? (selectedPath.gap_skills || []).map(s =>
                    (typeof s === 'string' ? s : s?.name || '').toLowerCase()
                  ).filter(Boolean)
                : [];

              // Filter: keep recs that mention at least one gap skill of the active career.
              // If there are no gap skills (unanalyzed path) fall back to showing all.
              const filtered = gapSkillNames.length > 0
                ? recommendations.filter(rec =>
                    gapSkillNames.some(skill => rec.toLowerCase().includes(skill))
                  )
                : recommendations;

              const hasFiltered = filtered.length > 0;

              return (
                <>
                  <CareerSectionHeading title="AI RECOMMENDATIONS" />
                  {hasFiltered ? (
                    <div className="space-y-3">
                      {filtered.map((rec, i) => (
                        <div
                          key={i}
                          className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 shadow-xs"
                        >
                          <div className="w-6 h-6 rounded-full bg-[#70170f]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight size={12} className="text-[#70170f]" />
                          </div>
                          <p className="text-[12px] text-gray-700 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-5 text-center">
                      <p className="text-[12px] text-gray-500">
                        The last analysis generated recommendations for a different career path.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Run the analyzer with <strong className="text-gray-600">{activeTitle}</strong> selected to get tailored recommendations.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'Insights' && (
          <InsightsTab
            insights={insights}
            activeTitle={activeTitle}
            selectedPath={selectedPath}
            reportCreatedAt={reportCreatedAt}
            runPipeline={runPipeline}
            isRunning={isRunning}
          />
        )}


      </div>

      {showAllPaths && (
        <CareerAllPathsModal
          matches={careerMatches}
          optimalIndex={optimalIndex}
          visibleTitles={visibleCareerTitles}
          onSelect={(idx) => {
            const title = careerMatches[idx]?.title;
            if (title) showCareer(title);
            setSelectedIndex(idx);
          }}
          onPin={(title) => showCareer(title)}
          onUnpin={(title) => hideCareer(title)}
          onClose={() => setShowAllPaths(false)}
        />
      )}

      {progressionOpen && (
        <AnalysisProgressionModal
          progression={progression}
          careerTitle={activeTitle}
          onClose={() => setProgressionOpen(false)}
        />
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl text-[12px] font-medium shadow-xl border ${toast.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-green-50 border-green-200 text-green-700'
          }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' && <AlertCircle size={16} />}
            <span className="leading-relaxed break-words max-w-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Insights tab ───────────────────────────────────────────────── */

const INSIGHT_TYPE_META = {
  pos: {
    label: 'Strengths',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    accent: 'border-emerald-100 bg-emerald-50/50',
    chipColor: 'bg-emerald-100 text-emerald-700',
  },
  tip: {
    label: 'Focus areas',
    icon: Lightbulb,
    iconColor: 'text-amber-500',
    accent: 'border-amber-100 bg-amber-50/50',
    chipColor: 'bg-amber-100 text-amber-700',
  },
  warn: {
    label: 'Watchouts',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    accent: 'border-red-100 bg-red-50/50',
    chipColor: 'bg-red-100 text-red-700',
  },
};

function formatTimeAgo(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  if (isNaN(then.getTime())) return null;
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function InsightItem({ insight, meta }) {
  const Icon = meta.icon;
  return (
    <div className={`p-5 flex gap-4 items-start border rounded-xl ${meta.accent}`}>
      <Icon className={`${meta.iconColor} mt-0.5 shrink-0`} size={18} />
      <div className="flex-1 min-w-0">
        {insight.badge && (
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-1.5 ${meta.chipColor}`}>
            {insight.badge}
          </span>
        )}
        <p
          className="text-[13px] text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: insight.text }}
        />
      </div>
    </div>
  );
}

function InsightsTab({ insights, activeTitle, selectedPath, reportCreatedAt, runPipeline, isRunning }) {
  const grouped = ['pos', 'tip', 'warn'].map(type => ({
    type,
    meta: INSIGHT_TYPE_META[type],
    items: insights.filter(i => i.type === type),
  })).filter(g => g.items.length > 0);

  const hasAny = insights.length > 0;
  const timeAgo = formatTimeAgo(reportCreatedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <CareerSectionHeading title="AI CAREER INSIGHTS" />
        {hasAny && (
          <div className="flex items-center gap-3">
            {timeAgo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <Clock size={12} /> Last analyzed {timeAgo}
              </span>
            )}
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 rounded-lg text-[11px] font-bold transition-colors"
            >
              <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'ANALYZING...' : 'RE-ANALYZE'}
            </button>
          </div>
        )}
      </div>

      {hasAny ? (
        <div className="space-y-6">
          {grouped.map(({ type, meta, items }) => (
            <section key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-700">
                  {meta.label}
                </h3>
                <span className="text-[11px] font-semibold text-gray-400">
                  ({items.length})
                </span>
              </div>
              <div className="space-y-2">
                {items.map((ins, i) => (
                  <InsightItem key={i} insight={ins} meta={meta} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl">
          <div className="p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Zap size={20} className="text-[#70170f]" />
            </div>
            <p className="text-[14px] font-bold text-gray-900">
              No insights yet for {activeTitle}
            </p>
            <p className="text-[12px] text-gray-500 max-w-md leading-relaxed">
              {selectedPath
                ? "Insights will appear here once the AI completes its analysis of this career path."
                : `${activeTitle} hasn't been analyzed yet. Run the AI analyzer to get a match score, skill breakdown, and personalized insights for this career.`}
            </p>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="mt-2 px-5 py-2 bg-[#70170f] text-white rounded-lg text-[11px] font-bold hover:bg-[#4a0e09] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Zap size={12} className={isRunning ? 'animate-pulse' : ''} />
              {isRunning ? 'ANALYZING...' : 'RUN AI ANALYZER'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
