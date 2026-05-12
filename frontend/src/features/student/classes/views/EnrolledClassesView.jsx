import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, BookOpen, Archive, ArrowRight, Loader2, Calendar, Hash, X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { studentService } from '../../../../services/studentService';
import StudentCourseDetailView from '../../performance/views/StudentCourseDetailView';

const ACCENT_COLORS = ['#70170f', '#5b5be8', '#0f9f76', '#d97706', '#7c3aed', '#0ea5a4'];
const gridVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' } } };

/* ─── Join Class Form ─── */
function JoinClassForm({ onSuccess, compact }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await studentService.joinClass(code.trim());
      setSuccess(`Joined ${res.data.subject_name}!`);
      setCode('');
      setTimeout(() => onSuccess?.(), 1200);
    } catch (e) {
      setError(e.message || 'Failed to join class.');
    } finally { setLoading(false); }
  };

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-sm'}>
      <div className="flex gap-2">
        <input
          type="text" value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="e.g. XY7Z4K" disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl text-[13px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
          style={{ border: '1px solid #e0ddd7', backgroundColor: '#fff' }}
        />
        <button onClick={handleJoin} disabled={!code.trim() || loading}
          className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors disabled:opacity-40 flex items-center gap-2 shrink-0"
          style={{ backgroundColor: '#70170f' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>
      {error && <div className="flex items-center gap-1.5 mt-2.5"><AlertCircle size={13} className="text-red-500 shrink-0" /><p className="text-[12px] text-red-500 font-medium">{error}</p></div>}
      {success && <div className="flex items-center gap-1.5 mt-2.5"><CheckCircle2 size={13} className="text-green-600 shrink-0" /><p className="text-[12px] text-green-600 font-medium">{success}</p></div>}
    </div>
  );
}

function JoinClassModal({ open, onClose, onSuccess }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[#eadede] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute right-4 top-4 rounded-md border border-[#f0e8e8] bg-white p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={18} /></button>
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Join Class</p>
              <h3 className="mt-1 text-[22px] font-extrabold text-gray-900">Enter class code</h3>
              <p className="mt-1 text-[13px] text-gray-500">Use the 6-character code shared by your instructor.</p>
            </div>
            <JoinClassForm onSuccess={onSuccess} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#ece8e8] bg-[linear-gradient(180deg,#ffffff_0%,#fff9f9_100%)]">
      <div className="h-1 bg-gray-200" />
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="border-t border-gray-100 pt-4 flex gap-4">
          <div className="h-8 flex-1 bg-gray-200 rounded" />
          <div className="h-8 flex-1 bg-gray-200 rounded" />
        </div>
        <div className="h-2 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

function ClassCard({ cls, index, onClickView }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const enrolledDate = cls.enrolled_at ? new Date(cls.enrolled_at) : null;
  const daysEnrolled = enrolledDate ? Math.max(0, Math.floor((Date.now() - enrolledDate.getTime()) / 86400000)) : null;
  const enrolledLabel = enrolledDate ? enrolledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <button type="button" onClick={() => onClickView(cls)}
      className="group relative flex h-full min-h-62.5 w-full flex-col overflow-hidden rounded-xl border border-[#ece8e8] bg-[linear-gradient(180deg,#ffffff_0%,#fff9f9_100%)] p-5 text-left shadow-[0_5px_16px_rgba(17,24,39,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(17,24,39,0.12)]">
      <div className="absolute bottom-0 left-0 top-0 w-1.25" style={{ backgroundColor: accent }} />
      <div className="mb-4 pl-2">
        <p className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-500">
          {cls.course_code} <span className="h-0.75 w-0.75 rounded-full bg-gray-400" /> Section {cls.section}
        </p>
        <h3 className="line-clamp-2 text-[1.9rem] font-extrabold leading-tight text-[#111827] md:text-[2rem]">{cls.subject_name}</h3>
      </div>
      <div className="mb-5 border-t border-gray-100 pt-4 pl-2">
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ backgroundColor: `${accent}18`, color: '#374151' }}>
            <Calendar size={13} className="text-gray-500" /> Year {cls.year_level}, Semester {cls.semester}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold tracking-wider" style={{ backgroundColor: `${accent}14`, color: '#374151' }}>
            <Hash size={13} className="text-gray-500" /> {cls.class_code || '---'}
          </span>
        </div>
        <p className="mt-3 text-[12px] font-medium text-gray-500">
          {daysEnrolled === null ? 'Enrollment timeline unavailable' : daysEnrolled === 0 ? 'Joined today' : `Joined ${daysEnrolled} day${daysEnrolled > 1 ? 's' : ''} ago`}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {cls.instructor_avatar ? (
            <img src={cls.instructor_avatar} alt={cls.instructor_name} className="w-6 h-6 rounded-full border border-gray-200 object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
              {cls.instructor_name?.charAt(0) || '?'}
            </div>
          )}
          <span className="text-[12px] font-medium text-gray-700">{cls.instructor_name || 'Instructor'}</span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 pl-2">
        <span className="text-[12px] font-semibold text-gray-400">Enrolled: {enrolledLabel}</span>
        <span className="flex items-center gap-1.5 text-[13px] font-bold transition-colors" style={{ color: accent }}>View Course Breakdown <ArrowRight size={16} /></span>
      </div>
    </button>
  );
}



