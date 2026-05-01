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
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-gray-900">All Career Trajectories</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
          {rows.map(row => {
            const isOpt = row.analyzed && row.origIdx === optimalIndex;
            const color = row.analyzed ? matchColor(row.score) : '#9ca3af';
            const isPinned = row.pinned;
            return (
              <div
                key={row.title}
                onClick={() => handleClick(row)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all hover:bg-gray-50
                  ${isPinned
                    ? 'border-[#70170f]/40 bg-[#fff8f8]'
                    : row.analyzed
                      ? (isOpt ? 'border-emerald-300/60' : 'border-gray-100')
                      : 'border-gray-100 bg-gray-50/40'}`}
              >
                <div className="min-w-0">
                  <p className={`text-[12px] font-bold flex items-center gap-1 ${row.analyzed ? 'text-gray-900' : 'text-gray-600'}`}>
                    <span className="truncate">{row.title}</span>
                    {isOpt && <Star size={10} className="text-emerald-600 shrink-0" />}
                    {isPinned && <Pin size={10} className="text-[#70170f] shrink-0" />}
                  </p>
                  <p className="text-[10px] text-gray-500">{inferCategory(row.title)}</p>
                </div>
                {row.analyzed ? (
                  <span className="text-[16px] font-bold shrink-0 ml-2" style={{ color }}>{row.score}%</span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0 ml-2">
                    {isPinned ? 'Pinned' : 'Pin'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
