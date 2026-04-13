import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, BookOpen, ArrowRight, Loader2, Calendar, Hash, Users, User, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { studentService } from '../../../services/studentService';
import ClassDirectoryModal from '../components/ClassDirectoryModal';

const ACCENT_COLORS = ['#e11d48', '#4f46e5', '#059669', '#d97706', '#7c3aed', '#0d9488'];

/* ─── Join Class Input (shared between empty state & grid card) ─── */
function JoinClassForm({ onSuccess, compact }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await studentService.joinClass(code.trim());
      setSuccess(`Joined ${res.data.subject_name}!`);
      setCode('');
      setTimeout(() => onSuccess?.(), 1200);
    } catch (e) {
      setError(e.message || 'Failed to join class.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-sm'}>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. XY7Z4K"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          style={{ border: '1px solid #e0ddd7', backgroundColor: '#fff' }}
        />
        <button
          onClick={handleJoin}
          disabled={!code.trim() || loading}
          className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
          style={{ backgroundColor: '#bc1313' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
          <p className="text-[12px] text-red-500 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
          <p className="text-[12px] text-green-600 font-medium">{success}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #e8e6e0' }}>
      <div className="h-1 bg-gray-200" />
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="border-t border-gray-100 pt-4 flex gap-4">
          <div className="h-8 flex-1 bg-gray-200 rounded" />
          <div className="h-8 flex-1 bg-gray-200 rounded" />
          <div className="h-8 flex-1 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-2 bg-gray-200 rounded-full" />
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ─── Class Card ─── */
function ClassCard({ cls, index, onClickView }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div className="relative bg-white rounded-xl overflow-hidden p-6 flex flex-col hover:shadow-md transition-shadow" style={{ border: '0.5px solid #e8e6e0' }}>
      {/* Left colored edge accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: accent }} />

      {/* Header Row: Course Code & Title */}
      <div className="flex-1 pr-3 pl-2 mb-6">
        <p className="text-[13px] font-bold text-gray-500 tracking-wider uppercase mb-1.5 flex items-center gap-2">
          {cls.course_code} <span className="w-[3px] h-[3px] rounded-full bg-gray-400" /> Section {cls.section}
        </p>
        <h3 className="font-extrabold text-[#111827] leading-tight" style={{ fontSize: 20 }}>
          {cls.subject_name}
        </h3>
      </div>

      <div className="border-t border-gray-100 mb-5" />

      {/* Class Information Details */}
      <div className="flex flex-col gap-4 pl-2 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Term</p>
            <p className="text-[15px] font-semibold text-gray-800">
              Year {cls.year_level}, Semester {cls.semester}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
             <Hash size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Class Code</p>
            <p className="text-[16px] font-extrabold text-gray-800 tracking-widest bg-gray-100 px-2.5 py-0.5 rounded inline-block">
              {cls.class_code || '---'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-auto mb-4" />

      {/* Footer Action */}
      <div className="flex justify-between items-center pl-2">
         <span className="text-[13px] font-semibold text-gray-400">
           Enrolled: {cls.enrolled_at ? new Date(cls.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
         </span>
        <button
          onClick={() => onClickView(cls)}
          className={`text-[14px] font-bold text-[#111827] hover:text-[${accent}] transition-colors flex items-center gap-1.5 focus:outline-none`}
        >
          View Class <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Join Class Card (grid tail) ─── */
function JoinClassCard({ onSuccess }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center text-center p-8 transition-colors"
      style={{ border: '2px dashed #d6d3cd', backgroundColor: '#fafaf8', minHeight: 340, cursor: open ? 'default' : 'pointer' }}
      onClick={() => !open && setOpen(true)}
    >
      {!open ? (
        <>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Plus size={22} className="text-gray-400" />
          </div>
          <p className="text-[14px] font-bold text-gray-800 mb-1">Join a class</p>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            Enter a class code from your instructor
          </p>
        </>
      ) : (
        <div className="w-full max-w-[260px]" onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 mx-auto">
            <Plus size={22} className="text-gray-400" />
          </div>
          <p className="text-[13px] font-bold text-gray-800 mb-3">Enter class code</p>
          <JoinClassForm onSuccess={onSuccess} compact />
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ onSuccess }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Illustration area */}
      <div className="w-20 h-20 rounded-2xl bg-[#bc1313]/5 flex items-center justify-center mb-6">
        <BookOpen size={36} className="text-[#bc1313]" />
      </div>

      <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Join your first class</h3>
      <p className="text-[13px] text-gray-400 max-w-md text-center leading-relaxed mb-8">
        Your instructor will give you a 6-character class code. Paste it below to
        enroll and start tracking your performance.
      </p>

      {/* Join form */}
      <JoinClassForm onSuccess={onSuccess} />

      {/* Help hint */}
      <div className="mt-10 flex items-start gap-3 max-w-sm bg-white rounded-xl p-4" style={{ border: '0.5px solid #e8e6e0' }}>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle size={15} className="text-gray-400" />
        </div>
        <div className="text-left">
          <p className="text-[12px] font-semibold text-gray-700 mb-0.5">Where do I find my class code?</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Your instructor shares the code when they create a class. It looks like <span className="font-mono font-bold text-gray-600">XY7Z4K</span>. Ask them if you don't have it yet.
          </p>
        </div>
      </div>
    </div>
  );
}


/* ─── Main View ─── */
export default function EnrolledClassesView({ classes, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  const loading = classes === undefined || classes === null;
  const classList = classes || [];

  const handleJoinSuccess = () => {
    onRefresh?.();
  };

  // Filter by search
  const filtered = classList.filter((cls) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cls.subject_name?.toLowerCase().includes(q) ||
      cls.course_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Dashboard</p>
          <h1 className="text-[2.2rem] font-extrabold text-gray-900 leading-none">Class Directory</h1>
        </div>

        {/* Search */}
        {!loading && classList.length > 0 && (
          <div className="relative w-full md:w-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or title..."
              className="pl-10 pr-4 py-2.5 rounded-xl text-[14px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full md:w-[280px] transition-shadow shadow-sm"
              style={{ border: '1px solid #e8e6e0', backgroundColor: '#fff' }}
            />
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && classList.length === 0 && <EmptyState onSuccess={handleJoinSuccess} />}

      {/* Class grid */}
      {!loading && classList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cls, i) => (
            <ClassCard key={cls.id} cls={cls} index={i} onClickView={setSelectedClass} />
          ))}
          <JoinClassCard onSuccess={handleJoinSuccess} />
        </div>
      )}

      {/* Class Directory Modal */}
      <AnimatePresence>
        {selectedClass && (
          <ClassDirectoryModal cls={selectedClass} onClose={() => setSelectedClass(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