function ArchivedCard({ cls, index, onClickView }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const archivedLabel = cls.archived_at ? new Date(cls.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
  const enrolledLabel = cls.enrolled_at ? new Date(cls.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <button type="button" onClick={() => onClickView()} className="group relative flex h-full min-h-62.5 w-full flex-col overflow-hidden rounded-xl border border-[#e8e8e8] bg-[linear-gradient(180deg,#fafafa_0%,#f5f5f5_100%)] p-5 opacity-80 text-left transition-all hover:opacity-100 hover:shadow-[0_8px_20px_rgba(17,24,39,0.08)] hover:-translate-y-0.5">
      <div className="absolute bottom-0 left-0 top-0 w-1.25 bg-gray-300" />
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
          <Archive size={11} /> Archived
        </span>
      </div>
      <div className="mb-4 pl-2">
        <p className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400">
          {cls.course_code} <span className="h-0.75 w-0.75 rounded-full bg-gray-300" /> Section {cls.section}
        </p>
        <h3 className="line-clamp-2 text-[1.9rem] font-extrabold leading-tight text-gray-400 md:text-[2rem]">{cls.subject_name}</h3>
      </div>
      <div className="mb-4 border-t border-gray-200 pt-4 pl-2">
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-500">
            <Calendar size={13} /> Year {cls.year_level}, Semester {cls.semester}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-semibold tracking-wider text-gray-500">
            <Hash size={13} /> {cls.class_code || '---'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 opacity-80">
          {cls.instructor_avatar ? (
            <img src={cls.instructor_avatar} alt={cls.instructor_name} className="w-6 h-6 rounded-full border border-gray-200 object-cover grayscale" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
              {cls.instructor_name?.charAt(0) || '?'}
            </div>
          )}
          <span className="text-[12px] font-medium text-gray-500">{cls.instructor_name || 'Instructor'}</span>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 pt-4 pl-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-gray-400">Enrolled: {enrolledLabel}</span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400">
            <Clock size={13} /> Archived {archivedLabel}
          </span>
        </div>
        <div className="flex items-center justify-end pt-1">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400 transition-colors group-hover:text-gray-600">View Course Breakdown <ArrowRight size={14} /></span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onSuccess }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(188,19,19,0.12),rgba(188,19,19,0.04))]">
        <BookOpen size={36} className="text-[#70170f]" />
      </div>
      <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Join your first class</h3>
      <p className="text-[13px] text-gray-400 max-w-md text-center leading-relaxed mb-8">
        Your instructor will give you a 6-character class code. Paste it below to enroll and start tracking your performance.
      </p>
      <JoinClassForm onSuccess={onSuccess} />
      <div className="mt-10 flex max-w-sm items-start gap-3 rounded-xl border border-[#ece8e8] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-4 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5"><AlertCircle size={15} className="text-gray-400" /></div>
        <div className="text-left">
          <p className="text-[12px] font-semibold text-gray-700 mb-0.5">Where do I find my class code?</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">Your instructor shares the code when they create a class. It looks like <span className="font-mono font-bold text-gray-600">XY7Z4K</span>. Ask them if you don't have it yet.</p>
        </div>
      </div>
    </div>
  );
}

function EmptyArchive() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <Archive size={36} className="text-gray-400" />
      </div>
      <h3 className="text-[20px] font-extrabold text-gray-700 mb-2">No archived classes</h3>
      <p className="text-[13px] text-gray-400 max-w-md text-center leading-relaxed">
        Classes that have been archived by your instructor will appear here for reference.
      </p>
    </div>
  );
}

