import { useState } from 'react';
import { ChevronDown, Link2, AlertTriangle, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';

const SEVERITY_STYLES = {
  at_risk: {
    label: 'At Risk',
    stripe: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    Icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
  needs_improvement: {
    label: 'Needs Improvement',
    stripe: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    Icon: TrendingDown,
    iconColor: 'text-amber-600',
  },
  preparatory: {
    label: 'Preparatory',
    stripe: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
    Icon: Sparkles,
    iconColor: 'text-green-600',
  },
};

function InterventionCard({ intervention, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const style = SEVERITY_STYLES[intervention.severity] || SEVERITY_STYLES.needs_improvement;
  const { Icon } = style;
  const subjectLabel = [intervention.subject_code, intervention.subject_name]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="border border-[#f0dddd] rounded-2xl bg-white/75 overflow-hidden transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.25)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-stretch text-left"
      >
        <span className={`w-1 shrink-0 ${style.stripe}`} aria-hidden="true" />

        <div className="flex-1 px-4 py-3 flex items-center gap-3 hover:bg-[#fff5f5]/60 transition-colors">
          <Icon size={16} className={`${style.iconColor} shrink-0`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {subjectLabel || 'Subject'} · ILO {intervention.ilo_number}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
                {style.label}
              </span>
            </div>
            <p className="text-[12.5px] text-gray-800 leading-snug line-clamp-2">
              {intervention.ilo_statement}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[18px] font-extrabold text-gray-900 leading-none tabular-nums">
              {Math.round(intervention.current_score)}%
            </div>
            <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-1">
              Current
            </div>
          </div>

          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 pt-3 border-t border-[#f7eaea] space-y-4 bg-[#fffdfd]">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {intervention.severity === 'preparatory' ? 'What to start learning' : 'What to practice'}
            </p>
            <p className="text-[12.5px] text-gray-700 leading-relaxed">
              {intervention.advice}
            </p>
          </div>

          {intervention.affected_subjects && intervention.affected_subjects.length > 0 && (
            <div className="rounded-xl bg-[#fff8f8] border border-[#f3dada] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 size={12} className="text-[#7a0d0d]" />
                <p className="text-[10px] font-bold text-[#7a0d0d] uppercase tracking-widest">
                  Why this matters
                </p>
              </div>
              <ul className="space-y-2">
                {intervention.affected_subjects.map((s, idx) => (
                  <li key={`${s.code}-${idx}`} className="flex gap-2">
                    <span className="text-[11px] font-bold text-[#7a0d0d] shrink-0 tabular-nums">
                      {s.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-semibold text-gray-800">{s.name}</p>
                      <p className="text-[11px] text-gray-600 leading-snug">{s.reason || s.why}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SEVERITY_RANK = { at_risk: 0, needs_improvement: 1, preparatory: 2 };

function formatUpdatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SkillInterventions({ interventions, updatedAt }) {
  const [prepOpen, setPrepOpen] = useState(false);

  const items = Array.isArray(interventions) ? interventions : [];
  const remedial = items
    .filter((i) => i.severity === 'at_risk' || i.severity === 'needs_improvement')
    .sort((a, b) => (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || (a.current_score - b.current_score));
  const preparatory = items.filter((i) => i.severity === 'preparatory');

  const atRiskCount = remedial.filter((i) => i.severity === 'at_risk').length;
  const needsCount = remedial.filter((i) => i.severity === 'needs_improvement').length;
  const updatedLabel = formatUpdatedAt(updatedAt);

  const showEmptyState = remedial.length === 0 && preparatory.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            SKILL INTERVENTIONS
          </p>
          {remedial.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              {atRiskCount > 0 && (
                <span className="text-red-600">{atRiskCount} at risk</span>
              )}
              {needsCount > 0 && (
                <span className="text-amber-600">{needsCount} developing</span>
              )}
            </div>
          )}
        </div>
        {updatedLabel && (
          <p className="text-[10px] text-gray-400 font-medium mb-3">
            Last updated: {updatedLabel}
          </p>
        )}
        {!updatedLabel && <div className="mb-3" />}

        {showEmptyState ? (
          <div className="flex items-center gap-2 px-4 py-6 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <p className="text-[12px] text-green-800 leading-snug">
              You're meeting every ILO target and there are no downstream dependencies queued up. Keep the momentum.
            </p>
          </div>
        ) : remedial.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle2 size={14} className="text-green-600 shrink-0" />
            <p className="text-[11.5px] text-green-800 leading-snug">
              No remedial interventions needed — every ILO is on track. See preparatory work below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {remedial.map((intervention, i) => (
              <InterventionCard
                key={`r-${intervention.subject_code || intervention.subject_name}-${intervention.ilo_number}-${i}`}
                intervention={intervention}
              />
            ))}
          </div>
        )}
      </div>

      {preparatory.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setPrepOpen(!prepOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#f0dddd] bg-white/75 hover:bg-[#fff5f5]/60 transition-colors mb-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-green-600" />
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                Prepare for What's Next
              </p>
              <span className="text-[10px] text-gray-500 font-semibold">
                {preparatory.length} {preparatory.length === 1 ? 'subject' : 'subjects'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${prepOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {prepOpen && (
            <div className="space-y-3">
              {preparatory.map((intervention, i) => (
                <InterventionCard
                  key={`p-${intervention.subject_code || intervention.subject_name}-${intervention.ilo_number}-${i}`}
                  intervention={intervention}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
