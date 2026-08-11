/**
 * InstructorRegisterPage — Public page for instructor invite-token registration.
 *
 * Flow:
 *   1. Read ?token= from URL → call GET /instructor/register?token= to validate
 *   2. If 403 → show full-page error card (invalid/expired invitation)
 *   3. If 200 → show "Continue with Google" registration card
 *      - If ?error= is in URL → show error banner above the button (retry possible)
 *      - If assigned_email is set → show read-only email badge
 *   4. Google button → GET /auth/login/google?flow=instructor_register&token=XXX
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import aspireLogo from '../../assets/aspire-logo.png';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = rawBase.replace(/\/+$/, '');

const ERROR_MESSAGES = {
  EMAIL_NOT_ALLOWED:
    'You must sign in with your @g.batstate-u.edu.ph Google account.',
  EMAIL_MISMATCH:
    'This invitation was sent to a different email address. Please sign in with the correct account.',
  INVALID_TOKEN:
    'This invitation link is invalid or has expired. Please contact your administrator.',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED', // handled specially
};

export default function InstructorRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const errorCode = searchParams.get('error') || '';

  const [tokenState, setTokenState] = useState('loading'); // loading | valid | invalid
  const [assignedEmail, setAssignedEmail] = useState(null);

  // Validate the invite token on mount
  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      return;
    }
    fetch(`${API_BASE}/instructor/register?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) {
          setTokenState('invalid');
          return;
        }
        const data = await r.json();
        if (data?.data?.valid) {
          setTokenState('valid');
          setAssignedEmail(data.data.assigned_email ?? null);
        } else {
          setTokenState('invalid');
        }
      })
      .catch(() => setTokenState('invalid'));
  }, [token]);

  const handleGoogleSignIn = () => {
    const url = `${API_BASE}/auth/login/google?flow=instructor_register&token=${encodeURIComponent(token)}`;
    window.location.href = url;
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (tokenState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0101] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-4 border-white/10 border-t-[#cc0000]"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
          <p className="text-gray-500 text-sm">Validating invitation…</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Invalid / expired token
  // -------------------------------------------------------------------------
  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0a0101] flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <img src={aspireLogo} alt="ASPIRE" className="h-24 w-auto opacity-70" />

          {/* Red X icon */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              This invitation link is invalid or has expired. Please contact your administrator
              for a new invitation.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Valid token — registration card
  // -------------------------------------------------------------------------

  // Resolve the error banner content
  let errorBanner = null;
  if (errorCode) {
    if (errorCode === 'ALREADY_REGISTERED') {
      errorBanner = (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex flex-col gap-1">
          <span>An instructor account with this email already exists.</span>
          <Link to="/" className="text-[#cc0000] hover:text-red-400 underline underline-offset-2 transition-colors w-fit">
            Log in instead →
          </Link>
        </div>
      );
    } else {
      const msg = ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.';
      errorBanner = (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {msg}
        </div>
      );
    }
  }

  return (
    <>
      {/* Inline spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="min-h-screen bg-[#0a0101] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm px-8 py-10 flex flex-col items-center gap-6 shadow-2xl shadow-black/40">

            {/* Logo */}
            <img src={aspireLogo} alt="ASPIRE" className="h-20 w-auto" />

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white leading-snug">
                Complete your instructor registration
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                You were invited to join ASPIRE as an instructor
              </p>
            </div>

            {/* Assigned email badge */}
            {assignedEmail && (
              <div className="w-full flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-base leading-none">📧</span>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                    Registering as
                  </p>
                  <p className="text-sm text-gray-200 font-mono break-all">{assignedEmail}</p>
                </div>
              </div>
            )}

            {/* Error banner (shown when returning from Google with ?error=) */}
            {errorBanner}

            {/* Google button */}
            <button
              id="instructor-google-signin-btn"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white text-gray-800 font-medium text-sm py-3 px-4 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
            >
              {/* Google logo SVG */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Domain reminder */}
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              Make sure to sign in with your{' '}
              <span className="text-gray-400 font-mono">@g.batstate-u.edu.ph</span>{' '}
              Google account
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
