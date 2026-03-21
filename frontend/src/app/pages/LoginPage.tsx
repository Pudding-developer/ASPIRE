import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import aspireLogo from 'figma:asset/5227b8b61c5f740be219c4cb41f95e2c30adf0d7.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - redirect to instructor dashboard
    navigate('/instructor');
  };

  return (
    <div className="min-h-screen bg-[#0a0101] text-white flex items-center justify-center px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(188, 19, 19, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 19, 19, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#bc1313] opacity-20 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={aspireLogo} alt="ASPIRE" className="h-12" />
            </div>
            <p className="text-gray-400">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>

          <div className="bg-gradient-to-b from-[#1a0505] to-[#0a0101] border border-[#bc1313]/20 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0a0101] border-white/10 focus:border-[#bc1313] text-white mt-2"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0a0101] border-white/10 focus:border-[#bc1313] text-white mt-2"
                  placeholder="••••••••"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="bg-[#0a0101] border-white/10 focus:border-[#bc1313] text-white mt-2"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#bc1313] hover:bg-[#890E0E] text-white"
              >
                {isLogin ? 'Log in' : 'Sign up'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-400 hover:text-[#bc1313] text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-[#bc1313] text-sm"
            >
              ← Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}