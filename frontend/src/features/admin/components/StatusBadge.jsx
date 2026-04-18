const BADGE = {
  pending:  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  used:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  expired:  'bg-red-500/15 text-red-300 border-red-500/25',
  active:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  inactive: 'bg-red-500/15 text-red-300 border-red-500/25',
};

const DOT = {
  pending: 'bg-amber-400',
  used: 'bg-emerald-400',
  expired: 'bg-red-400',
  active: 'bg-emerald-400',
  inactive: 'bg-red-400',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium capitalize ${BADGE[status] || ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
