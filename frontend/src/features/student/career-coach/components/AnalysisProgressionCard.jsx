import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

function DeltaPill({ change }) {
  const v = Number(change ?? 0);
  if (v === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <Minus size={10} /> 0
      </span>
    );
  }
  if (v > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <TrendingUp size={10} /> +{v}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingDown size={10} /> {v}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</span>
      <span className="text-[14px] font-black text-gray-900">{value}</span>
    </div>
  );
}

export default function AnalysisProgressionCard({ progression }) {
  if (!progression) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-[11px] text-gray-400">No analysis yet.</p>
      </div>
    );
  }

  const {
    first_run,
    career_readiness_score = 0,
    readiness_change = 0,
    days_since_last_report,
    closed_gaps = [],
    new_skills_detected = [],
    motivational_insight,
  } = progression;

  if (first_run) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-[#70170f]/10 flex items-center justify-center">
            <Sparkles size={14} className="text-[#70170f]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#70170f]">Baseline</span>
        </div>
        <p className="text-[12px] text-gray-700 leading-relaxed font-medium">
          This is your first analysis. Future runs will track how your readiness evolves.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[28px] font-black text-gray-900 leading-none">
          {Math.round(career_readiness_score)}%
        </span>
        <DeltaPill change={readiness_change} />
      </div>
      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">
        Career Readiness
      </span>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Gaps Closed" value={closed_gaps.length} />
        <MiniStat label="New Skills" value={new_skills_detected.length} />
      </div>

      {(motivational_insight || days_since_last_report != null) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {days_since_last_report != null && (
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              {days_since_last_report === 0 ? 'Updated today' : `${days_since_last_report} days since last analysis`}
            </p>
          )}
          {motivational_insight && (
            <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">
              {motivational_insight}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
