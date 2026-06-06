const BADGE = {
  pending: 'bg-amber-50 text-amber-900 border-amber-200',
  used: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  expired: 'bg-red-50 text-[#70170f] border-red-200',
  active: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  inactive: 'bg-red-50 text-[#70170f] border-red-200',
};

const DOT = {
  pending: 'bg-amber-600',
  used: 'bg-emerald-600',
  expired: 'bg-[#70170f]',
  active: 'bg-emerald-600',
  inactive: 'bg-[#70170f]',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium capitalize ${BADGE[status] || ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