/* ─── Main View ─── */
export default function EnrolledClassesView({ user, classes, archivedClasses, predictions, onRefresh }) {
  const [activeTab, setActiveTab] = useState('classes');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const loading = classes === undefined || classes === null;
  const archiveLoading = archivedClasses === undefined || archivedClasses === null;
  const classList = classes || [];
  const archiveList = archivedClasses || [];

  const handleJoinSuccess = () => { onRefresh?.(); setJoinModalOpen(false); };

  const yearOptions = [...new Set([...classList, ...archiveList].map((c) => String(c.year_level)).filter(Boolean))].sort();
  const semesterOptions = [...new Set([...classList, ...archiveList].map((c) => String(c.semester)).filter(Boolean))].sort();
  const hasActiveFilters = Boolean(search.trim()) || yearFilter !== 'all' || semesterFilter !== 'all' || sortBy !== 'recent';

  const filterFn = (cls) => {
    if (yearFilter !== 'all' && String(cls.year_level) !== yearFilter) return false;
    if (semesterFilter !== 'all' && String(cls.semester) !== semesterFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cls.subject_name?.toLowerCase().includes(q) || cls.course_code?.toLowerCase().includes(q) || cls.class_code?.toLowerCase().includes(q);
  };

  const sortFn = (a, b) => {
    if (sortBy === 'az') return (a.subject_name || '').localeCompare(b.subject_name || '');
    if (sortBy === 'code') return (a.course_code || '').localeCompare(b.course_code || '');
    const dateA = a.archived_at || a.enrolled_at;
    const dateB = b.archived_at || b.enrolled_at;
    return (dateB ? new Date(dateB).getTime() : 0) - (dateA ? new Date(dateA).getTime() : 0);
  };

  const filtered = classList.filter(filterFn).sort(sortFn);
  const filteredArchived = archiveList.filter(filterFn).sort(sortFn);

  const tabs = [
    { id: 'classes', label: 'My Classes', icon: BookOpen, count: classList.length },
    { id: 'archived', label: 'Archived Classes', icon: Archive, count: archiveList.length },
  ];

  if (selectedCourse) {
    return (
      <StudentCourseDetailView
        courseName={selectedCourse}
        user={user}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(188,19,19,0.08),transparent_24%),radial-gradient(circle_at_95%_0%,rgba(91,91,232,0.08),transparent_20%)] p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#70170f]/75">Dashboard</p>
          <h1 className="text-[2.2rem] font-extrabold text-gray-900 leading-none">My Classes</h1>
          <p className="text-[13px] text-gray-600">Track your enrolled subjects and view course analytics.</p>
          {!loading && classList.length > 0 && activeTab === 'classes' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-full border border-[#eadede] bg-[linear-gradient(180deg,#ffffff_0%,#fff7f7_100%)] px-3 py-1 text-[12px] font-semibold text-gray-700 shadow-sm">{classList.length} total classes</span>
              <span className="rounded-full border border-[#eadede] bg-[linear-gradient(180deg,#ffffff_0%,#fff7f7_100%)] px-3 py-1 text-[12px] font-semibold text-gray-700 shadow-sm">{filtered.length} shown</span>
            </div>
          )}
        </div>
        {activeTab === 'classes' && (
          <button onClick={() => setJoinModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#d11717_0%,#a81010_100%)] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)] transition-all hover:brightness-105">
            <Plus size={15} /> Join Class
          </button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 rounded-2xl border border-[#e8e6e0] bg-white p-1.5 shadow-sm w-fit">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${activeTab === id ? 'bg-red-50 text-[#70170f] border-[#70170f] shadow-sm' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              <Icon size={15} />
              {label}
              {count > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-[#70170f]/10 text-[#70170f]' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {((activeTab === 'classes' && classList.length > 0) || (activeTab === 'archived' && archiveList.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-[#e8e6e0] shadow-sm backdrop-blur-sm">
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="w-full rounded-xl py-2 pl-9 pr-4 text-[12px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#70170f]/20 bg-white border-none" />
            </div>
            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="bg-transparent text-[12px] font-bold text-gray-600 outline-none cursor-pointer hover:text-[#70170f] px-2">
              <option value="all">All Years</option>
              {yearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="bg-transparent text-[12px] font-bold text-gray-600 outline-none cursor-pointer hover:text-[#70170f] px-2">
              <option value="all">All Semesters</option>
              {semesterOptions.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[12px] font-bold text-gray-600 outline-none cursor-pointer hover:text-[#70170f] px-2 hidden sm:block">
              <option value="recent">Recent</option>
              <option value="az">A–Z</option>
              <option value="code">Code</option>
            </select>
            {hasActiveFilters && (
              <button onClick={() => { setSearch(''); setYearFilter('all'); setSemesterFilter('all'); setSortBy('recent'); }}
                className="ml-2 text-[11px] font-bold text-[#70170f] hover:underline uppercase tracking-wider px-2">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* ── Classes Tab ── */}
      {activeTab === 'classes' && (
        <>
          {loading && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>}
          {!loading && classList.length === 0 && <EmptyState onSuccess={handleJoinSuccess} />}
          {!loading && classList.length > 0 && filtered.length === 0 && (
            <div className="rounded-2xl border border-[#eadede] bg-[linear-gradient(180deg,#ffffff_0%,#fff9f9_100%)] p-10 text-center shadow-sm">
              <h3 className="text-[20px] font-extrabold text-gray-900">No classes found</h3>
              <p className="mt-2 text-[13px] text-gray-500">No classes matched your current search and filters.</p>
              <button onClick={() => { setSearch(''); setYearFilter('all'); setSemesterFilter('all'); setSortBy('recent'); }}
                className="mt-5 rounded-lg border border-[#e8e6e0] px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">Clear filters</button>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <motion.div variants={gridVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((cls, i) => (
                <motion.div key={cls.id} variants={cardVariants}><ClassCard cls={cls} index={i} onClickView={() => setSelectedCourse(cls.subject_name)} /></motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* ── Archived Tab ── */}
      {activeTab === 'archived' && (
        <>
          {archiveLoading && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>}
          {!archiveLoading && archiveList.length === 0 && <EmptyArchive />}
          {!archiveLoading && archiveList.length > 0 && (
            <>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <Archive size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-amber-700 font-medium">These classes have been archived by your instructor. Your enrollment records are preserved for reference.</p>
              </div>
              <motion.div variants={gridVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredArchived.map((cls, i) => (
                  <motion.div key={cls.id} variants={cardVariants}><ArchivedCard cls={cls} index={i} onClickView={() => setSelectedCourse(cls.subject_name)} /></motion.div>
                ))}
              </motion.div>
              {filteredArchived.length === 0 && hasActiveFilters && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
                  <p className="text-gray-500 font-medium">No archived classes match your current filters.</p>
                  <button onClick={() => { setSearch(''); setYearFilter('all'); setSemesterFilter('all'); setSortBy('recent'); }}
                    className="mt-4 text-[13px] font-bold text-[#70170f] hover:underline">Clear filters</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <JoinClassModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} onSuccess={handleJoinSuccess} />
    </div>
  );
}
