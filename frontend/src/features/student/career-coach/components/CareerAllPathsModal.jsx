import React from 'react';
import { X, Star, Pin } from 'lucide-react';
import { CAREER_OPTIONS, inferCategory, matchColor } from '../../../../data/careerConstants';

export default function CareerAllPathsModal({ matches, optimalIndex, visibleTitles, onSelect, onPin, onUnpin, onClose }) {
  const pinned = visibleTitles instanceof Set ? visibleTitles : new Set(visibleTitles || []);
  /* Merge the fixed list of supported careers with whatever the AI pipeline
     scored. Analyzed paths show their match %; the rest are listed but muted
     and unclickable so the student can see every option this app supports. */
  const matchByTitle = new Map(
    (matches || []).map((m, i) => [m.title, { ...m, origIdx: i }])
  );

  const rows = CAREER_OPTIONS.map((opt) => {
    const m = matchByTitle.get(opt.title);
    const base = m
      ? { title: opt.title, score: m.match_score, origIdx: m.origIdx, analyzed: true }
      : { title: opt.title, score: null, origIdx: -1, analyzed: false };
    return { ...base, pinned: pinned.has(opt.title) };
  }).sort((a, b) => {
    // Pinned first, then analyzed (by score desc), then alphabetical.
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.analyzed !== b.analyzed) return a.analyzed ? -1 : 1;
    if (a.analyzed && b.analyzed) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });

  const handleClick = (row) => {
    const isPinned = pinned.has(row.title);
    if (isPinned) {
      // Toggle off — keep the modal open so the student can manage multiple pins.
      if (onUnpin) onUnpin(row.title);
      return;
    }
    // Pin (and select if the AI has scored this path).
    if (row.analyzed && onSelect) onSelect(row.origIdx);
    else if (onPin) onPin(row.title);
  };

  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-[#f2dfdf]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f2dfdf] flex items-center justify-between bg-[linear-gradient(180deg,#ffffff_0%,#fff9f9_100%)]">
          <div>
            <p className="text-[9px] font-black text-[#70170f] uppercase tracking-[0.2em] mb-0.5">Selection Hub</p>
            <h3 className="text-[18px] font-black text-gray-900">All Career Trajectories</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#ead3d3] flex items-center justify-center text-gray-400 hover:text-[#70170f] hover:bg-[#fff5f5] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Grid of Boxes */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#fdfaf9]">
          {rows.map(row => {
            const isOpt = row.analyzed && row.origIdx === optimalIndex;
            const color = row.analyzed ? matchColor(row.score) : '#9ca3af';
            const isPinned = row.pinned;
            return (
              <div
                key={row.title}
                onClick={() => handleClick(row)}
                className={`relative flex flex-col h-full min-h-[120px] p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg
                  ${isPinned
                    ? 'border-[#70170f] bg-white ring-1 ring-[#70170f]/10 shadow-sm'
                    : row.analyzed
                      ? (isOpt ? 'border-emerald-500 bg-white shadow-emerald-100/50 shadow-sm' : 'border-[#f2dfdf] bg-white')
                      : 'border-gray-200 bg-gray-50/50 opacity-80 hover:opacity-100 hover:bg-white'}`}
              >
                {/* Top Badge Indicators */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{inferCategory(row.title)}</span>
                  <div className="flex gap-1.5">
                    {isPinned && <Pin size={12} className="text-[#70170f] fill-[#70170f]/10" />}
                    {isOpt && <Star size={12} className="text-emerald-500 fill-emerald-500/10" />}
                  </div>
                </div>

                {/* Title */}
                <p className={`text-[14px] font-black leading-tight mb-auto ${row.analyzed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {row.title}
                </p>

                {/* Match Score or Action */}
                <div className="mt-4 flex items-end justify-between">
                  <div className="flex-1">
                    {isPinned && (
                      <span className="text-[9px] font-bold text-[#70170f] bg-[#70170f]/5 px-2 py-0.5 rounded-md uppercase">Currently Pinned</span>
                    )}
                  </div>
                  {row.analyzed ? (
                    <div className="text-right">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Match</p>
                      <span className="text-[22px] font-black leading-none" style={{ color }}>{row.score}%</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#70170f] border border-[#70170f]/20 px-3 py-1 rounded-lg bg-[#70170f]/5">
                        {isPinned ? 'Unpin' : 'Pin Path'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
