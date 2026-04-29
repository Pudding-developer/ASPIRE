import { useState, useEffect, useRef } from 'react';
import { Loader2, Bot, Sparkles, Star, AlertCircle, Clock } from 'lucide-react';

const STEP_TIME_HINTS = {
  'Analyzing GitHub repositories...': '~15 sec',
  'Processing academic performance...': '~10 sec',
  'Synthesizing skill profile...': '~10 sec',
  'Mapping career paths...': '~15 sec',
  'Analyzing skill gaps...': '~15 sec',
  'Generating career report...': '~10 sec',
  'Tracking your progress...': '~10 sec',
};

/* Soft cap the bar can creep toward while waiting for the next backend update.
   Each value sits just below the next step's real percentage, so the bar
   *feels* like it's progressing without ever overtaking the truth. */
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

export default function CareerEmptyState({ onGenerate, isRunning, pipelineStatus, error }) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

  /* Smoothly-animated displayed percentage. Snaps up to backend value when the
     server reports a higher number; otherwise creeps asymptotically toward the
     current step's soft cap so the bar never visibly stalls. */
  const [displayPct, setDisplayPct] = useState(0);
  const lastBackendPct = useRef(0);

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
        // Asymptotic ease — fast at first, slows near the cap.
        const step = Math.max(0.15, remaining * 0.035);
        return Math.min(cap, prev + step);
      });
    }, 350);
    return () => clearInterval(id);
  }, [isRunning, currentStep]);

  useEffect(() => {
    if (!isRunning) {
      setShowTimeoutWarning(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning || error) setButtonClicked(false);
  }, [isRunning, error]);

  if (isRunning) {
    const timeHint = STEP_TIME_HINTS[currentStep];
    const shownPct = Math.round(displayPct);

    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
          <Loader2 size={32} className="text-[#bc1313] animate-spin mx-auto mb-4" />
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
              className="h-2 bg-[#bc1313] rounded-full"
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
          <style>{`
            @keyframes rm-progress-shimmer {
              0%   { background-position: 200% 0; }
              100% { background-position: -200% 0; }
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
        </div>
      </div>
    );
  }

  const handleGenerate = () => {
    setButtonClicked(true);
    onGenerate();
  };

  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#bc1313]/10 flex items-center justify-center mx-auto mb-5">
          <Bot size={28} className="text-[#bc1313]" />
        </div>
        <h2 className="text-[22px] font-bold text-gray-900 mb-2">AI Career Intelligence</h2>
        <p className="text-[12px] text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
          ASPIRE's AI engine analyzes your academic performance, ILO/SO attainment, and GitHub
          activity to map personalized career trajectories.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 text-[11px] p-3 rounded-lg border border-red-200 flex items-start text-left gap-2 shadow-sm">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">{error.includes('RESOURCE_EXHAUSTED') ? 'The AI Pipeline is currently experiencing heavy traffic (Google API Quota reached). Please try again in exactly one minute.' : error}</p>
          </div>
        )}

        <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          {[
            'Career path matching with compatibility scores',
            'Skill gap analysis and learning recommendations',
            'AI-powered career guidance chat',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-[11px] text-gray-600">
              <Sparkles size={12} className="text-[#bc1313] shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={buttonClicked}
          className={`px-8 py-3 rounded-xl text-[13px] font-bold transition-colors inline-flex items-center gap-2 ${
            buttonClicked
              ? 'bg-[#bc1313]/70 text-white cursor-not-allowed'
              : 'bg-[#bc1313] hover:bg-[#890E0E] text-white'
          }`}
        >
          {buttonClicked ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing your profile...
            </>
          ) : (
            <>
              <Star size={14} /> Generate Career Report
            </>
          )}
        </button>
        {buttonClicked && (
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
            Powered by 7 AI agents — results in 1–2 minutes
          </p>
        )}
      </div>
    </div>
  );
}
