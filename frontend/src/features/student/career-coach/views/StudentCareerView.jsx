import React, { useState, useRef, useEffect } from 'react';
import { Target, TrendingUp, Layers, ChevronRight, Activity, Zap, CheckCircle2, ChevronDown, ListEnd, Star, Plus, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import useCareerCoach from '../hooks/useCareerCoach';
import { chatService } from '../../../../services/chatService';

import CareerEmptyState from '../components/CareerEmptyState';
import CareerPathCard from '../components/CareerPathCard';
import CareerMatchDonut from '../components/CareerMatchDonut';
import CareerAllPathsModal from '../components/CareerAllPathsModal';
import CareerSectionHeading from '../components/CareerSectionHeading';

const CHAT_SUGGESTIONS = [
  'How do I improve my match score?',
  'What should I focus on first?',
  'Which path fits me best?',
  'Show me my skill gaps',
];

const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text, onComplete]);
  return <>{displayedText}</>;
};

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
  } = useCareerCoach(user.id);

  // ── AI Chat state ──────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, chatSending]);

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

      const { reply } = await chatService.sendCareerMessage(
        targetSessionId,
        text,
        {
          career_matches: careerMatches,
          skill_profile: pipelineData?.report?.skill_profile,
          summary: pipelineData?.report?.summary,
          chosen_career: chosenCareer,
        },
      );

      setChatMessages([...nextMessages, { role: 'assistant', content: reply, isNew: true }]);
    } catch (e) {
      setChatError(e.message || 'Failed to reach the AI coach.');
    } finally {
      setChatSending(false);
    }
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
            <Zap size={14} /> {isRunning ? 'ANALYZING...' : 'REFRESH ANALYSIS'}
          </button>
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
            {selectedIndex !== optimalIndex && (
              <div className="bg-[#fff4f4] border border-[#f2cdcd] p-3.5 mb-6 rounded-lg flex items-start gap-3">
                <div className="w-4.5 h-4.5 rounded-full bg-[#bc1313] text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-extrabold italic">!</div>
                <p className="text-[12px] text-gray-800 leading-relaxed">
                  <strong>AI Recommendation:</strong> Your data shows stronger alignment with <strong className="text-[#bc1313]">{careerMatches[optimalIndex]?.title}</strong>.
                </p>
              </div>
            )}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x mb-8">
              {careerMatches.map((match, idx) => (
                <CareerPathCard
                  key={idx}
                  match={match}
                  index={idx}
                  selected={selectedIndex === idx}
                  optimal={idx === optimalIndex}
                  onSelect={setSelectedIndex}
                  isChosenGoal={chosenCareer === match.title}
                  onSetAsGoal={() => setChosenCareer(match.title)}
                  careerLoading={careerLoading}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === 'Roadmap' && (
          <div className="space-y-8">
            <CareerSectionHeading title="PRIMARY OBJECTIVE" />
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">Senior {careerMatches[selectedIndex]?.title}</h2>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MATCH SCORE</span>
                  <span className="text-[18px] font-black text-[#bc1313]">{careerMatches[selectedIndex]?.match_score}%</span>
                </div>
              </div>
              <div className="shrink-0 scale-125"><CareerMatchDonut score={careerMatches[selectedIndex]?.match_score || 0} /></div>
            </div>
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
                {sessionList.map(s => (
                  <button
                    key={s.session_id}
                    onClick={() => loadSession(s.session_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      sessionId === s.session_id ? 'bg-white border-[#f1d7d7] shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare size={14} className={sessionId === s.session_id ? 'text-[#bc1313]' : 'text-gray-400'} />
                    <div className="flex-1 truncate">
                      <p className={`text-[11px] font-bold truncate ${sessionId === s.session_id ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
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
                        {msg.role === 'user' ? 'U' : 'A'}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-[12px] leading-relaxed shadow-xs ${
                        msg.role === 'user' ? 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tr-none' : 'bg-white text-gray-700 border border-[#f1d7d7] rounded-tl-none'
                      }`}>
                        {msg.role === 'assistant' && msg.isNew ? (
                          <TypewriterText text={msg.content} onComplete={() => { msg.isNew = false; }} />
                        ) : (
                          <p dangerouslySetInnerHTML={{ __html: (msg.content || '').replace(/\n/g, '<br/>') }} />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-gray-50 bg-white">
                <div className="flex flex-wrap gap-2 mb-4">
                  {CHAT_SUGGESTIONS.map(q => (
                    <button key={q} disabled={chatSending} onClick={() => sendChat(q)} className="px-3 py-1.5 bg-[#fff3f3] border border-[#f1d7d7] text-[#bc1313] text-[10px] font-bold rounded-full hover:bg-[#ffebeb] transition-all disabled:opacity-50">{q}</button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your career coach..."
                    disabled={chatSending}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#bc1313]/20 focus:border-[#bc1313] transition-all pr-12"
                  />
                  <button type="submit" disabled={!chatInput.trim() || chatSending} className="absolute right-2 top-2 bottom-2 px-3 bg-[#bc1313] text-white rounded-lg hover:bg-[#890E0E] transition-colors"><ChevronRight size={16} /></button>
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
          onSelect={(idx) => { setSelectedIndex(idx); setShowAllPaths(false); }}
          onClose={() => setShowAllPaths(false)} 
        />
      )}
    </div>
  );
}
