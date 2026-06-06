import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Clock, Lightbulb, Compass, TrendingUp, BookOpen, Code2, Target } from 'lucide-react';

const STEP_TIME_HINTS = {
  'Analyzing GitHub repositories...': '~15 sec',
  'Processing academic performance...': '~10 sec',
  'Synthesizing skill profile...': '~10 sec',
  'Mapping career paths...': '~15 sec',
  'Analyzing skill gaps...': '~15 sec',
  'Generating career report...': '~10 sec',
  'Tracking your progress...': '~10 sec',
};

const STEP_SOFT_CAPS = {
  'Starting pipeline...':              8,
  'Collecting student data...':        9,
  'Analyzing GitHub repositories...':  23,
  'Processing academic performance...': 38,
  'Synthesizing skill profile...':     53,
  'Mapping career paths...':           68,
  'Analyzing skill gaps...':           83,
  'Generating career report...':       93,
  'Tracking your progress...':         98,
};

const ANALYSIS_TIPS = [
  { icon: Sparkles,   text: "ASPIRE cross-references 24+ skill dimensions across your academic record and GitHub activity." },
  { icon: Compass,    text: "Most BSU CpE graduates explore 3–5 different roles before settling into their long-term path." },
  { icon: Code2,      text: "For software skills we weight academics 60% / GitHub 40% — for hardware, it flips to 70 / 30." },
  { icon: TrendingUp, text: "Your match scores aren't fixed — they evolve as your skills deepen each semester." },
  { icon: Lightbulb,  text: "The AI is tracing connections between your ILO scores and real-world skill demands." },
  { icon: BookOpen,   text: "Strong fundamentals in math and programming open doors to roles you might not expect." },
  { icon: Target,     text: "Closing one skill gap often unlocks paths to several new careers at once." },
  { icon: Sparkles,   text: "Your top recommended career may surprise you — the AI looks for alignment, not popularity." },
  { icon: Compass,    text: "Career readiness is a journey, not a verdict — small consistent gains beat one big leap." },
  { icon: TrendingUp, text: "Tech roles in the Philippines have grown ~38% over the last 5 years — opportunities are expanding." },
];

/**
 * AnalysisLoadingCard — animated progress + rotating psychological tips for
 * the career analyzer. Used both standalone (first run) and inside a modal
 * overlay (refresh analysis with existing report).
 */
export default function AnalysisLoadingCard({ isRunning, pipelineStatus, onCancel }) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [displayPct, setDisplayPct] = useState(0);
  const lastBackendPct = useRef(0);
  const [tipIdx, setTipIdx] = useState(0);

  const backendPct = pipelineStatus?.percentage || 0;
  const currentStep = pipelineStatus?.current_step || 'Starting pipeline...';

  // Snap to backend value the moment it ticks up.
  useEffect(() => {
    if (backendPct > lastBackendPct.current) {
      lastBackendPct.current = backendPct;
      setDisplayPct(prev => Math.max(prev, backendPct));
    }
    if (!isRunning) {
      lastBackendPct.current = 0;
      setDisplayPct(0);
    }
  }, [backendPct, isRunning]);

  // Creep toward the soft cap while we wait for the next backend update.
  useEffect(() => {
    if (!isRunning) return;
    const cap = STEP_SOFT_CAPS[currentStep] ?? 99;
    const id = setInterval(() => {
      setDisplayPct(prev => {
        if (prev >= cap) return prev;
        const remaining = cap - prev;
        const step = Math.max(0.15, remaining * 0.035);
        return Math.min(cap, prev + step);
      });
    }, 350);
    return () => clearInterval(id);
  }, [isRunning, currentStep]);

  // Rotate the tip every 6s while running.
  useEffect(() => {
    if (!isRunning) {
      setTipIdx(0);
      return;
    }
    const id = setInterval(() => {
      setTipIdx(i => (i + 1) % ANALYSIS_TIPS.length);
    }, 6000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Show the "this may take 1–2 min" reassurance only after 30s.
  useEffect(() => {
    if (!isRunning) {
      setShowTimeoutWarning(false);
      return;
    }
    const t = setTimeout(() => setShowTimeoutWarning(true), 30000);
    return () => clearTimeout(t);
  }, [isRunning]);

  const timeHint = STEP_TIME_HINTS[currentStep];
  const shownPct = Math.round(displayPct);
  const Tip = ANALYSIS_TIPS[tipIdx];
  const TipIcon = Tip.icon;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
      <Loader2 size={32} className="text-[#70170f] animate-spin mx-auto mb-4" />
      <h2 className="text-[18px] font-bold text-gray-900 mb-2">Analyzing Your Profile</h2>
      <p className="text-[12px] text-gray-500 mb-1">{currentStep}</p>
      {timeHint && (
        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
          Estimated: {timeHint}
        </p>
      )}
      {!timeHint && <div style={{ marginBottom: '12px' }} />}

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2 relative">
        <div
          className="h-2 bg-[#70170f] rounded-full"
          style={{ width: `${displayPct}%`, transition: 'width 350ms ease-out' }}
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'rm-progress-shimmer 1.6s linear infinite',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
      <p className="text-[11px] font-bold text-gray-400 tabular-nums">{shownPct}%</p>

      {/* Rotating psychological-loading tip */}
      <div
        key={tipIdx}
        className="mt-5 pt-4 border-t border-gray-100 flex items-start gap-2.5 text-left rm-tip-fade"
      >
        <div className="w-7 h-7 rounded-full bg-[#70170f]/10 flex items-center justify-center shrink-0 mt-0.5">
          <TipIcon size={13} className="text-[#70170f]" />
        </div>
        <p className="text-[11.5px] text-gray-600 leading-relaxed flex-1 italic">
          {Tip.text}
        </p>
      </div>

      <style>{`
        @keyframes rm-progress-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes rm-tip-fade-in {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .rm-tip-fade {
          animation: rm-tip-fade-in 0.45s ease-out;
        }
      `}</style>

      <div
        style={{
          opacity: showTimeoutWarning ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showTimeoutWarning ? 'auto' : 'none',
          marginTop: '16px',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <Clock size={16} style={{ color: '#92400e', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', margin: 0 }}>
            Career analysis is running...
          </p>
          <p style={{ fontSize: '11px', color: '#92400e', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            This may take 1–2 minutes while our AI analyzes your GitHub activity, academic
            performance, and maps your career paths. Please keep this tab open.
          </p>
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-[11px] font-bold hover:bg-gray-50 hover:text-[#70170f] hover:border-[#70170f]/30 transition-all w-full uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          Cancel Analysis
        </button>
      )}
    </div>
  );
}
