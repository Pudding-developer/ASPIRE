import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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

          {/* Video Container */}
          <div className="w-full h-full pt-10 relative flex items-center justify-center overflow-hidden bg-black/40 group/video">
             <video
               ref={videoRef}
               className="w-full h-full object-cover"
               autoPlay
               loop
               muted={isMuted}
               playsInline
               preload="auto"
             >
               <source src="/ASPIRE_WT.mp4" type="video/mp4" />
               Your browser does not support the video tag.
             </video>

             {/* Subtle gradient overlay to blend with the dark/glassmorphic aesthetic */}
             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10"></div>

             {/* Premium Floating Video Controls */}
             <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
               <button
                 onClick={togglePlay}
                 className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                 title={isPlaying ? "Pause" : "Play"}
               >
                 {isPlaying ? <Pause size={18} /> : <Play size={18} />}
               </button>
               <button
                 onClick={toggleMute}
                 className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                 title={isMuted ? "Unmute" : "Mute"}
               >
                 {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
               </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
