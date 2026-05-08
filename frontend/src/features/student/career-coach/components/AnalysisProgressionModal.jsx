import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

function DeltaBadge({ change }) {
  const v = Number(change ?? 0);
  if (v === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
        <Minus size={12} /> No change
      </span>
    );
  }
  if (v > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
        <TrendingUp size={12} /> +{v} points
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full">
      <TrendingDown size={12} /> {v} points
    </span>
  );
}

function ListSection({ icon: Icon, iconColor, label, items, emptyText, accent }) {
  if (!items || items.length === 0) {
    if (!emptyText) return null;
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} className={iconColor} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{label}</span>
        </div>
        <p className="text-[12px] text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-4 ${accent || 'border-gray-100 bg-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={iconColor} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">{label}</span>
        <span className="text-[10px] font-semibold text-gray-400">({items.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => {
          const text = typeof item === 'string' ? item : (item?.name || item?.skill || JSON.stringify(item));
          return (
            <span
              key={i}
              className="inline-flex items-center text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-md"
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalysisProgressionModal({ progression, careerTitle, onClose }) {
  if (!progression) return null;

  const {
    first_run,
    career_readiness_score = 0,
    previous_readiness_score = 0,
    readiness_change = 0,
    closed_gaps = [],
    remaining_gaps = [],
    new_skills_detected = [],
    improved_skills = [],
    next_milestone,
    motivational_insight,
    semester_summary,
  } = progression;

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#70170f] animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-[0.2em]">Analysis Update</span>
            </div>
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight">
              {first_run ? 'Your Baseline Report' : 'Your Progress'}
            </h3>
            {careerTitle && (
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">for {careerTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {first_run ? (
            <div className="bg-[#fff4f4] border border-[#f2cdcd] rounded-xl p-5 flex items-start gap-3">
              <Sparkles size={18} className="text-[#70170f] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-1">Welcome — this is your baseline.</p>
                <p className="text-[12px] text-gray-700 leading-relaxed">
                  {motivational_insight || 'Future analyses will track your progress against this starting point.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Hero score */}
              <div className="bg-gradient-to-br from-[#fff4f4] to-white border border-[#f2cdcd] rounded-xl p-5">
                <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Career Readiness
                </span>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[40px] font-black text-gray-900 leading-none">
                      {Math.round(career_readiness_score)}%
                    </span>
                    {previous_readiness_score > 0 && (
                      <span className="text-[12px] font-medium text-gray-400">
                        from {Math.round(previous_readiness_score)}%
                      </span>
                    )}
                  </div>
                  <DeltaBadge change={readiness_change} />
                </div>
                {semester_summary && (
                  <p className="text-[12px] text-gray-700 leading-relaxed mt-3 pt-3 border-t border-[#f2cdcd]/60">
                    {semester_summary}
                  </p>
                )}
              </div>

              {/* Sections */}
              <ListSection
                icon={CheckCircle2}
                iconColor="text-emerald-600"
                label="Gaps Closed"
                items={closed_gaps}
                accent="border-emerald-100 bg-emerald-50/40"
              />

              <ListSection
                icon={Sparkles}
                iconColor="text-[#70170f]"
                label="New Skills Detected"
                items={new_skills_detected}
                accent="border-[#f2cdcd] bg-[#fff4f4]/60"
              />

              {improved_skills && improved_skills.length > 0 && (
                <ListSection
                  icon={TrendingUp}
                  iconColor="text-amber-600"
                  label="Improved Skills"
                  items={improved_skills}
                  accent="border-amber-100 bg-amber-50/40"
                />
              )}

              <ListSection
                icon={AlertCircle}
                iconColor="text-gray-500"
                label="Remaining Gaps"
                items={remaining_gaps}
                accent="border-gray-100 bg-white"
                emptyText="No remaining gaps — strong coverage."
              />

              {next_milestone && (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Next Milestone
                  </span>
                  <p className="text-[13px] text-gray-900 font-semibold leading-relaxed">{next_milestone}</p>
                </div>
              )}

              {motivational_insight && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[12px] text-gray-700 italic leading-relaxed">
                    💬 {motivational_insight}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#70170f] text-white rounded-lg text-[11px] font-bold hover:bg-[#4a0e09] transition-colors"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
