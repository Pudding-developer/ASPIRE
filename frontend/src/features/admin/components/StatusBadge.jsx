const BADGE = {
  pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  used:     'bg-green-500/20 text-green-400 border-green-500/30',
  expired:  'bg-red-500/20 text-red-400 border-red-500/30',
  active:   'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${BADGE[status] || ''}`}>
      {status}
    </span>
  );
}
