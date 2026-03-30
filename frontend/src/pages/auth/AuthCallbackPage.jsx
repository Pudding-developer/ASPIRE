/**
 * AuthCallbackPage — Handles Google OAuth redirect.
 *
 * Success: reads role from JWT → routes to /admin/dashboard, /instructor/dashboard, or /student/dashboard
 * Error codes:
 *   INSTRUCTOR_DEACTIVATED   → 403 message
 *   ACCOUNT_NOT_FOUND        → 404 message
 *   ACCOUNT_ALREADY_EXISTS   → 409 message
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import aspireLogo from '../../assets/aspire-logo.png';

const ERROR_MESSAGES = {
  INSTRUCTOR_DEACTIVATED:
    'Your instructor account has been deactivated. Contact your administrator.',
  ACCOUNT_NOT_FOUND:
    'No account found. Please use Get Started to register.',
  ACCOUNT_ALREADY_EXISTS:
    'Account already registered. Please use Log In instead.',
};

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  instructor: '/instructor/dashboard',
  student: '/student/dashboard',
};

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const redirectParam = searchParams.get('redirect');

    if (errorParam) {
      const message =
        ERROR_MESSAGES[errorParam] ||
        decodeURIComponent(errorParam).replace(/_/g, ' ');
      setErrorMessage(message);

      let secs = 3;
      setCountdown(secs);
      const interval = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(interval);
          navigate('/');
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    if (token) {
      // Determine redirect from query param first, fallback to JWT role
      if (redirectParam === '/auth/select-role') {
        navigate('/', { state: { showRoleSelection: true, token }, replace: true });
        return;
      }

      login(token);

      if (redirectParam) {
        setTimeout(() => navigate(redirectParam, { replace: true }), 500);
        return;
      }

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        const payload = JSON.parse(jsonPayload);
        const dest = ROLE_REDIRECTS[payload.role] || '/student/dashboard';
        setTimeout(() => navigate(dest, { replace: true }), 500);
      } catch {
        navigate('/student/dashboard', { replace: true });
      }
    } else {
      setErrorMessage('No token received.');
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(interval); navigate('/'); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0101] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center">
        <img src={aspireLogo} alt="ASPIRE" className="h-[200px] w-auto mb-6" />
        {errorMessage ? (
          <div className="text-center">
            <div className="text-red-400 text-lg font-medium mb-2">{errorMessage}</div>
            <p className="text-gray-600 text-xs mt-4">Redirecting back in {countdown}s...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-pulse text-white text-lg font-medium mb-2">Signing you in...</div>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#bc1313] rounded-full animate-pulse w-2/3"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
