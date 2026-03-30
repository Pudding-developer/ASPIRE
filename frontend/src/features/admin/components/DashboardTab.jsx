import StatCard from './StatCard';

export default function DashboardTab({ stats }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>
      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Students" value={stats.total_students} />
          <StatCard label="Total Instructors" value={stats.total_instructors} color="#f59e0b" />
          <StatCard label="Tokens Generated" value={stats.total_tokens_generated} color="#8b5cf6" />
          <StatCard label="Tokens Used" value={stats.total_tokens_used} color="#10b981" />
          <StatCard label="Tokens Pending" value={stats.total_tokens_pending} color="#f59e0b" />
          <StatCard label="Tokens Expired" value={stats.total_tokens_expired} color="#6b7280" />
        </div>
      ) : (
        <div className="text-gray-500 animate-pulse">Loading stats...</div>
      )}
    </div>
  );
}
