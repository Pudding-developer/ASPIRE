import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const RESULT_CONFIG = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
    badge: 'Analysis Complete',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    title: 'Your career report has been updated!',
    body: 'The AI crew finished analyzing your GitHub activity and academic performance. Your career matches, skill gaps, and roadmap have all been refreshed.',
    cta: 'View Updated Report',
  },
  no_change: {
    icon: Info,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    borderColor: 'border-amber-100',
    badge: 'No Changes Detected',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: "Your data hasn't changed since the last analysis.",
    body: 'Your academic scores and GitHub activity are identical to the previous run. Add new assessments, commit to GitHub, or enroll in new classes to trigger a fresh analysis.',
    cta: 'Got it',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    borderColor: 'border-red-100',
    badge: 'Analysis Failed',
    badgeColor: 'bg-red-100 text-red-700',
    title: 'Something went wrong during the analysis.',
    body: null, // actual error message from hook is shown instead
    cta: 'Dismiss',
  },
};

/**
 * PipelineResultModal — shown when a pipeline job finishes (success / no-change / error).
 *
 * Props:
 *   result  — { outcome: 'success'|'no_change'|'error', message?: string } | null
 *   onClose — called when the user dismisses the modal
 */
export default function PipelineResultModal({ result, onClose }) {
  if (!result) return null;

  const cfg = RESULT_CONFIG[result.outcome] || RESULT_CONFIG.error;
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border ${cfg.borderColor} w-full max-w-md p-8 flex flex-col items-center text-center`}
        style={{ animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-full ${cfg.iconBg} flex items-center justify-center mb-5`}>
          <Icon size={32} className={cfg.iconColor} />
        </div>

        {/* Badge */}
        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-3 ${cfg.badgeColor}`}>
          {cfg.badge}
        </span>

        {/* Heading */}
        <h2 className="text-[17px] font-black text-gray-900 leading-snug mb-2">{cfg.title}</h2>

        {/* Body */}
        <p className="text-[12px] text-gray-500 leading-relaxed mb-6">
          {result.outcome === 'error' && result.message ? result.message : cfg.body}
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className={`px-6 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
            result.outcome === 'success'
              ? 'bg-[#70170f] text-white hover:bg-[#4a0e09]'
              : result.outcome === 'no_change'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {cfg.cta}
        </button>
      </div>

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
