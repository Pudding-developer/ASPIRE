export default function StatCard({ label, value, color = '#cc0000' }) {
  return (
    <div className="bg-[#2a1a0e] border border-white/10 rounded-xl p-5 flex flex-col gap-2">
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
