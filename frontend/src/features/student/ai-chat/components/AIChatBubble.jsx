import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, Square, AlertCircle, MessageCircle } from 'lucide-react';
import { chatService } from '../../../../services/chatService';
import useCareerCoach from '../../career-coach/hooks/useCareerCoach';
import aiChatLogo from '../../../../assets/AI-chat.png';
import aiBubbleImg from '../../../../assets/AI-bubble.jpeg';

const PAGE_CONTEXT = {
  dashboard: {
    greeting: "Need help with your learning path?",
    subtitle: 'Ask me about your progress toward outcomes, skill development, or overall roadmap.',
    suggestions: [
      'Summarize my progress in learning outcomes',
      'What outcomes should I focus on today?',
      'How am I progressing toward my career goal?',
    ],
  },
  'enrolled-classes': {
    greeting: "Need help with your classes?",
    subtitle: 'Ask me how to study for your classes or how to master specific learning outcomes.',
    suggestions: [
      'How do I best study for my current classes?',
      'What are the key learning outcomes for this course?',
      'How can I master the skills in this class?',
    ],
  },
  'my-performance': {
    greeting: "Let's review your outcomes!",
    subtitle: 'Ask me about your Intended Learning Outcomes (ILOs) and Student Outcomes (SOs).',
    suggestions: [
      'Which learning outcomes am I strongest in?',
      'What skills do I need to improve for my career?',
      'How do my SOs map to my target job?',
    ],
  },
  'github-analytics': {
    greeting: "Analyzing your skill evidence...",
    subtitle: 'Ask me how your GitHub activity proves your mastery of specific outcomes.',
    suggestions: [
      'What skills does my code demonstrate?',
      'Which outcomes are missing evidence in my repos?',
      'How does my activity show growth in coding?',
    ],
  },
  'career-coach': {
    greeting: "Let's align your skills with your career!",
    subtitle: 'Ask me about improving specific skills for your chosen career path.',
    suggestions: [
      'How do I improve this skill for my career path?',
      'Which learning outcomes are most vital for my goal?',
      'Am I meeting the industry standards for my role?',
    ],
  },
};

const DEFAULT_CONTEXT = {
  greeting: "Hello! I'm here to assist you!",
  subtitle: 'Ask me anything about your career roadmap, skill gaps, or learning path.',
  suggestions: [
    'How do I improve my match score?',
    'What should I focus on first?',
    'Show me my skill gaps',
  ],
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
  s = s.replace(/\n/g, '<br/>');
  return s;
}

const TypewriterText = ({ text, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) { clearInterval(iv); cbRef.current?.(); }
    }, 12);
    return () => clearInterval(iv);
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: formatChatMarkdown(displayed) }} />;
};

const BUBBLE_SESSION_KEY = (uid) => `aspire_bubble_session_${uid ?? 'anon'}`;

