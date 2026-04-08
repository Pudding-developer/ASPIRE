import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export default function HeroSection({ scrollToSection, onGetStarted }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useGSAP(() => {
    // Pulsing red glow continuous animation
    gsap.to('.hero-glow', {
      scale: 1.2,
      opacity: 0.25,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Make glow follow cursor
    gsap.set('.hero-glow', { xPercent: -50, yPercent: -50, left: 0, top: 0 });
    
    const xTo = gsap.quickTo('.hero-glow', "x", { duration: 1, ease: "power3.out" });
    const yTo = gsap.quickTo('.hero-glow', "y", { duration: 1, ease: "power3.out" });

    if (containerRef.current) {
      // Set to center initially
      xTo(containerRef.current.offsetWidth / 2);
      yTo(containerRef.current.offsetHeight / 2);
    }

    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      xTo(e.clientX - rect.left);
      yTo(e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
      // Returns to center when mouse leaves
      if (containerRef.current) {
        xTo(containerRef.current.offsetWidth / 2);
        yTo(containerRef.current.offsetHeight / 2);
      }
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseleave', handleMouseLeave);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Staggered blooming entrance
    tl.fromTo('.hero-badge', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 }
    )
    .fromTo('.hero-title-word', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 },
      "-=0.4"
    )
    .fromTo('.hero-description',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.4"
    )
    .fromTo('.hero-cta',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.6"
    );

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated drifting grid background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(188, 19, 19, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 19, 19, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-drift 20s linear infinite'
        }}></div>
      </div>

      {/* Pulsing red glow */}
      <div className="hero-glow absolute w-[800px] h-[800px] bg-[#bc1313] blur-[150px] rounded-full opacity-15 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center pointer-events-none">
        <div className="hero-badge inline-block px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4 opacity-0 text-white text-sm">
          Introducing ASPIRE v1.0 — ML-Powered Academic Forecasting
        </div>

        <h1 className="mb-8 overflow-hidden">
          <span className="block text-6xl md:text-8xl leading-tight font-bold">
            <span className="hero-title-word inline-block text-white opacity-0">Analyze.&nbsp;</span>
            <span className="hero-title-word inline-block text-shimmer italic opacity-0">Predict.</span><br/>
            <span className="hero-title-word inline-block text-white mt-1 opacity-0">Achieve.</span>
          </span>
        </h1>

        <p className="hero-description text-gray-400 text-lg md:text-xl mb-12 max-w-3xl mx-auto opacity-0">
          ASPIRE provides advanced enrollment prediction tools that analyze student data, generate insights, and help you engage better — built for institutions of all sizes.
        </p>

        <div className="hero-cta flex justify-center opacity-0 pointer-events-auto">
          <Button
            onClick={onGetStarted}
            className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-10 py-6 text-lg rounded-md"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}
