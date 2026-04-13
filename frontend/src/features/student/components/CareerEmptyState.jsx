import React from 'react';
import { Loader2, Bot, Sparkles, Star, AlertCircle } from 'lucide-react';

export default function CareerEmptyState({ onGenerate, isRunning, pipelineStatus, error }) {
  /* Running state — show progress */
  if (isRunning) {
    const pct  = pipelineStatus?.percentage    || 0;
    const step = pipelineStatus?.current_step  || 'Starting pipeline...';

    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
          <Loader2 size={32} className="text-[#bc1313] animate-spin mx-auto mb-4" />
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">Analyzing Your Profile</h2>
          <p className="text-[12px] text-gray-500 mb-5">{step}</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-2 bg-[#bc1313] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] font-bold text-gray-400">{pct}%</p>
        </div>
      </div>
    );
  }

  /* Empty state — generate CTA */
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
            'Market trends aligned with your profile',
            'AI-powered career guidance chat',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-[11px] text-gray-600">
              <Sparkles size={12} className="text-[#bc1313] flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={onGenerate}
          className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-8 py-3 rounded-xl text-[13px] font-bold transition-colors inline-flex items-center gap-2"
        >
          <Star size={14} /> Generate Career Report
        </button>
      </div>
    </div>
  );
}
