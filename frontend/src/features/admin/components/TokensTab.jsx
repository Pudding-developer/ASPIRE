import { useState, useCallback } from 'react';
import StatusBadge from './StatusBadge';

function CopyLinkButton({ token }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const link = `${window.location.origin}/instructor/register?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [token]);

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
        copied 
          ? 'border-green-500/30 text-green-400 bg-green-500/10' 
          : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
      }`}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

export default function TokensTab({ tokens, setShowGenerateModal, deleteToken }) {
  const [confirm, setConfirm] = useState(null);

  const thClass = 'text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-3 px-4';
  const tdClass = 'py-3.5 px-4 text-sm text-gray-300';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Invite Tokens</h1>
          <p className="mt-1 text-sm text-gray-500">Create, share, and manage registration tokens for instructors.</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-5 py-2.5 bg-[#70170f] hover:bg-[#5a120c] rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center gap-2"
        >
          <span>+</span> Generate New Token
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-245">
            <thead className="sticky top-0 z-10 bg-[#70170f]">
            <tr>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Assigned Email</th>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Status</th>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Used By</th>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Used At</th>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Expires At</th>
              <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4"></th>
            </tr>
            </thead>
            <tbody>
            {tokens.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors text-gray-900">
                <td className="py-3.5 px-4 text-sm text-gray-700 font-medium">{t.assigned_email || <span className="text-gray-400 italic">Any</span>}</td>
                <td className="py-3.5 px-4 text-sm"><StatusBadge status={t.status} /></td>
                <td className="py-3.5 px-4 text-sm text-gray-700 font-medium">{t.used_by_email || '—'}</td>
                <td className="py-3.5 px-4 text-sm text-gray-500 font-medium">{t.used_at ? new Date(t.used_at).toLocaleDateString() : '—'}</td>
                <td className="py-3.5 px-4 text-sm text-gray-500 font-medium">{new Date(t.expires_at).toLocaleDateString()}</td>
                <td className="py-3.5 px-4 text-sm">
                  {t.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <CopyLinkButton token={t.token} />
                      <button
                        onClick={() => setConfirm(t.id)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm font-medium">No tokens generated yet.</td></tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Delete Invite Token</h2>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-8">
              Are you sure you want to delete this pending token? This action cannot be undone. 
              Any instructor using this link will be unable to register.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-[13px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteToken(confirm);
                  setConfirm(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#70170f] hover:bg-[#5a120c] text-white text-[13px] font-bold transition-all shadow-md"
              >
                Delete Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
