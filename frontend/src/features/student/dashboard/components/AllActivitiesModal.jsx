import React, { useEffect, useRef } from 'react';
import { X, BookOpen, TrendingUp, Github, Star, Bell } from 'lucide-react';
import useActivityFeed from '../hooks/useActivityFeed';

const VISUALS = {
  grade_released: { icon: BookOpen,   color: 'bg-emerald-100 text-emerald-600' },
  career_updated: { icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  github_synced:  { icon: Github,     color: 'bg-blue-100 text-blue-600' },
  skill_milestone:{ icon: Star,       color: 'bg-yellow-100 text-yellow-600' },
};

function formatTime(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  if (isNaN(then.getTime())) return '';
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}

export default function AllActivitiesModal({ onClose }) {
  const { items, loading } = useActivityFeed(50);
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl max-h-[80vh] bg-gradient-to-br from-white via-[#fffbfb] to-[#fcf4f2] border border-[#eed7d3] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#f2dfdf] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">All Activity</p>
            <h3 className="text-[16px] font-bold text-gray-900">System Feed</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && items.length === 0 ? (
            <p className="text-[12px] text-gray-400">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-[12px] text-gray-400">No activity yet.</p>
          ) : (
            items.map((it) => {
              const visual = VISUALS[it.type] ?? { icon: Bell, color: 'bg-gray-100 text-gray-500' };
              const Icon = visual.icon;
              return (
                <div key={it.id} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${visual.color}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 leading-snug">{it.title}</p>
                    {it.subtitle && (
                      <p className="text-[12px] text-gray-500 mt-0.5">{it.subtitle}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{formatTime(it.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
