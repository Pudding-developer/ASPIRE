import React, { useState, useRef, useEffect } from 'react';
import { Target, TrendingUp, Layers, ChevronRight, Activity, Zap, CheckCircle2, ChevronDown, ListEnd, Star, Plus, MessageSquare, AlertCircle, Loader2, Trash2, Square, Bot } from 'lucide-react';
import useCareerCoach from '../hooks/useCareerCoach';
import { chatService } from '../../../../services/chatService';

import CareerEmptyState from '../components/CareerEmptyState';
import CareerPicker from '../components/CareerPicker';
import CareerPathCard from '../components/CareerPathCard';
import CareerMatchDonut from '../components/CareerMatchDonut';
import CareerAllPathsModal from '../components/CareerAllPathsModal';
import CareerSectionHeading from '../components/CareerSectionHeading';
import RoadmapViewer from '../components/RoadmapViewer';

const CHAT_SUGGESTIONS = [
  'How do I improve my match score?',
  'What should I focus on first?',
  'Which path fits me best?',
  'Show me my skill gaps',
];

const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: formatChatMarkdown(displayedText) }} />;
};

/**
 * Lightweight Markdown → HTML formatter for chat messages.
 * Handles **bold**, *italic*, `inline code`, leading bullet markers, and line breaks.
 * HTML-escapes the input first so model output can't inject arbitrary tags.
 */
