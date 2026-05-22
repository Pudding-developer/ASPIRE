import React from 'react';
import { X } from 'lucide-react';
import { inferCategory } from '../../../../data/careerConstants';

export default function CareerPathCard({ match, index, selected, optimal, onSelect, isChosenGoal, onSetAsGoal, onHide, unanalyzed, careerLoading, careerOptions = [] }) {
  const cat  = inferCategory(match.title);
  // Fall back to the dynamic careerOptions skill list when the AI hasn't
  // produced match data for this title yet.
  const fallback = unanalyzed ? (careerOptions || []).find(o => o.title === match.title) : null;
  const tags = unanalyzed
    ? (fallback?.skills || []).slice(0, 2)
    : (match.matched_skills || []).slice(0, 2);

  return (
    <div
      onClick={() => onSelect(index)}
      className={`w-52 min-w-[208px] h-[280px] rounded-2xl p-5 transition-all border shrink-0 flex flex-col relative overflow-hidden cursor-pointer
        ${isChosenGoal
          ? 'bg-[#fff8f8] border-2 border-[#70170f] shadow-md'
          : selected
            ? 'bg-[#7a0e0e] border-[#70170f] text-white shadow-xl scale-[1.02] z-10'
            : optimal
              ? 'bg-white border-emerald-400 shadow-sm hover:shadow-md'
              : 'bg-white border-[#eadede] hover:border-[#d9c5c5] hover:shadow-md'}`}
    >
      {onHide && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onHide(); }}
          aria-label="Hide this career path"
          className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-colors z-10
            ${selected && !isChosenGoal
              ? 'text-white/70 hover:text-white hover:bg-white/15'
              : 'text-gray-300 hover:text-red-600 hover:bg-red-50'}`}
        >
          <X size={12} />
        </button>
      )}
      {isChosenGoal && (
        <div className="absolute top-0 right-0 bg-[#70170f] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg z-10 shadow-sm">
          Chosen Path
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className={`text-[8px] font-bold tracking-widest uppercase font-inter ${selected ? 'text-white' : 'text-gray-900'}`}>
          {cat}
        </span>
        {unanalyzed ? (
          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-900 font-inter">
            Not analyzed
          </span>
        ) : (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-inter
            ${selected ? 'bg-white text-gray-900'
              : optimal ? 'bg-emerald-100 text-gray-900 border border-emerald-200'
              : 'bg-red-50 text-gray-900 border border-red-100'}`}>
            {match.match_score}% MATCH
          </span>
        )}
      </div>

      <p className={`text-[13px] font-extrabold leading-snug mb-1.5 ${(selected && !isChosenGoal) ? 'text-white' : 'text-gray-900'}`}>
        {match.title}
      </p>

      <p className={`text-[11px] leading-relaxed mb-2 line-clamp-3 ${(selected && !isChosenGoal) ? 'text-white/70' : 'text-gray-500'}`}>
        {unanalyzed
          ? (fallback?.blurb || 'Run the AI report to see how your profile fits this path.')
          : (match.reasoning || 'Matched based on your academic profile and skills.').split('.')[0] + '.'}
      </p>

      <div className="flex gap-1 flex-wrap mt-auto pt-3 mb-4">
        {tags.map(t => (
          <span
            key={t}
            className={`text-[11px] font-medium px-2 py-1 rounded
              ${(selected && !isChosenGoal) ? 'bg-white/15 text-white/70' : isChosenGoal ? 'bg-red-50 text-[#70170f]' : 'bg-gray-100 text-gray-400'}`}
          >
            {t}
          </span>
        ))}
      </div>

      {isChosenGoal ? (
        <div
          className="flex items-center gap-2.5 w-full mt-auto p-2 bg-[#70170f]/5 rounded-xl border border-[#70170f]/10"
        >
          <div className="relative w-8 h-8 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#70170f]/10" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#70170f]" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - (match.match_score || 0)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#70170f]">
              {match.match_score || 0}%
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#70170f] leading-tight">Match Score</p>
            <p className="text-[8px] text-[#70170f]/70 leading-tight mt-0.5">Click to view roadmap</p>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetAsGoal();
          }}
          disabled={careerLoading}
          className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors mt-auto
            ${(selected && !isChosenGoal)
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
        >
          {careerLoading ? 'Saving...' : 'Choose This Path'}
        </button>
      )}
    </div>
  );
}
