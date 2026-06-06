import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Button } from '../../../components/ui/button';
import aspireLogo from '../../../assets/aspire-logo.png';

gsap.registerPlugin(ScrollTrigger);

export default function Footer({ onGetStarted }) {
  const footerRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(() => {
    // Parallax Reveal Animation
    gsap.fromTo(contentRef.current, 
      { 
        y: 100, 
        opacity: 0,
        scale: 0.95
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "footer",
          start: "top 95%",
          end: "bottom bottom",
          scrub: 1,
        }
      }
    );
  }, { scope: footerRef });

  return (
    <footer 
      ref={footerRef} 
      className="bg-gradient-to-br from-[#9f0707] to-[#430202] h-full w-full relative overflow-hidden flex flex-col justify-between"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white opacity-[0.03] blur-[120px] rounded-full -ml-80 -mt-80 pointer-events-none"></div>
      
      {/* Main Content Wrapper - Centered vertically */}
      <div ref={contentRef} className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          Ready to <span className="text-white/70 italic">accelerate</span> your success?
        </h2>
        
        <p className="text-white/70 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Join thousands of students and instructors using ASPIRE's predictive intelligence.
        </p>
        
        <Button 
          onClick={onGetStarted} 
          className="bg-[#9f0707] hover:bg-[#430202] text-white px-12 py-7 text-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all hover:scale-105 font-bold uppercase tracking-wider"
        >
          Get Started Now
        </Button>
      </div>

      {/* Slim 3-Column Footer Row */}
      <div className="border-t border-white/10 relative z-10 px-6 md:px-12 bg-black/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-24 flex flex-row justify-between items-center gap-4">
          {/* Left: Logo */}
          <div className="flex-1 flex justify-start -ml-6">
            <img src={aspireLogo} alt="ASPIRE" className="h-[60px] w-auto scale-[1.5] origin-left transition-all" />
          </div>

          {/* Center: Navigation */}
          <div className="flex-[2] flex justify-center gap-x-8 md:gap-x-12 text-sm font-bold text-white/50">
            <a href="#features" className="hover:text-white transition-colors tracking-tight">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors tracking-tight">How it works</a>
            <a href="#faq" className="hover:text-white transition-colors tracking-tight">FAQs</a>
          </div>

          {/* Right: Copyright */}
          <div className="flex-1 flex justify-end text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold text-right">
            © 2026 ASPIRE.
          </div>
        </div>
      </div>
    </footer>
  );
}
