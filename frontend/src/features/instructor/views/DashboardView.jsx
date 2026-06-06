import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import useAuth from '../../auth/hooks/useAuth';

function yearLabel(value) {
  if (value === 'all') return 'All Class Years';
  return `${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'} Year`;
}

function semesterLabel(value) {
  if (value === 'all') return 'All Semesters';
  return value === 1 ? 'First Semester' : 'Second Semester';
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');
}

function HighlightList({ title, items, renderMeta, metaClass = 'text-gray-600', emptyText }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
      <h3 className="font-bold text-gray-900 mb-4 shrink-0">{title}</h3>
      {items.length === 0 ? (
        <div className="overflow-y-auto max-h-64 pr-2 space-y-3 flex flex-col items-center justify-center flex-1">
          <p className="text-gray-400 text-sm text-center">{emptyText}</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64 pr-2 space-y-3 flex-1">
          {items.map((item) => (
            <div key={`${item.student_id}-${item.class_id ?? 'agg'}`} className="flex items-center gap-3">
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt={item.full_name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#70170f]/10 text-[#70170f] flex items-center justify-center text-xs font-semibold">
                  {initials(item.full_name) || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.full_name}</p>
                {item.sr_code && (
                  <p className="text-xs text-gray-500 truncate">{item.sr_code}</p>
                )}
              </div>
              <span className={`text-sm font-semibold ${metaClass}`}>{renderMeta(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardView({ onCreateClass, stats, loading, classes = [] }) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(classes.map(c => c.year_level).filter(Boolean)));
    return years.sort((a, b) => a - b);
  }, [classes]);

  const availableSemesters = useMemo(() => {
    const semesters = Array.from(new Set(classes.map(c => c.semester).filter(Boolean)));
    return semesters.sort((a, b) => a - b);
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const yearOk = selectedYear === 'all' || cls.year_level === Number(selectedYear);
      const semOk = selectedSemester === 'all' || cls.semester === Number(selectedSemester);
      return yearOk && semOk;
    });
  }, [classes, selectedYear, selectedSemester]);

  const isFiltered = selectedYear !== 'all' || selectedSemester !== 'all';

  const filteredStats = useMemo(() => {
    // When no filter: use the backend's pre-computed DISTINCT student count
    // to avoid double-counting students enrolled in multiple classes.
    // When filtered: sum per-class counts (may overlap) and flag it.
    const totalStudents = isFiltered
      ? filteredClasses.reduce((sum, cls) => sum + (cls.student_count || 0), 0)
      : (stats?.total_students ?? 0);
    return {
      total_students: totalStudents,
      total_students_is_approx: isFiltered,
      active_courses: filteredClasses.length,
      school_year: stats?.school_year ?? '—',
      avg_performance: stats?.avg_performance ?? null,
    };
  }, [filteredClasses, stats, isFiltered]);

  const AT_RISK_THRESHOLD = 60;

  const { topPerformers, atRiskStudents, classRepresentatives } = useMemo(() => {
    const rows = stats?.student_performance ?? [];
    const repRows = stats?.class_representatives ?? [];
    const filteredClassIds = new Set(filteredClasses.map(c => c.id));
    const inScope = rows.filter(r => filteredClassIds.has(r.class_id));

    const perStudent = new Map();
    for (const r of inScope) {
      const cur = perStudent.get(r.student_id) ?? {
        student_id: r.student_id,
        full_name: r.full_name,
        avatar_url: r.avatar_url,
        sr_code: r.sr_code,
        _sum: 0,
        _count: 0,
      };
      cur._sum += r.avg_percentage;
      cur._count += 1;
      perStudent.set(r.student_id, cur);
    }
    const studentAverages = Array.from(perStudent.values()).map(s => ({
      ...s,
      avg_percentage: s._count ? s._sum / s._count : 0,
    }));

    const top = [...studentAverages]
      .sort((a, b) => b.avg_percentage - a.avg_percentage)
      .slice(0, 5);

    const atRisk = studentAverages
      .filter(s => s.avg_percentage < AT_RISK_THRESHOLD)
      .sort((a, b) => a.avg_percentage - b.avg_percentage)
      .slice(0, 5);

    const reps = repRows
      .filter(r => filteredClassIds.has(r.class_id))
      .sort((a, b) => a.course_code.localeCompare(b.course_code));

    return { topPerformers: top, atRiskStudents: atRisk, classRepresentatives: reps };
  }, [stats, filteredClasses]);

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-5">
          {user?.avatar_url && (
            <img 
              src={user.avatar_url} 
              alt={user?.full_name} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg ring-1 ring-[#70170f]/10" 
              referrerPolicy="no-referrer" 
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Portal</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.full_name || 'Professor'}</p>
          </div>
        </div>
        <Button 
          onClick={onCreateClass}
          className="bg-[#70170f] hover:bg-[#4a0e09] text-white flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Create Class
        </Button>
      </div>

      {/* Filters Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 rounded-lg p-3 outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f]"
        >
          <option value="all">All Class Years</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{yearLabel(year)}</option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 rounded-lg p-3 outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f]"
        >
          <option value="all">All Semesters</option>
          {availableSemesters.map((semester) => (
            <option key={semester} value={semester}>{semesterLabel(semester)}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Students', value: loading ? '—' : `${filteredStats.total_students_is_approx ? '~' : ''}${filteredStats.total_students ?? 0}` },
          { label: 'Active Courses', value: loading ? '—' : filteredStats.active_courses ?? '0' },
          { label: 'School Year', value: loading ? '—' : filteredStats.school_year ?? '—' },
          { label: 'Avg Performance', value: loading ? '—' : filteredStats.avg_performance ? `${filteredStats.avg_performance.toFixed(1)}%` : 'N/A' },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#70170f]/30 transition-all cursor-default"
          >
            <p className="text-gray-500 text-sm mb-2">{stat.label}</p>
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Lists Row */}
      <div className="grid md:grid-cols-3 gap-6">
        <HighlightList
          title="Top Performing Students"
          items={topPerformers}
          renderMeta={(s) => `${s.avg_percentage.toFixed(1)}%`}
          metaClass="text-green-700"
          emptyText="No scores recorded yet."
        />

        <HighlightList
          title="Students at Risk"
          items={atRiskStudents}
          renderMeta={(s) => `${s.avg_percentage.toFixed(1)}%`}
          metaClass="text-red-700"
          emptyText={`No students below ${AT_RISK_THRESHOLD}%.`}
        />

        <HighlightList
          title="Class Representatives"
          items={classRepresentatives}
          renderMeta={(s) => s.course_code}
          metaClass="text-gray-600"
          emptyText="No class representatives appointed yet."
        />
      </div>
    </div>
  );
}
