import React, { useState, useMemo } from 'react';
import { RotateCcw, Trash2, Users, Filter } from 'lucide-react';

export default function ArchivedClassesView({ classes = [], onRestore, onDelete }) {
  const [yearFilter, setYearFilter] = useState('all');
  const [semFilter, setSemFilter] = useState('all');

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchYear = yearFilter === 'all' || String(cls.year_level) === yearFilter;
      const matchSem = semFilter === 'all' || String(cls.semester) === semFilter;
      return matchYear && matchSem;
    });
  }, [classes, yearFilter, semFilter]);
  if (classes.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Archived Classes</h2>
        <p className="text-gray-500">Classes you archive will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Archived Classes</h1>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 text-gray-400 border-r border-gray-100">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          <div className="flex items-center gap-4 px-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-600 outline-none cursor-pointer hover:text-[#70170f] transition-colors"
            >
              <option value="all">All Year Levels</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <div className="w-px h-4 bg-gray-200" />

            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-600 outline-none cursor-pointer hover:text-[#70170f] transition-colors"
            >
              <option value="all">All Semesters</option>
              <option value="1">1st Sem</option>
              <option value="2">2nd Sem</option>
              <option value="3">Midyear</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredClasses.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-gray-500 font-medium">No archived classes match your current filters.</p>
          <button 
            onClick={() => { setYearFilter('all'); setSemFilter('all'); }}
            className="mt-4 text-[#70170f] font-bold text-sm hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium">
              Archived on {cls.archived_at ? new Date(cls.archived_at).toLocaleDateString() : '—'}
            </div>
            <div className="mb-8 mt-2">
              <h3 className="text-xl font-bold text-gray-400 mb-1">{cls.subject_name}</h3>
              <p className="text-gray-500 text-sm flex items-center flex-wrap gap-y-1">
                {cls.course_code} — Section {cls.section}
                <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[9px] font-bold uppercase tracking-tight">
                  {cls.year_level}{cls.year_level === 1 ? 'st' : cls.year_level === 2 ? 'nd' : cls.year_level === 3 ? 'rd' : 'th'} Year · {cls.semester === 1 ? '1st Sem' : cls.semester === 2 ? '2nd Sem' : 'Midyear'}
                </span>
              </p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Users size={16} />
                <span>{cls.student_count ?? 0} Students</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRestore(cls.id); }}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                  title="Restore Class"
                >
                  <RotateCcw size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(cls.id); }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  title="Delete Permanently"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  );
}
