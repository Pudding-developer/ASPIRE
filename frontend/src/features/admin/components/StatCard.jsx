export default function StatCard({ label, value, color = '#cc0000' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative text-4xl font-black leading-none" style={{ color: color === '#cc0000' ? '#70170f' : color }}>
        {value ?? '—'}
      </div>
      <div className="relative mt-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  );
}
