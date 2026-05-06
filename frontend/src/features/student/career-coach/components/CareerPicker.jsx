import { useState, useEffect, useMemo } from 'react';
import { Bot, Check, Loader2, AlertCircle, Star, ChevronRight, X, Sparkles } from 'lucide-react';
import { CAREER_OPTIONS, inferCategory } from '../../../../data/careerConstants';
import SearchInput from '../../../../components/ui/SearchInput';



/**
 * CareerPicker — first-touch screen for the AI Career Coach.
 *
 * Lets students freely pick any of the available career paths *before* the
 * AI pipeline has been run. Clicking a card opens a confirmation modal that
 * both saves the choice as their goal AND kicks off the AI compatibility
 * report in a single action.
 */
export default function CareerPicker({
  chosenCareer,
  onChoose,
  careerLoading,
  onGenerateReport,
  isRunning,
  pipelineError,
}) {
  const [confirmCareer, setConfirmCareer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCareers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CAREER_OPTIONS;
    return CAREER_OPTIONS.filter(c => (c.title || '').toLowerCase().includes(q));
  }, [search]);

  // If the pipeline starts (parent flips isRunning), tear down the modal.
  useEffect(() => {
    if (isRunning) {
      setConfirmCareer(null);
      setSubmitting(false);
    }
  }, [isRunning]);

  /* Card click: save the goal immediately (so the highlight moves), then open
     the modal to ask about running the AI analysis as a separate decision.
     This way "Cancel" only cancels the analysis, not the goal change. */
  const handleCardClick = async (title) => {
    if (careerLoading || isRunning) return;
    if (title !== chosenCareer) {
      try {
        await onChoose(title);
      } catch {
        return;
      }
    }
    setConfirmCareer(title);
  };

  const closeModal = () => {
    if (submitting) return;
    setConfirmCareer(null);
  };

  const confirmAnalyze = () => {
    if (!confirmCareer || submitting) return;
    setSubmitting(true);
    onGenerateReport();
  };

  const confirmCareerData = CAREER_OPTIONS.find((c) => c.title === confirmCareer);

  return (
    <div className="p-8">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[#70170f]/10 flex items-center justify-center mb-5">
          <Bot size={28} className="text-[#70170f]" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#70170f] animate-pulse" />
          <span className="text-[10px] font-bold text-[#70170f] uppercase tracking-[0.2em]">
            CHOOSE YOUR PATH
          </span>
        </div>
        <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-none mb-3">
          Pick the career you want to pursue
        </h1>
        <p className="text-[12px] text-gray-500 max-w-xl leading-relaxed">
          ASPIRE will tailor your roadmap, skill gap analysis, and AI coach around the
          path you choose. Selecting a card runs the AI compatibility report so you can
          see your fit right away.
        </p>
      </div>



      <div className="max-w-xl mx-auto mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search careers (e.g. Software Engineer, Data Analyst)..."
        />
        {search && (
          <p className="text-[12px] text-gray-500 mt-2 text-center">
            {filteredCareers.length} of {CAREER_OPTIONS.length} careers match
          </p>
        )}
      </div>

      {filteredCareers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No careers match "{search}".
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCareers.map((career) => {
          const isChosen = chosenCareer === career.title;
          const category = inferCategory(career.title);

          return (
            <button
              key={career.title}
              type="button"
              onClick={() => handleCardClick(career.title)}
              disabled={careerLoading || isRunning}
              className={`text-left rounded-2xl p-5 border transition-all flex flex-col h-full relative overflow-hidden disabled:cursor-not-allowed disabled:opacity-60
                ${isChosen
                  ? 'bg-[#fff8f8] border-2 border-[#70170f] shadow-md'
                  : 'bg-white border-gray-100 hover:border-[#70170f]/40 hover:shadow-md'}`}
            >
              {isChosen && (
                <div className="absolute top-0 right-0 bg-[#70170f] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg z-10 shadow-sm flex items-center gap-1">
                  <Check size={10} /> YOUR GOAL
                </div>
              )}

              <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mb-2">
                {category}
              </span>

              <p className="text-[14px] font-extrabold leading-snug mb-2 text-gray-900">
                {career.title}
              </p>

              <p className="text-[11px] leading-relaxed text-gray-500 mb-4">
                {career.blurb}
              </p>

              <div className="flex gap-1 flex-wrap mt-auto mb-3">
                {career.skills.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded
                      ${isChosen ? 'bg-red-50 text-[#70170f]' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div
                className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5
                  ${isChosen
                    ? 'bg-[#70170f] text-white'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'}`}
              >
                {isChosen ? (
                  <><Check size={12} /> Selected</>
                ) : (
                  <>Choose this path <ChevronRight size={12} /></>
                )}
              </div>
            </button>
          );
        })}
      </div>
      )}

      {confirmCareer && confirmCareerData && (
        <ConfirmAnalysisModal
          career={confirmCareerData}
          onCancel={closeModal}
          onConfirm={confirmAnalyze}
          submitting={submitting}
        />
      )}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */

function ConfirmAnalysisModal({ career, onCancel, onConfirm, submitting }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onCancel]);

  const category = inferCategory(career.title);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="p-6 pt-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[#70170f]/10 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-[#70170f]" />
            </div>
            <div>
              <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400 block">
                {category}
              </span>
              <p className="text-[16px] font-extrabold text-gray-900 leading-tight">
                {career.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            <Check size={12} /> Goal saved
          </div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-2">
            Run AI compatibility analysis now?
          </h2>
          <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
            ASPIRE will analyze your academic performance, ILO/SO scores, and GitHub
            activity against <strong className="text-gray-700">{career.title}</strong> to
            grade your fit and map your skill gaps. This usually takes 1–2 minutes.
            You can also skip this and run it later.
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-5">
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400 block mb-2">
              KEY SKILLS
            </span>
            <div className="flex gap-1 flex-wrap">
              {career.skills.map((s) => (
                <span
                  key={s}
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className={`flex-[1.4] py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2
                ${submitting
                  ? 'bg-[#70170f]/70 text-white cursor-not-allowed'
                  : 'bg-[#70170f] hover:bg-[#4a0e09] text-white'}`}
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Starting…</>
              ) : (
                <><Star size={14} /> Run Analysis</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
