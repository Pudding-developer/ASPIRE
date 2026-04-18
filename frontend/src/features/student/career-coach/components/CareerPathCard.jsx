import React from 'react';
import { inferCategory } from '../../../../data/careerConstants';

export default function CareerPathCard({ match, index, selected, optimal, onSelect, isChosenGoal, onSetAsGoal, careerLoading }) {
  const cat  = inferCategory(match.title);
  const tags = (match.matched_skills || []).slice(0, 2);

  return (
    <div
      onClick={() => onSelect(index)}
      className={`w-52 min-w-[208px] min-h-[220px] rounded-2xl p-5 cursor-pointer transition-all border shrink-0 flex flex-col h-full relative overflow-hidden
        ${isChosenGoal
          ? 'bg-[#fff8f8] border-2 border-[#bc1313] shadow-md'
          : selected
            ? 'bg-[#7a0e0e] border-[#bc1313] text-white shadow-xl'
            : optimal
              ? 'bg-white border-emerald-300/60 hover:shadow-md'
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
    >
      {isChosenGoal && (
        <div className="absolute top-0 right-0 bg-[#bc1313] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg z-10 shadow-sm">
          Your Goal
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <span className={`text-[8px] font-bold tracking-widest uppercase ${selected ? 'text-white/60' : 'text-gray-400'}`}>
          {cat}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
          ${selected ? 'bg-white/20 text-white'
            : optimal ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50/80 text-[#bc1313]'}`}>
          {match.match_score}% MATCH
        </span>
      </div>

      <p className={`text-[13px] font-extrabold leading-snug mb-1.5 ${(selected && !isChosenGoal) ? 'text-white' : 'text-gray-900'}`}>
        {match.title}
      </p>

      <p className={`text-[11px] leading-relaxed mb-2 line-clamp-3 ${(selected && !isChosenGoal) ? 'text-white/70' : 'text-gray-500'}`}>
        {(match.reasoning || 'Matched based on your academic profile and skills.').split('.')[0]}.
      </p>

      <div className="flex gap-1 flex-wrap mt-auto pt-3 mb-4">
        {tags.map(t => (
          <span
            key={t}
            className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded
              ${(selected && !isChosenGoal) ? 'bg-white/15 text-white/70' : isChosenGoal ? 'bg-red-50 text-[#bc1313]' : 'bg-gray-100 text-gray-400'}`}
          >
            {t}
          </span>
        ))}
      </div>

      {!isChosenGoal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetAsGoal();
          }}
          disabled={careerLoading}
          className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors
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
