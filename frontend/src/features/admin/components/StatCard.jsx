export default function StatCard({ label, value, color = '#cc0000' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0.18)_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/20">
      <span className="pointer-events-none absolute -top-10 -right-5.5 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundColor: color }} />
      <div className="relative text-4xl font-semibold leading-none" style={{ color }}>{value ?? '—'}</div>
      <div className="relative mt-3 text-xs uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}
