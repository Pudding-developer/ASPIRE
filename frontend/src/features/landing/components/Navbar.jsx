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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-[#bc1313]/10 shadow-sm' : 'bg-white/30 backdrop-blur-md border-b border-transparent'}`}>
        <div className="w-full px-6 md:px-10 py-3 flex items-center justify-between pointer-events-auto">
          <div className="cursor-pointer flex-shrink-0 -ml-6" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={aspireLogo} alt="ASPIRE" className="h-[60px] md:h-[80px] w-auto scale-[2] origin-left" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#dashboard-preview" onClick={(e) => { e.preventDefault(); scrollToSection('dashboard-preview'); }} className="text-sm font-medium text-[#430202]/80 hover:text-[#bc1313] transition-colors">Preview</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="text-sm font-medium text-[#430202]/80 hover:text-[#bc1313] transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="text-sm font-medium text-[#430202]/80 hover:text-[#bc1313] transition-colors">How it works</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="text-sm font-medium text-[#430202]/80 hover:text-[#bc1313] transition-colors">FAQs</a>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <Button onClick={onLogin} className="bg-[#bc1313] hover:bg-[#430202] text-white px-6 rounded-md">Log in</Button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#FFFFFF] z-40 flex flex-col items-center justify-center gap-8 md:hidden"
        >
          <button onClick={() => { setMenuOpen(false); scrollToSection('features'); }} className="text-2xl text-[#430202] hover:text-[#bc1313] transition-colors">
            Features
          </button>
          <button onClick={() => { setMenuOpen(false); scrollToSection('how-it-works'); }} className="text-2xl text-[#430202] hover:text-[#bc1313] transition-colors">
            How it works
          </button>
          <button onClick={() => { setMenuOpen(false); scrollToSection('faq'); }} className="text-2xl text-[#430202] hover:text-[#bc1313] transition-colors">
            FAQs
          </button>
          <Button
            onClick={() => { setMenuOpen(false); onLogin(); }}
            className="w-full bg-[#bc1313] hover:bg-[#430202] text-white py-6 rounded-md text-lg"
          >
            Log in
          </Button>
        </motion.div>
      )}
    </>
  );
}
