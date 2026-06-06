import { Search } from 'lucide-react';

export default function StudentsTab({ 
  students, 
  page, 
  setPage, 
  totalPages, 
  search, 
  setSearch, 
  loading,
  instructors = [],
  onAssignAdvisor
}) {
  return (
    <div>
      {/* Header section with Search bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Students</h1>
          <p className="mt-1 text-sm text-gray-500">View registered students, their SR Codes, and their chosen careers.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f] text-sm shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-230">
            <thead className="sticky top-0 z-10 bg-[#70170f]">
              <tr>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Student</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">SR Code</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Email</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Chosen Career</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Career Chosen At</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Advisor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm font-medium">
                    Loading students...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2.5">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} className="w-7 h-7 rounded-full border border-gray-100" alt="" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {(s.full_name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-gray-900">{s.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-900">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono">{s.sr_code}</code>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-600">{s.email}</td>
                    <td className="py-3.5 px-4 text-sm text-gray-700 font-medium">
                      {s.chosen_career || <span className="text-gray-400 italic">None selected</span>}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-500 font-medium">
                      {s.career_chosen_at ? new Date(s.career_chosen_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <select
                        value={s.advisor_id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onAssignAdvisor(s.id, val ? parseInt(val) : null);
                        }}
                        className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f] transition-all cursor-pointer font-medium max-w-[180px] truncate"
                      >
                        <option value="">Unassigned</option>
                        {instructors.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm font-medium">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-[13px] font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-[13px] font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
