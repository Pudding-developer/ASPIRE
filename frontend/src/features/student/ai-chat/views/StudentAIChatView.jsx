import React, { useState, useRef, useEffect } from 'react';
import { Star, Plus, MessageSquare, AlertCircle, Trash2, Square, Bot, ChevronRight } from 'lucide-react';
import { chatService } from '../../../../services/chatService';
import useCareerCoach from '../../career-coach/hooks/useCareerCoach';
import aiChatLogo from '../../../../assets/AI-chat.png';

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

function formatChatMarkdown(text) {
  if (!text) return '';
  let s = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  s = s.replace(/\*\*([^\n*][^\n]*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*(?!\s)([^\n*]+?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`\n]+?)`/g, '<code class="bg-gray-100 px-1 rounded text-[11px]">$1</code>');
  s = s.replace(/(^|<br\/>)\s*[*-]\s+/g, '$1• ');
  s = s.replace(/\n/g, '<br/>');
  return s;
}

export default function StudentAIChatView({ user }) {
  const { pipelineData, careerMatches, chosenCareer } = useCareerCoach(user.id);

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

  useEffect(() => {
    chatService.listSessions().then(setSessionList).catch(console.error);
  }, []);

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

      if (wasFirstMessage) {
        try {
          const refreshed = await chatService.listSessions();
          setSessionList(refreshed);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
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

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-8">
      {/* HEADER SECTION */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#70170f] animate-pulse"></div>
          <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-[0.2em]">AI CAREER COACH ACTIVE</span>
        </div>
        <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-none">Career Coach Chat</h1>
        <p className="text-[12px] text-gray-500 mt-2 font-medium">Chat directly with your personalized AI Career Coach</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Session Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-3 shrink-0 h-full">
          <button 
            onClick={createNewSession}
            disabled={sessionLoading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#fcf4f2] border-2 border-dashed border-[#eed7d3] rounded-xl text-[#70170f] text-[12px] font-bold hover:bg-[#faebe8] transition-all"
          >
            <Plus size={16} /> NEW SESSION
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
                    isActive ? 'bg-white border-[#eed7d3] shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => loadSession(s.session_id)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <MessageSquare size={16} className={isActive ? 'text-[#70170f]' : 'text-gray-400'} />
                    <div className="flex-1 truncate">
                      <p className={`text-[12px] font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPendingDeleteId(s.session_id); }}
                    aria-label="Delete chat"
                    className="shrink-0 p-1.5 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white border border-[#eed7d3] rounded-2xl shadow-sm overflow-hidden h-full">
          <div className="p-4 border-b border-gray-50 bg-[#fffbfc] flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">AI CAREER ASSISTANT</span>
            {sessionLoading && <div className="animate-spin w-4 h-4 border-2 border-[#70170f] border-t-transparent rounded-full" />}
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-24 h-24 mb-6 flex items-center justify-center">
                  <img src={aiChatLogo} alt="AI Chat" className="w-full h-full object-contain drop-shadow-sm scale-[2.5]" />
                </div>
                <p className="text-[15px] font-bold text-gray-900 mb-2">How can I help you today?</p>
                <p className="text-[13px] text-gray-500 max-w-md leading-relaxed">Select a suggested topic below or ask any question about your career roadmap, skill gaps, or learning path.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 shadow-sm mt-1 overflow-hidden ${
                    msg.role === 'user' ? 'bg-gray-100' : 'bg-[#70170f] text-white'
                  }`}>
                    {msg.role === 'user' ? (
                      user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user?.full_name?.charAt(0).toUpperCase() || 'U'
                      )
                    ) : (
                      <img src={aiChatLogo} alt="AI Coach" className="w-full h-full object-cover scale-[2.5]" />
                    )}
                  </div>
                  <div className={`max-w-[80%] p-5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tr-none' : 'bg-white text-gray-700 border border-[#eed7d3] rounded-tl-none'
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
          <div className="p-5 border-t border-gray-50 bg-white">
            {chatError && (
              <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-red-700 mb-1">The coach didn't reply</p>
                  <p className="text-[12px] text-red-600 leading-relaxed break-words">{chatError}</p>
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
              <div className="flex flex-wrap gap-2 mb-5">
                {CHAT_SUGGESTIONS.map(q => (
                  <button key={q} disabled={chatSending} onClick={() => sendChat(q)} className="px-4 py-2 bg-[#fcf4f2] border border-[#eed7d3] text-[#70170f] text-[11px] font-bold rounded-full hover:bg-[#faebe8] transition-all shadow-sm disabled:opacity-50">{q}</button>
                ))}
              </div>
            )}
            {chatSending && (
              <div className="flex items-center gap-2 mb-3 text-[12px] text-gray-500 ml-2">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 bg-[#70170f] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#70170f] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#70170f] rounded-full animate-bounce" />
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#70170f]/20 focus:border-[#70170f] transition-all pr-14 shadow-inner"
              />
              {chatSending ? (
                <button
                  type="button"
                  onClick={cancelChat}
                  aria-label="Stop generating"
                  className="absolute right-2.5 top-2.5 bottom-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-2.5 top-2.5 bottom-2.5 px-4 bg-[#70170f] text-white rounded-lg hover:bg-[#4a0e09] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
