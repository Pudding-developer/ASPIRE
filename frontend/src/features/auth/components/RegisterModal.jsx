import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router';
import aspireLogo from '../../../assets/aspire-logo.png';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
            className="relative w-full max-w-[500px] bg-[#0a0101] border border-[#FFFFFF66] shadow-[0_0_30px_#FFFFFF80] rounded-2xl p-8 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <img src={aspireLogo} alt="ASPIRE" className="h-[145px] w-auto -mt-6 -mb-3" />
              <h2 className="text-xl font-medium text-white">Create your account</h2>
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-200">First Name</label>
                  <input
                    type="text"
                    placeholder="Juan"
                    className="bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] text-white focus:outline-none focus:border-[#bc1313] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-200">Last Name</label>
                  <input
                    type="text"
                    placeholder="Dela Cruz"
                    className="bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] text-white focus:outline-none focus:border-[#bc1313] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-200">Email</label>
                <input
                  type="email"
                  placeholder="22-12345@g.batstate-u.edu.ph"
                  className="bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] text-white focus:outline-none focus:border-[#bc1313] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-200">SR Code</label>
                  <span className="text-[10px] border border-white/20 px-1.5 py-0.5 rounded text-gray-400 tracking-wider">STUDENT RECORD</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="E.g. 22-12345"
                    className="w-full bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] pr-10 text-white focus:outline-none focus:border-[#bc1313] transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <CreditCard size={18} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Enter the SR code provided by your institution.</p>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-sm text-gray-200">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] text-white tracking-widest focus:outline-none focus:border-[#bc1313] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-200">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#050000] border border-white/10 rounded-md px-3 py-[10.5px] text-white tracking-widest focus:outline-none focus:border-[#bc1313] transition-colors"
                />
              </div>

              <Button className="w-full bg-[#bc1313] hover:bg-[#890E0E] text-white py-6 text-base mt-2 rounded-md">
                Sign up
              </Button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-gray-500 tracking-wider uppercase">Or continue with</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <Button className="w-full bg-[#050000] hover:bg-[#110202] border border-white/10 text-gray-200 py-6 text-base rounded-md flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center mt-8 text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-white hover:text-[#bc1313] transition-colors font-medium"
              >
                Log in
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
