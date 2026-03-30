export default function StudentsTab({ students, page, setPage, totalPages }) {
  const thClass = 'text-left text-xs text-gray-500 font-medium uppercase tracking-wider py-3 px-4';
  const tdClass = 'py-3 px-4 text-sm text-gray-300';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Students</h1>
      <div className="bg-[#2a1a0e] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className={thClass}>Student</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>SR Code</th>
              <th className={thClass}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/3">
                <td className={tdClass}>
                  <div className="flex items-center gap-2.5">
                    {s.avatar_url
                      ? <img src={s.avatar_url} className="w-7 h-7 rounded-full" alt="" />
                      : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">{(s.full_name || '?')[0]}</div>
                    }
                    <span className="font-medium text-white">{s.full_name || '—'}</span>
                  </div>
                </td>
                <td className={tdClass + ' text-gray-400'}>{s.email}</td>
                <td className={tdClass}><code className="text-xs bg-white/10 px-2 py-0.5 rounded">{s.sr_code}</code></td>
                <td className={tdClass + ' text-gray-500'}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-gray-600 text-sm">No students yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
          className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >Previous</button>
        <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
          className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >Next</button>
      </div>
    </div>
  );
}
