/**
 * AuthCallbackPage — The frontend route that Google redirects to after OAuth.
 * 
 * URL will be: /auth/callback?token=eyJ... or /auth/callback?error=...
 * 
 * This page:
 * 1. Reads the token from the URL
 * 2. Stores it via useAuth
 * 3. Redirects to the appropriate dashboard based on user role
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import aspireLogo from '../../assets/aspire-logo.png';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/'), 4000);
      return;
    }

    if (token) {
      login(token);

      // Decode role to redirect to the right dashboard
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));

        const redirectTo = payload.role === 'instructor' ? '/instructor' : '/student';
        setTimeout(() => navigate(redirectTo, { replace: true }), 500);
      } catch {
        navigate('/instructor', { replace: true });
      }
    } else {
      setError('No token received.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0101] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center">
        <img src={aspireLogo} alt="ASPIRE" className="h-[200px] w-auto mb-6" />

        {error ? (
          <div className="text-center">
            <div className="text-red-400 text-lg font-medium mb-2">Authentication Failed</div>
            <p className="text-gray-500 text-sm max-w-md">{error}</p>
            <p className="text-gray-600 text-xs mt-4">Redirecting to home...</p>
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
