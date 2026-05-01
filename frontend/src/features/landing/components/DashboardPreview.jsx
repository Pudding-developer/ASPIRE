import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPreview() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Entrance animation for the video container
    gsap.from(".video-container", {
      y: 100,
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      }
    });
  }, { scope: containerRef });

  return (
    <section id="dashboard-preview" ref={containerRef} className="py-24 px-6 relative overflow-hidden">
      {/* Continuing aligned grid from HeroSection */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#9f0707 1px, transparent 1px), linear-gradient(90deg, #9f0707 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          animation: 'grid-drift 60s linear infinite'
        }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative group z-10">
        {/* Glow behind the video */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#9f0707] to-[#430202] rounded-[2rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
        
        {/* Browser Frame */}
        <div className="video-container relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-white/10 backdrop-blur-lg border-b border-white/10 flex items-center px-4 gap-2 z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9f0707]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500/30"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500/30"></div>
            <div className="mx-auto bg-white/5 rounded-md px-16 py-1 text-[10px] text-white/40 border border-white/5 font-mono">
              aspire-analytics.io/dashboard
            </div>
          </div>

          {/* Video Placeholder Container */}
          <div className="w-full h-full pt-10 relative flex items-center justify-center overflow-hidden bg-black/20">
             {/* This is where the video loop will go */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
             
             <div className="text-center z-10 p-8">
                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-2xl group-hover:scale-110 transition-transform duration-500">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1.5"></div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2 tracking-tight">Experience ASPIRE in Action</h3>
                <p className="text-white/60 font-medium tracking-wide text-sm max-w-md mx-auto">
                  Dashboard Loop Placeholder — Dynamic visual showcase of analytics and student tracking is coming soon.
                </p>
             </div>

             {/* Faint UI Mockup elements in the background to simulate a dashboard */}
             <div className="absolute top-16 left-8 w-64 h-6 rounded-lg bg-white/5 animate-pulse"></div>
             <div className="absolute top-28 left-8 w-40 h-4 rounded-lg bg-white/5"></div>
             <div className="absolute top-16 right-8 w-12 h-12 rounded-full bg-white/5"></div>
             
             <div className="absolute bottom-8 left-8 flex gap-4">
                <div className="w-32 h-24 rounded-xl bg-white/5 border border-white/5"></div>
                <div className="w-32 h-24 rounded-xl bg-white/5 border border-white/5"></div>
                <div className="w-32 h-24 rounded-xl bg-white/5 border border-white/5"></div>
             </div>
             
             <div className="absolute bottom-8 right-8 w-48 h-48 rounded-xl bg-white/5 border border-white/5 flex items-end p-4">
                <div className="w-full h-1/2 flex items-end gap-1">
                   <div className="w-full bg-white/10 h-1/2 rounded-t-sm"></div>
                   <div className="w-full bg-white/20 h-3/4 rounded-t-sm"></div>
                   <div className="w-full bg-[#9f0707]/40 h-full rounded-t-sm"></div>
                   <div className="w-full bg-white/10 h-2/3 rounded-t-sm"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
