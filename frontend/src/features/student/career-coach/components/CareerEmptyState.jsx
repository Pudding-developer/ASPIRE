import { useState, useEffect } from 'react';
import { Loader2, Bot, Sparkles, Star } from 'lucide-react';
import AnalysisLoadingCard from './AnalysisLoadingCard';

export default function CareerEmptyState({ onGenerate, isRunning, pipelineStatus, error }) {
  const [buttonClicked, setButtonClicked] = useState(false);

  useEffect(() => {
    if (isRunning || error) setButtonClicked(false);
  }, [isRunning, error]);

  if (isRunning) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <AnalysisLoadingCard isRunning={isRunning} pipelineStatus={pipelineStatus} />
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
        <div className="w-16 h-16 rounded-2xl bg-[#70170f]/10 flex items-center justify-center mx-auto mb-5">
          <Bot size={28} className="text-[#70170f]" />
        </div>
        <h2 className="text-[22px] font-bold text-gray-900 mb-2">AI Career Intelligence</h2>
        <p className="text-[12px] text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
          ASPIRE's AI engine analyzes your academic performance, ILO/SO attainment, and GitHub
          activity to map personalized career trajectories.
        </p>

        <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          {[
            'Career path matching with compatibility scores',
            'Skill gap analysis and learning recommendations',
            'AI-powered career guidance chat',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-[11px] text-gray-600">
              <Sparkles size={12} className="text-[#70170f] shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={buttonClicked}
          className={`px-8 py-3 rounded-xl text-[13px] font-bold transition-colors inline-flex items-center gap-2 ${
            buttonClicked
              ? 'bg-[#70170f]/70 text-white cursor-not-allowed'
              : 'bg-[#70170f] hover:bg-[#4a0e09] text-white'
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
