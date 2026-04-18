import React from 'react';
import { X, Star } from 'lucide-react';
import { inferCategory, matchColor } from '../../../../data/careerConstants';

export default function CareerAllPathsModal({ matches, optimalIndex, onSelect, onClose }) {
  const sorted = matches
    .map((m, i) => ({ ...m, origIdx: i }))
    .sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-gray-900">All Career Trajectories</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
          {sorted.map(m => {
            const color = matchColor(m.match_score);
            const isOpt = m.origIdx === optimalIndex;
            return (
              <div
                key={m.origIdx}
                onClick={() => { onSelect(m.origIdx); onClose(); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all hover:bg-gray-50
                  ${isOpt ? 'border-emerald-300/60' : 'border-gray-100'}`}
              >
                <div>
                  <p className="text-[12px] font-bold text-gray-900">
                    {m.title}
                    {isOpt && <Star size={10} className="inline text-emerald-600 ml-1" />}
                  </p>
                  <p className="text-[10px] text-gray-500">{inferCategory(m.title)}</p>
                </div>
                <span className="text-[16px] font-bold" style={{ color }}>{m.match_score}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
