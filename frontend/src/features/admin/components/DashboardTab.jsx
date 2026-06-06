import StatCard from './StatCard';

export default function DashboardTab({ stats }) {
  const totalTokens = stats
    ? (stats.total_tokens_generated ?? 0)
    : 0;
  const usedRate = totalTokens > 0
    ? Math.round(((stats.total_tokens_used ?? 0) / totalTokens) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor platform activity, instructor access, and invite token health.</p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Token usage</span>
            <span className="text-sm font-black text-gray-900">{usedRate}%</span>
          </div>
        )}
      </div>
      {stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Students" value={stats.total_students} />
          <StatCard label="Total Instructors" value={stats.total_instructors} color="#f59e0b" />
          <StatCard label="Tokens Generated" value={stats.total_tokens_generated} color="#8b5cf6" />
          <StatCard label="Tokens Used" value={stats.total_tokens_used} color="#10b981" />
          <StatCard label="Tokens Pending" value={stats.total_tokens_pending} color="#f59e0b" />
          <StatCard label="Tokens Expired" value={stats.total_tokens_expired} color="#6b7280" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
          ))}
        </div>
      )}
    </div>
  );
}
