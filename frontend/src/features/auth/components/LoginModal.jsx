import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import useAuth from '../hooks/useAuth';
import aspireLogo from '../../../assets/aspire-logo.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOOGLE_AUTH_URL = `${API_BASE}/auth/login/google?flow=login`;

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const { localLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const redirectPath = await localLogin(formData);
      onClose();
      navigate(redirectPath || '/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            onClick={onClose}
          ></motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_35%,rgba(10,1,1,0.72)_100%)] p-8 shadow-[0_0_42px_rgba(255,255,255,0.5),0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#70170f]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/8 blur-3xl" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/20 p-1 text-gray-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="relative mb-6 flex flex-col items-center">
              <img src={aspireLogo} alt="ASPIRE" className="h-28 w-auto -mt-4 -mb-2" />
              <h2 className="text-xl font-medium text-white">Welcome back!</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#70170f] focus:outline-none focus:ring-1 focus:ring-[#70170f] transition-colors"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-300">Password</label>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#70170f] focus:outline-none focus:ring-1 focus:ring-[#70170f] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 text-center bg-red-400/10 py-2 rounded border border-red-400/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#70170f] py-6 text-sm font-medium text-white transition-colors hover:bg-[#8a1c12] disabled:opacity-50 mt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Log In"}
              </Button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="mx-4 text-xs text-gray-400">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="relative w-full rounded-lg border border-white/15 bg-black/25 py-6 text-sm text-gray-200 backdrop-blur-md transition-all hover:border-white/25 hover:bg-black/35 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-8 text-center text-sm text-gray-300 relative z-20">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-white transition-colors hover:text-[#f06a6a]"
              >
                Sign up
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