export default function AIChatBubble({ user, activeView }) {
  const [open, setOpen] = useState(false);
  const { pipelineData, careerMatches, chosenCareer } = useCareerCoach(user?.id);
  const ctx = PAGE_CONTEXT[activeView] || DEFAULT_CONTEXT;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionIdState] = useState(null);
  const [thinkingPhrase, setThinkingPhrase] = useState('Thinking');
  const [showGreeting, setShowGreeting] = useState(false);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  // Persist sessionId across navigations + reloads so the bubble continues
  // the same conversation. Server already stores all messages — we just
  // need to remember which session belongs to this bubble.
  const setSessionId = (sid) => {
    setSessionIdState(sid);
    if (typeof window === 'undefined' || !user?.id) return;
    try {
      if (sid) localStorage.setItem(BUBBLE_SESSION_KEY(user.id), String(sid));
      else localStorage.removeItem(BUBBLE_SESSION_KEY(user.id));
    } catch { /* localStorage unavailable */ }
  };

  // Restore prior bubble session + its messages once on mount per user.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let saved = null;
    try { saved = localStorage.getItem(BUBBLE_SESSION_KEY(user.id)); } catch { /* ignore */ }
    if (!saved) return;
    const sid = Number(saved);
    if (!Number.isFinite(sid)) return;

    setSessionIdState(sid);
    chatService.getSession(sid)
      .then(data => {
        if (cancelled) return;
        setMessages(data.messages || []);
      })
      .catch(() => {
        // Stale session id (deleted from the tab, etc.) — clear it.
        if (cancelled) return;
        setSessionIdState(null);
        try { localStorage.removeItem(BUBBLE_SESSION_KEY(user.id)); } catch { /* ignore */ }
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Show greeting after short delay, auto-dismiss after 5s
  useEffect(() => {
    const show = setTimeout(() => setShowGreeting(true), 600);
    const hide = setTimeout(() => setShowGreeting(false), 5600);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Rotate thinking phrases
  useEffect(() => {
    if (!sending) return;
    const phrases = ['Thinking', 'Reviewing your skills', 'Analyzing your data', 'Crafting a response'];
    let i = 0;
    setThinkingPhrase(phrases[0]);
    const tick = setInterval(() => { i = (i + 1) % phrases.length; setThinkingPhrase(phrases[i]); }, 2500);
    return () => clearInterval(tick);
  }, [sending]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const buildContext = () => ({
    career_matches: careerMatches,
    skill_profile: pipelineData?.report?.skill_profile,
    summary: pipelineData?.report?.summary,
    chosen_career: chosenCareer,
  });

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    let sid = sessionId;
    setInput('');
    setError(null);
    setSending(true);

    try {
      if (!sid) {
        const resp = await chatService.createSession(buildContext());
        sid = resp.session_id;
        setSessionId(sid);
      }

      const nextMsgs = [...messages, { role: 'user', content: text }];
      setMessages(nextMsgs);

      const controller = new AbortController();
      abortRef.current = controller;

      const { reply } = await chatService.sendCareerMessage(
        sid, text, buildContext(), { signal: controller.signal }
      );

      setMessages([...nextMsgs, { role: 'assistant', content: reply, isNew: true }]);
    } catch (e) {
      if (e?.name === 'AbortError') {
        setInput(text);
      } else {
        setError(e.message || 'Failed to reach the AI coach.');
      }
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  };

  const cancel = () => abortRef.current?.abort();

  // ── Drag-to-move ──────────────────────────────────────────────────────────
  const BUBBLE = 80;
  const initLeft = typeof window !== 'undefined' ? window.innerWidth - BUBBLE - 24 : 900;
  const initTop  = typeof window !== 'undefined' ? window.innerHeight - BUBBLE - 24 : 600;
  const [pos, setPos] = useState({ left: initLeft, top: initTop });
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, left: initLeft, top: initTop });

  const onPointerDown = (e) => {
    dragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
    setPos({
      left: Math.max(0, Math.min(window.innerWidth  - BUBBLE, dragStart.current.left + dx)),
      top:  Math.max(0, Math.min(window.innerHeight - BUBBLE, dragStart.current.top  + dy)),
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
    if (!hasMoved.current) {
      setShowGreeting(false); // dismiss greeting on first click
      setOpen(o => !o);
    }
  };

  // ── Panel smart-positioning ────────────────────────────────────────────────
  const PANEL_W = 360;
  const PANEL_H = 540;
  const GAP = 12;

  const getPanelStyle = () => {
    const bx = pos.left;
    const by = pos.top;
    const spaceRight  = window.innerWidth  - (bx + BUBBLE);
    const spaceLeft   = bx;
    const spaceBelow  = window.innerHeight - (by + BUBBLE);
    const spaceAbove  = by;

    let left, top;

    if (spaceRight >= PANEL_W + GAP) {
      // Place to the right
      left = bx + BUBBLE + GAP;
      top  = Math.min(by, window.innerHeight - PANEL_H - 8);
      top  = Math.max(8, top);
    } else if (spaceLeft >= PANEL_W + GAP) {
      // Place to the left
      left = bx - PANEL_W - GAP;
      top  = Math.min(by, window.innerHeight - PANEL_H - 8);
      top  = Math.max(8, top);
    } else if (spaceBelow >= PANEL_H + GAP) {
      // Place below
      top  = by + BUBBLE + GAP;
      left = Math.min(bx, window.innerWidth - PANEL_W - 8);
      left = Math.max(8, left);
    } else {
      // Place above
      top  = by - PANEL_H - GAP;
      left = Math.min(bx, window.innerWidth - PANEL_W - 8);
      left = Math.max(8, left);
      top  = Math.max(8, top);
    }

    return { left, top };
  };

  return (
    <>
      {/* Draggable Chat Head */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.left, top: pos.top, cursor: dragging.current ? 'grabbing' : 'grab' }}
        className="fixed z-[200] w-20 h-20 rounded-full flex items-center justify-center select-none drop-shadow-2xl transition-[box-shadow] hover:drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        title="AI Career Coach"
      >
        {open
          ? <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center pointer-events-none"><X size={26} className="text-gray-800" /></div>
          : <img src={aiBubbleImg} alt="AI Chat" className="w-20 h-20 object-cover rounded-full pointer-events-none border-2 border-white/20 shadow-lg" />
        }
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none" />
        )}
      </div>

      {/* Greeting speech bubble */}
      {showGreeting && !open && (
        <div
          className="fixed z-[201] pointer-events-none"
          style={{
            left: pos.left - 200,
            top: pos.top + 10,
          }}
        >
          <div className="relative bg-white border border-gray-200 rounded-2xl rounded-br-none shadow-xl px-4 py-3 text-[13px] font-semibold text-gray-800 whitespace-nowrap"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
          >
            👋 {ctx.greeting}
            {/* Tail pointing right toward the bubble */}
            <span className="absolute right-[-8px] top-4 w-0 h-0"
              style={{
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '8px solid white',
                filter: 'drop-shadow(1px 0 0 #e5e7eb)',
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Chat Panel — positioned relative to bubble head */}
      {open && (
        <div
          className="fixed z-[199] w-[360px] h-[540px] flex flex-col bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden"
          style={{ fontFamily: 'Inter, sans-serif', ...getPanelStyle() }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#430202]/80 backdrop-blur-md shrink-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={aiChatLogo} alt="AI" className="w-full h-full object-contain scale-[1.6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold leading-tight">AI Career Coach</p>
              <p className="text-white/60 text-[11px]">
                {sending ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" />
                    <span className="ml-1">{thinkingPhrase}…</span>
                  </span>
                ) : 'Always here to help'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/50 hover:text-white transition-colors shrink-0 p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.length === 0 && !sending ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="w-14 h-14 mb-4 flex items-center justify-center bg-white rounded-full shadow-sm">
                  <img src={aiChatLogo} alt="AI" className="w-full h-full object-contain scale-[2.2]" />
                </div>
                <p className="text-[14px] font-bold text-gray-800 mb-1">Hey {user?.full_name?.split(' ')[0] || 'there'}! 👋</p>
                <p className="text-[12px] text-gray-400 leading-relaxed max-w-[240px]">
                  {ctx.subtitle}
                </p>
                {/* Quick suggestion chips */}
                <div className="flex flex-col gap-2 mt-5 w-full">
                  {ctx.suggestions.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-2.5 bg-white/50 backdrop-blur-sm border border-white/40 text-[#430202] text-[11px] font-semibold rounded-xl hover:bg-white/80 transition-all text-left shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-[11px] font-bold
                    ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-white shadow-sm'}`}
                  >
                    {msg.role === 'user'
                      ? (user?.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          : user?.full_name?.[0]?.toUpperCase() || 'U')
                      : <img src={aiChatLogo} alt="AI" className="w-full h-full object-contain scale-[1.6]" />
                    }
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-sm backdrop-blur-sm
                    ${msg.role === 'user'
                      ? 'bg-[#70170f]/90 text-white rounded-br-sm'
                      : 'bg-white/60 text-gray-800 border border-white/40 rounded-bl-sm'}`}
                  >
                    {msg.role === 'assistant' && msg.isNew
                      ? <TypewriterText text={msg.content} onComplete={() => { msg.isNew = false; }} />
                      : <span dangerouslySetInnerHTML={{ __html: formatChatMarkdown(msg.content || '') }} />
                    }
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {sending && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={aiChatLogo} alt="AI" className="w-full h-full object-contain scale-[1.6]" />
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#bc1313] rounded-full animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 shrink-0">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-600 flex-1 leading-relaxed">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-[14px] leading-none shrink-0">×</button>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 bg-white/40 backdrop-blur-md border-t border-white/20 shrink-0">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={sending ? `${thinkingPhrase}…` : 'Ask anything…'}
                disabled={sending}
                className="flex-1 bg-white/40 border border-white/40 rounded-xl px-4 py-2.5 text-[12.5px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#bc1313]/20 focus:border-[#bc1313]/40 transition-all disabled:opacity-60"
              />
              {sending ? (
                <button
                  type="button"
                  onClick={cancel}
                  className="w-9 h-9 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors shrink-0"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl bg-[#70170f] text-white flex items-center justify-center hover:bg-[#4a0e09] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
