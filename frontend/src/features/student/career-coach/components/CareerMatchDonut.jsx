import React from 'react';
import { CIRC, matchColor } from '../../../../data/careerConstants';

export default function CareerMatchDonut({ score, size = 104 }) {
  const color  = matchColor(score);
  const offset = (CIRC * (1 - score / 100)).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r="48" fill="none" stroke="#f0eaea" strokeWidth="9" />
        <circle
          cx="60" cy="60" r="48" fill="none" stroke="#dc2626" strokeWidth="9"
          strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="62" textAnchor="middle" fontSize="24" fontWeight="900" fill="#111827" className="font-inter">
          {score}%
        </text>
        <text x="60" y="75" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#6b7280" className="font-inter uppercase tracking-widest">
          MATCH SCORE
        </text>
      </svg>
      <p className="text-[9px] text-gray-400 text-center max-w-[100px] leading-snug">
        Based on ILO/SO attainment and GitHub activity
      </p>
    </div>
  );
}
