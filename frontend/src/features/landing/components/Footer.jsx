import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router';
import aspireLogo from '../../../assets/aspire-logo.png';

export default function Footer({ onGetStarted }) {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#0a0101] pt-24">
      {/* Big CTA Section with entrance animation */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-32">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          Ready to <span className="text-[#bc1313] italic">transform</span><br />
          the way you use analytics?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-gray-400 mb-8 text-lg"
        >
          Join ASPIRE today
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Button onClick={onGetStarted} className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-10 py-6 text-lg rounded-md">
            Get Started
          </Button>
        </motion.div>
      </div>

      {/* Slim Footer */}
      <div className="border-t border-white/5 pt-8 pb-10 px-6 md:px-10">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src={aspireLogo} alt="ASPIRE" className="h-[80px] w-auto" />
          </div>

          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Blog</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>

          <div className="flex-shrink-0">
            © 2026 ASPIRE. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
