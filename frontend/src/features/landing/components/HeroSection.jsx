import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export default function HeroSection({ scrollToSection, onGetStarted }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useGSAP(() => {
    // Subtle red glow continuous animation
    gsap.to('.hero-glow', {
      scale: 1.4,
      opacity: 0.1,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Make glow follow cursor
    gsap.set('.hero-glow', { xPercent: -50, yPercent: -50, left: 0, top: 0 });
    
    const xTo = gsap.quickTo('.hero-glow', "x", { duration: 1.5, ease: "power3.out" });
    const yTo = gsap.quickTo('.hero-glow', "y", { duration: 1.5, ease: "power3.out" });

    if (containerRef.current) {
      xTo(containerRef.current.offsetWidth / 2);
      yTo(containerRef.current.offsetHeight / 2);
    }

    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      xTo(e.clientX - rect.left);
      yTo(e.clientY - rect.top);
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo('.hero-badge', 
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 1 }
    )
    .fromTo('.hero-brand-label',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.6"
    )
    .fromTo('.hero-title-word', 
      { opacity: 0, y: 80, skewY: 7 },
      { opacity: 1, y: 0, skewY: 0, duration: 1, stagger: 0.1 },
      "-=0.6"
    )
    .fromTo('.hero-description',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1 },
      "-=0.7"
    )
    .fromTo('.hero-cta',
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 1 },
      "-=0.8"
    );

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen flex flex-col items-center justify-center pt-48 pb-48 overflow-hidden bg-white"
    >
      {/* Seamless aligned grid overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#9f0707 1px, transparent 1px), linear-gradient(90deg, #9f0707 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          animation: 'grid-drift 60s linear infinite'
        }}></div>
      </div>

      {/* Subtle interactive red atmospheric glow */}
      <div className="hero-glow absolute w-[1000px] h-[1000px] bg-gradient-to-r from-[#9f0707] to-transparent blur-[180px] rounded-full opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pointer-events-none">
        {/* Red Glassmorphism Badge */}
        <div className="hero-badge inline-block px-6 py-3 rounded-full bg-[#9f0707]/10 backdrop-blur-xl border border-[#9f0707]/20 mb-12 opacity-0 text-[#430202] font-bold text-sm shadow-[0_8px_32px_0_rgba(159,7,7,0.1)]">
          <span className="text-[#9f0707] mr-2">●</span> Introducing ASPIRE v1.0 — ML-Powered Academic Forecasting
        </div>

        <div className="hero-brand-label text-[#9f0707] font-black text-xs tracking-[0.4em] uppercase mb-6 opacity-0">
          ASPIRE System
        </div>

        <h1 className="mb-10">
          <div className="text-6xl md:text-8xl leading-[1.05] font-black tracking-tighter text-[#430202]">
            <span className="hero-title-word inline-block opacity-0">Analyze.&nbsp;</span>
            <span className="hero-title-word inline-block text-[#9f0707] italic opacity-0 transform-gpu translate-x-1">Predict.</span><br/>
            <span className="hero-title-word inline-block opacity-0">Achieve.</span>
          </div>
        </h1>

        <p className="hero-description text-[#430202]/60 text-lg md:text-xl mb-12 max-w-3xl mx-auto opacity-0 font-bold leading-relaxed">
          ASPIRE provides advanced enrollment prediction tools that analyze student data, generate insights, and help you engage better — built for institutions of all sizes.
        </p>

        <div className="hero-cta flex justify-center opacity-0 pointer-events-auto">
          <Button
            onClick={onGetStarted}
            className="bg-[#9f0707] hover:bg-[#430202] text-white px-12 py-8 text-xl rounded-2xl shadow-[0_20px_50px_rgba(159,7,7,0.2)] transition-all hover:scale-105 active:scale-95 font-bold uppercase tracking-wider"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
}
