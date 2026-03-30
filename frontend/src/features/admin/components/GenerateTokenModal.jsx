import { useState, useEffect } from 'react';
import { API_BASE, authHeaders } from '../utils';

export default function GenerateTokenModal({ token: jwt, onClose, onGenerated }) {
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState(48);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const generate = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/admin/tokens/generate`, {
        method: 'POST',
        headers: authHeaders(jwt),
        body: JSON.stringify({ assigned_email: email || null, expires_in_hours: hours }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || 'Failed to generate token');
      } else {
        setResult(data.data);
        onGenerated();
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.invite_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a0a00] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Generate Invite Token</h2>

        {errorMsg && (
          <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            Error: {errorMsg}
          </div>
        )}

        {!result ? (
          <>
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1.5 block">Assigned Email (optional)</label>
              <input
                className="w-full bg-[#110600] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#cc0000] text-sm"
                placeholder="instructor@g.batstate-u.edu.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="text-sm text-gray-400 mb-1.5 block">Expires In</label>
              <select
                className="w-full bg-[#110600] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#cc0000] text-sm"
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
              >
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>1 week</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={generate} disabled={loading} className="flex-1 py-2 rounded-lg bg-[#cc0000] hover:bg-[#a80000] text-white text-sm font-medium transition-colors disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </>
        ) : (
          <>
            {result.assigned_email ? (
              result.email_sent ? (
                <p className="text-green-400 text-sm mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  ✅ Invite successfully sent to instructor's email.
                </p>
              ) : (
                <p className="text-yellow-400 text-sm mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  ⚠️ Failed to send email. Copy the link below manually.
                </p>
              )
            ) : (
              <p className="text-yellow-400 text-sm mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                ⚠️ This link will not be shown again. Copy it now.
              </p>
            )}
            
            <p className="text-gray-400 text-sm mb-3">
              Expires on: {new Date(result.expires_at).toLocaleString()}
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-[#110600] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                readOnly
                value={result.invite_link}
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-[#cc0000] text-white text-xs font-medium hover:bg-[#a80000] transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <button onClick={onClose} className="w-full py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">Close</button>
          </>
        )}
      </div>
    </div>
  );
}
