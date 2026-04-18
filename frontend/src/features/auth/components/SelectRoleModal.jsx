import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, BookOpen, GraduationCap, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import aspireLogo from '../../../assets/aspire-logo.png';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    bgColor: 'bg-[#bc1313]',
    hoverColor: 'hover:bg-[#890E0E]',
  },
  instructor: {
    label: 'Instructor',
    icon: BookOpen,
    bgColor: 'bg-amber-600',
    hoverColor: 'hover:bg-amber-700',
  },
  student: {
    label: 'Student',
    icon: GraduationCap,
    bgColor: 'bg-[#1a1a1a]',
    hoverColor: 'hover:bg-[#2a2a2a]',
  },
};

export default function SelectRoleModal({ isOpen, onClose, token }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState(null);
  
  // Parse payload from token safely
  const payload = (() => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoadingRole(null);
      return;
    }
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !payload || payload.type !== 'role_selection') return null;

  const roles = payload.roles || [];
  const fullName = payload.full_name || 'there';

  const handleRoleSelect = async (roleObj) => {
    setLoadingRole(roleObj.role);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/auth/login/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: roleObj.role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to select role');
      }
      
      login(data.access_token);
      onClose(); // close the modal
      navigate(data.redirect || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoadingRole(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          ></motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 flex w-full max-w-115 flex-col items-center overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_35%,rgba(10,1,1,0.72)_100%)] p-8 shadow-[0_0_42px_rgba(255,255,255,0.5),0_20px_60px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#bc1313]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/8 blur-3xl" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/20 p-1 text-gray-400 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>

            <img src={aspireLogo} alt="ASPIRE" className="relative h-36.25 w-auto -mt-6 -mb-3" />
            
            <div className="relative mb-6 text-center">
              <h2 className="text-xl font-medium text-white mb-2">Welcome back, {fullName}!</h2>
              <p className="text-gray-300 text-sm">How would you like to log in today?</p>
            </div>

            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}

            <div className="w-full flex flex-col gap-4">
              {roles.map((roleObj) => {
                const config = ROLE_CONFIG[roleObj.role];
                if (!config) return null;
                
                const Icon = config.icon;
                const isLoading = loadingRole === roleObj.role;

                return (
                  <button
                    key={roleObj.role}
                    onClick={() => handleRoleSelect(roleObj)}
                    disabled={!!loadingRole}
                    className={`relative w-full ${config.bgColor} ${config.hoverColor} flex items-center p-4 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-white/10`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                        <Icon size={24} className={isLoading ? 'opacity-0' : 'opacity-100'} />
                      </div>
                      <span className="font-medium text-lg text-left">Log in as {config.label}</span>
                    </div>
                    {isLoading && (
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-transparent p-2">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
