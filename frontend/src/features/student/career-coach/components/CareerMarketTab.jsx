import React from 'react';

export default function CareerMarketTab({ path, market, score }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Job Demand Growth */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Job Demand Growth</p>
        <p className="text-[24px] font-bold text-gray-900 tracking-tight mb-0.5">{market.growth}</p>
        <p className="text-[10px] text-gray-500 leading-snug">Year-over-year in the Philippine tech sector</p>
        <p className="text-[10px] font-bold text-emerald-600 mt-1.5">&#8593; Above average</p>
      </div>

      {/* Average Monthly Salary */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Average Monthly Salary</p>
        <p className="text-[24px] font-bold text-gray-900 tracking-tight mb-0.5">{market.salary}</p>
        <p className="text-[10px] text-gray-500 leading-snug">Mid-level {path.title} in the Philippines</p>
        <p className="text-[10px] font-bold text-emerald-600 mt-1.5">&#8593; Growing</p>
      </div>

      {/* Market Outlook (highlighted) */}
      <div className="bg-[#7a0e0e] rounded-xl p-3.5 text-white">
        <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Market Outlook</p>
        <p className="text-[24px] font-bold tracking-tight mb-0.5">{market.outlook}</p>
        <p className="text-[10px] text-white/50 leading-snug">Based on current hiring trends aligned with your profile</p>
        <p className="text-[10px] font-bold text-green-300/70 mt-1.5">&#8593; AI Recommended</p>
      </div>

      {/* Median Tenure */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Median Tenure</p>
        <p className="text-[24px] font-bold text-gray-900 tracking-tight mb-0.5">{market.tenure}</p>
        <p className="text-[10px] text-gray-500 leading-snug">Average time before first promotion in this track</p>
      </div>

      {/* Top Locations */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Top PH Locations</p>
        <p className="text-[11px] text-gray-500 leading-relaxed mt-1.5">{market.locations}</p>
      </div>

      {/* Readiness Score */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Your Readiness Score</p>
        <p className="text-[24px] font-bold text-gray-900 tracking-tight mb-0.5">{score}%</p>
        <p className="text-[10px] text-gray-500 leading-snug">Combined ILO/SO attainment, GitHub analytics, and academic trajectory</p>
      </div>
    </div>
  );
}
