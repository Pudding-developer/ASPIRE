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

  const thClass = 'text-left text-xs text-gray-500 font-medium uppercase tracking-wider py-3 px-4';
  const tdClass = 'py-3 px-4 text-sm text-gray-300';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invite Tokens</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-[#cc0000] hover:bg-[#a80000] rounded-lg text-sm font-medium transition-colors"
        >
          + Generate New Token
        </button>
      </div>
      <div className="bg-[#2a1a0e] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className={thClass}>Assigned Email</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Used By</th>
              <th className={thClass}>Used At</th>
              <th className={thClass}>Expires At</th>
              <th className={thClass}></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/3">
                <td className={tdClass + ' text-gray-400'}>{t.assigned_email || <span className="text-gray-600 italic">Any</span>}</td>
                <td className={tdClass}><StatusBadge status={t.status} /></td>
                <td className={tdClass + ' text-gray-400'}>{t.used_by_email || '—'}</td>
                <td className={tdClass + ' text-gray-500'}>{t.used_at ? new Date(t.used_at).toLocaleDateString() : '—'}</td>
                <td className={tdClass + ' text-gray-500'}>{new Date(t.expires_at).toLocaleDateString()}</td>
                <td className={tdClass}>
                  {t.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <CopyLinkButton token={t.token} />
                      <button
                        onClick={() => setConfirm(t.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-600 text-sm">No tokens generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a0a00] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">Delete Invite Token</h2>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete this pending token? This action cannot be undone. Any instructor who tries to use this link will be rejected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteToken(confirm);
                  setConfirm(null);
                }}
                className="flex-1 py-2 rounded-lg bg-[#cc0000] hover:bg-[#a80000] text-white text-sm font-medium transition-colors"
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