function formatChatMarkdown(text) {
  if (!text) return '';
  let s = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // **bold** — must come before italic so single-* doesn't eat the wrappers
  s = s.replace(/\*\*([^\n*][^\n]*?)\*\*/g, '<strong>$1</strong>');
  // *italic* — single * not adjacent to another *
  s = s.replace(/(^|[^*])\*(?!\s)([^\n*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  // `inline code`
  s = s.replace(/`([^`\n]+?)`/g, '<code class="bg-gray-100 px-1 rounded text-[11px]">$1</code>');
  // leading bullet markers on a line: "* item" or "- item" → "• item"
  s = s.replace(/(^|<br\/>)\s*[*-]\s+/g, '$1• ');
  // newlines — done last so the bullet replacement above can rely on raw \n
  s = s.replace(/\n/g, '<br/>');
  return s;
}

export default function StudentCareerView({ user }) {
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [activeTab, setActiveTab] = useState('Roadmap');

  const {
    pipelineData,
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

  // ── AI Chat state ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [thinkingPhrase, setThinkingPhrase] = useState('Thinking');
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, chatSending]);

  // Rotate the "thinking..." phrase every 2.5s while the AI is replying.
  useEffect(() => {
    if (!chatSending) return;
    const phrases = [
      'Thinking',
      'Reviewing your skills',
      'Checking your roadmap',
      'Analyzing your data',
      'Crafting a response',
    ];
    let i = 0;
    setThinkingPhrase(phrases[0]);
    const tick = setInterval(() => {
      i = (i + 1) % phrases.length;
      setThinkingPhrase(phrases[i]);
    }, 2500);
    return () => clearInterval(tick);
  }, [chatSending]);

  // Load session list
  useEffect(() => {
    if (activeTab === 'AI Chat') {
      chatService.listSessions().then(setSessionList).catch(console.error);
    }
  }, [activeTab]);

  const loadSession = async (id) => {
    setSessionId(id);
    setSessionLoading(true);
    try {
      const data = await chatService.getSession(id);
      setChatMessages(data.messages || []);
    } catch (e) {
      setChatError('Failed to load chat history.');
    } finally {
      setSessionLoading(false);
    }
  };

  const deleteSession = async (id) => {
    try {
      await chatService.deleteSession(id);
      setSessionList(prev => prev.filter(s => s.session_id !== id));
      if (sessionId === id) {
        setSessionId(null);
        setChatMessages([]);
      }
    } catch (e) {
      setChatError(e.message || 'Failed to delete session.');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const createNewSession = async () => {
    setSessionLoading(true);
    try {
      const context = {
        career_matches: careerMatches,
        skill_profile: pipelineData?.report?.skill_profile,
        summary: pipelineData?.report?.summary,
        chosen_career: chosenCareer
      };
      const resp = await chatService.createSession(context);
      setSessionId(resp.session_id);
      setChatMessages([]);
      const updated = await chatService.listSessions();
      setSessionList(updated);
    } catch (e) {
      setChatError('Failed to create new chat session.');
    } finally {
      setSessionLoading(false);
    }
  };

  const sendChat = async (textOverride) => {
    const text = (textOverride ?? chatInput).trim();
    if (!text || chatSending) return;

    const wasFirstMessage = chatMessages.length === 0;
    let targetSessionId = sessionId;
    setChatInput('');
    setChatError(null);
    setChatSending(true);

    try {
      if (!targetSessionId) {
        const context = {
          career_matches: careerMatches,
          skill_profile: pipelineData?.report?.skill_profile,
          summary: pipelineData?.report?.summary,
          chosen_career: chosenCareer
        };
        const resp = await chatService.createSession(context);
        targetSessionId = resp.session_id;
        setSessionId(targetSessionId);
        const updated = await chatService.listSessions();
        setSessionList(updated);
      }

      const nextMessages = [...chatMessages, { role: 'user', content: text }];
      setChatMessages(nextMessages);

      const controller = new AbortController();
      abortRef.current = controller;

      const { reply } = await chatService.sendCareerMessage(
        targetSessionId,
        text,
        {
          career_matches: careerMatches,
          skill_profile: pipelineData?.report?.skill_profile,
          summary: pipelineData?.report?.summary,
          chosen_career: chosenCareer,
        },
        { signal: controller.signal },
      );

      setChatMessages([...nextMessages, { role: 'assistant', content: reply, isNew: true }]);

      // Backend auto-titles the session from the first exchange — refresh so the new label appears.
      if (wasFirstMessage) {
        try {
          const refreshed = await chatService.listSessions();
          setSessionList(refreshed);
        } catch {
          // non-critical; the new title shows up on next page load anyway
        }
      }
    } catch (e) {
      // User pressed Cancel — drop the in-flight request silently.
      if (e?.name === 'AbortError') {
        // Roll back the optimistic user message so they can retry.
        setChatMessages(chatMessages);
        setChatInput(text);
      } else {
        setChatError(e.message || 'Failed to reach the AI coach.');
      }
    } finally {
      abortRef.current = null;
      setChatSending(false);
    }
  };

  const cancelChat = () => {
    abortRef.current?.abort();
  };

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
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#bc1313] animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#bc1313] uppercase tracking-[0.2em]">AI CAREER COACH ACTIVE</span>
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
              <Layers size={14} className="text-[#bc1313]" /> VIEW ALL PATHS
            </button>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="px-5 py-2.5 bg-[#bc1313] text-white rounded-xl text-[12px] font-bold hover:bg-[#890E0E] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <Zap size={14} className={isRunning ? 'animate-pulse' : ''} /> {isRunning ? 'ANALYZING...' : 'REFRESH ANALYSIS'}
            </button>
          </div>

          {isRunning && pipelineStatus && (
            <div className="w-full max-w-xs bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-gray-700 truncate pr-2">
                  {pipelineStatus.current_step || 'Starting...'}
                </span>
                <span className="text-[10px] font-bold text-[#bc1313]">
                  {pipelineStatus.percentage ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#bc1313] transition-all duration-500"
                  style={{ width: `${pipelineStatus.percentage ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {!isRunning && error && (
            <div className="text-[10px] font-medium text-[#bc1313] bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 max-w-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto">
        {['Roadmap', 'Insights', 'AI Chat'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab ? 'text-[#bc1313]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#bc1313] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {/* Path Card Warning & Selection (Show for all tabs except Chat maybe? No, show always) */}
        {activeTab !== 'AI Chat' && (
          <>
            {selectedIndex >= 0 && selectedIndex !== optimalIndex && (
              <div className="bg-[#fff4f4] border border-[#f2cdcd] p-3.5 mb-6 rounded-lg flex items-start gap-3">
                <div className="w-4.5 h-4.5 rounded-full bg-[#bc1313] text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-extrabold italic">!</div>
                <p className="text-[12px] text-gray-800 leading-relaxed">
                  <strong>AI Recommendation:</strong> Your data shows stronger alignment with <strong className="text-[#bc1313]">{careerMatches[optimalIndex]?.title}</strong>.
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
                      className="px-4 py-2 bg-[#bc1313] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#890E0E] transition-colors inline-flex items-center gap-2"
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
            <CareerSectionHeading title="PRIMARY OBJECTIVE" />
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">Senior {activeTitle}</h2>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MATCH SCORE</span>
                  <span className="text-[18px] font-black text-[#bc1313]">
                    {selectedPath ? `${selectedPath.match_score}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="shrink-0 scale-125"><CareerMatchDonut score={selectedPath?.match_score || 0} /></div>
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
          </div>
        )}

        {activeTab === 'Insights' && (
          <div className="space-y-8">
             <CareerSectionHeading title="AI CAREER INSIGHTS" />
             <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
               {insights.map((ins, i) => (
                 <div key={i} className="p-5 flex gap-4 items-start">
                   {ins.type === 'pos' ? <CheckCircle2 className="text-emerald-500 mt-1" size={18} /> : <AlertCircle className="text-red-500 mt-1" size={18} />}
                   <p className="text-[13px] text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: ins.text }} />
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'AI Chat' && (
          <div className="flex flex-col md:flex-row gap-6 h-[500px]">
            {/* Session Sidebar */}
            <div className="w-full md:w-64 flex flex-col gap-3">
              <button 
                onClick={createNewSession}
                disabled={sessionLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#fff3f3] border-2 border-dashed border-[#f1d7d7] rounded-xl text-[#bc1313] text-[11px] font-bold hover:bg-[#ffebeb] transition-all"
              >
                <Plus size={14} /> NEW SESSION
              </button>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {sessionList.map(s => {
                  const isActive = sessionId === s.session_id;
                  const isConfirming = pendingDeleteId === s.session_id;

                  if (isConfirming) {
                    return (
                      <div
                        key={s.session_id}
                        className="w-full p-3 rounded-xl border border-red-200 bg-red-50 flex items-center gap-2"
                      >
                        <p className="flex-1 text-[11px] font-bold text-red-700 truncate">Delete this chat?</p>
                        <button
                          type="button"
                          onClick={() => deleteSession(s.session_id)}
                          className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="px-2 py-1 bg-white text-gray-600 border border-gray-200 text-[10px] font-bold rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.session_id}
                      className={`group w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        isActive ? 'bg-white border-[#f1d7d7] shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => loadSession(s.session_id)}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left"
                      >
                        <MessageSquare size={14} className={isActive ? 'text-[#bc1313]' : 'text-gray-400'} />
                        <div className="flex-1 truncate">
                          <p className={`text-[11px] font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(s.session_id); }}
                        aria-label="Delete chat"
                        className="shrink-0 p-1 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-white border border-[#f1d7d7] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-[#fffbfc] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">AI CAREER ASSISTANT</span>
                {sessionLoading && <div className="animate-spin w-3 h-3 border-2 border-[#bc1313] border-t-transparent rounded-full" />}
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-10 h-10 bg-[#fff3f3] rounded-xl flex items-center justify-center mb-4"><Star size={18} className="text-[#bc1313]" /></div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">How can I help you today?</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm mt-1 overflow-hidden ${
                        msg.role === 'user' ? 'bg-gray-100' : 'bg-[#bc1313] text-white'
                      }`}>
                        {msg.role === 'user' ? (
                          user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user?.full_name?.charAt(0).toUpperCase() || 'U'
                          )
                        ) : (
                          <Bot size={16} />
                        )}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed shadow-xs ${
                        msg.role === 'user' ? 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tr-none' : 'bg-white text-gray-700 border border-[#f1d7d7] rounded-tl-none'
                      }`}>
                        {msg.role === 'assistant' && msg.isNew ? (
                          <TypewriterText text={msg.content} onComplete={() => { msg.isNew = false; }} />
                        ) : (
                          <p dangerouslySetInnerHTML={{ __html: formatChatMarkdown(msg.content || '') }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-gray-50 bg-white">
                {chatError && (
                  <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-red-700 mb-0.5">The coach didn't reply</p>
                      <p className="text-[11px] text-red-600 leading-snug break-words">{chatError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatError(null)}
                      className="text-red-400 hover:text-red-600 shrink-0"
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
                {chatMessages.length === 0 && !chatSending && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CHAT_SUGGESTIONS.map(q => (
                      <button key={q} disabled={chatSending} onClick={() => sendChat(q)} className="px-3 py-1.5 bg-[#fff3f3] border border-[#f1d7d7] text-[#bc1313] text-[10px] font-bold rounded-full hover:bg-[#ffebeb] transition-all disabled:opacity-50">{q}</button>
                    ))}
                  </div>
                )}
                {chatSending && (
                  <div className="flex items-center gap-2 mb-3 text-[11px] text-gray-500">
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce" />
                    </span>
                    <span className="font-semibold text-gray-600">{thinkingPhrase}…</span>
                  </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={chatSending ? `${thinkingPhrase}…` : "Ask your career coach..."}
                    disabled={chatSending}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bc1313]/20 focus:border-[#bc1313] transition-all pr-12"
                  />
                  {chatSending ? (
                    <button
                      type="button"
                      onClick={cancelChat}
                      aria-label="Stop generating"
                      className="absolute right-2 top-2 bottom-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                    >
                      <Square size={12} fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-[#bc1313] text-white rounded-lg hover:bg-[#890E0E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
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
    </div>
  );
}
