import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars
import { Menu, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import aspireLogo from '../../../assets/aspire-logo.png';

export default function Navbar({ scrollToSection, onLogin }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pointer-events-none ${
        scrolled 
          ? 'bg-white border-b border-[#9f0707]/10 shadow-md' 
          : 'bg-transparent'
      }`}>
        <div className="w-full px-6 md:px-10 py-4 flex items-center justify-between pointer-events-auto relative z-10">
          <div className="cursor-pointer flex-shrink-0 -ml-6" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={aspireLogo} alt="ASPIRE" className="h-[60px] md:h-[80px] w-auto scale-[2] origin-left transition-all" />
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Preview', 'Features', 'How it works', 'FAQs'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  scrollToSection(item.toLowerCase().replace(/ /g, '-')); 
                }} 
                className="text-base font-bold text-[#430202] hover:text-[#9f0707] transition-all duration-300 tracking-tight"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Button 
              onClick={onLogin} 
              className="bg-[#9f0707] hover:bg-[#430202] text-white px-8 py-2.5 rounded-xl text-base font-bold transition-all duration-300 shadow-lg shadow-[#9f0707]/10"
            >
              Log in
            </Button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#430202]">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center gap-8 md:hidden"
        >
          {['Features', 'How it works', 'FAQs'].map((item) => (
            <button 
              key={item}
              onClick={() => { setMenuOpen(false); scrollToSection(item.toLowerCase().replace(/ /g, '-')); }} 
              className="text-2xl font-bold text-[#430202] hover:text-[#9f0707] transition-colors"
            >
              {item}
            </button>
          ))}
          <Button
            onClick={() => { setMenuOpen(false); onLogin(); }}
            className="w-48 bg-[#430202] hover:bg-[#9f0707] text-white py-6 rounded-xl text-lg font-bold"
          >
            Log in
          </Button>
        </motion.div>
      )}
    </>
  );
}
