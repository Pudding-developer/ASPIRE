import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars
import { useNavigate } from 'react-router';
import { Button } from '../../../components/ui/button';

export default function HeroSection({ scrollToSection, onGetStarted }) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated drifting grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(188, 19, 19, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 19, 19, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-drift 20s linear infinite'
        }}></div>
      </div>

      {/* Pulsing red glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#bc1313] blur-[150px] rounded-full"
      ></motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4">
            <p className="text-white text-sm">
              Introducing ASPIRE v1.0 — ML-Powered Academic Forecasting
            </p>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="block text-6xl md:text-8xl leading-tight font-bold">
            <span className="text-white">Analyze. </span>
            <span className="text-shimmer italic">Predict.</span><br/>
            <span className="text-white mt-1 block">Achieve.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-gray-400 text-lg md:text-xl mb-12 max-w-3xl mx-auto"
        >
          ASPIRE provides advanced enrollment prediction tools that analyze student data, generate insights, and help you engage better — built for institutions of all sizes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex justify-center"
        >
          <Button
            onClick={onGetStarted}
            className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-10 py-6 text-lg rounded-md"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
