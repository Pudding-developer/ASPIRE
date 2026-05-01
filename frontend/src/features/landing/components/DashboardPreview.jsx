import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import instructorDashboard from '../../../assets/instructor-dashboard.png';
import studentDashboard from '../../../assets/student-dashboard.png';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPreview() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // We create a timeline that fires precisely ONCE the user enters the zone.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 60%", // Triggers exactly when top crosses 60% viewport
        toggleActions: "play none none none" // Plays once, ensures it never gets stuck
      }
    });

    // 0. Setup Initial State (Instructor on top, Student stacked behind)
    gsap.set('.dashboard-instructor', { 
        zIndex: 20, 
        scale: 1.05, 
        filter: 'brightness(1.1)', 
        boxShadow: '30px 30px 80px rgba(0,0,0,0.9)'
    });
    gsap.set('.dashboard-student', { 
        zIndex: 10, 
        scale: 0.9, 
        filter: 'brightness(0.5)', 
        boxShadow: '0px 0px 10px rgba(0,0,0,0.5)' 
    });

    // 1. Initial fade in (They come up together seamlessly)
    tl.fromTo(['.dashboard-instructor', '.dashboard-student'], 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );

    // 2. SHUFFLE OUT (Slide apart quickly horizontally)
    tl.to('.dashboard-instructor', { xPercent: -12, yPercent: 4, rotation: -4, duration: 0.4, ease: 'power1.inOut' }, "shuffleOut")
      .to('.dashboard-student', { xPercent: 12, yPercent: -4, rotation: 4, duration: 0.4, ease: 'power1.inOut' }, "shuffleOut");

    // 3. SWAP DEPTH (Instant zIndex and stylistic lighting swap exactly at separation apex)
    tl.to('.dashboard-instructor', { zIndex: 10, scale: 0.9, filter: 'brightness(0.5)', boxShadow: '0px 0px 10px rgba(0,0,0,0.5)', duration: 0 }, "swap")
      .to('.dashboard-student', { zIndex: 20, scale: 1.05, filter: 'brightness(1.1)', boxShadow: '-30px 40px 80px rgba(0,0,0,0.9)', duration: 0 }, "swap");

    // 4. SHUFFLE IN (Slide completely back together to overlap with student dominant)
    tl.to('.dashboard-instructor', { xPercent: 0, yPercent: 0, rotation: 0, duration: 0.5, ease: 'power2.out' }, "shuffleIn")
      .to('.dashboard-student', { xPercent: 0, yPercent: 0, rotation: 0, duration: 0.5, ease: 'power2.out' }, "shuffleIn");

    // Floating stats pop-in
    gsap.fromTo('.stat-card',
      { opacity: 0, y: 30, scale: 0.8 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        stagger: 0.2, 
        duration: 0.6, 
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 50%",
        }
      }
    );

    // Continuous floating animations (yoyo)
    const floatElements = gsap.utils.toArray('.stat-card');
    floatElements.forEach((el, i) => {
      gsap.to(el, {
        y: (i % 2 === 0) ? -10 : -15,
        duration: 3 + (i * 0.5),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

  }, { scope: containerRef });

  // Hover Interactions for dashboards
  const handleMouseEnter = (isInstructor) => {
    const target = isInstructor ? '.dashboard-instructor' : '.dashboard-student';
    gsap.to(target, {
      zIndex: 50,
      filter: 'brightness(1.15)',
      scale: 1.08,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const handleMouseLeave = (isInstructor) => {
    const target = isInstructor ? '.dashboard-instructor' : '.dashboard-student';
    // Revert to original post-shuffle states
    gsap.to(target, {
      zIndex: isInstructor ? 10 : 20,
      filter: isInstructor ? 'brightness(0.5)' : 'brightness(1.1)',
      scale: isInstructor ? 0.9 : 1.05,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  return (
    <section id="dashboard-preview" ref={containerRef} className="py-12 px-6 overflow-hidden [perspective:1000px]">
      <div className="relative h-125 md:h-225 mt-8 w-full [transform-style:preserve-3d]"> 
        
        {/* Instructor Dashboard (Back Left) */}
        <div 
          className="dashboard-instructor absolute left-0 top-0 w-[70%] md:w-[60%] rounded-2xl overflow-hidden border border-[#430202] backdrop-blur-md opacity-0 cursor-pointer"
          onMouseEnter={() => handleMouseEnter(true)}
          onMouseLeave={() => handleMouseLeave(true)}
        >
          <img 
            src={instructorDashboard} 
            alt="Instructor's Dashboard" 
            className="w-full h-auto rounded-2xl"
          />
        </div>

        {/* Student Dashboard (Front Right, overlapping) */}
        <div 
          className="dashboard-student absolute right-0 top-32 md:top-48 w-[70%] md:w-[58%] rounded-2xl overflow-hidden border border-[#430202] backdrop-blur-md opacity-0 cursor-pointer"
          onMouseEnter={() => handleMouseEnter(false)}
          onMouseLeave={() => handleMouseLeave(false)}
        >
          <img 
            src={studentDashboard} 
            alt="Student Dashboard" 
            className="w-full h-auto rounded-2xl"
          />
        </div>

        {/* Floating Stat: Beltran, Don Maxwell F. 92% */}
        <div className="stat-card opacity-0 absolute -top-2 md:top-0 right-4 md:right-16 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 shadow-2xl z-50 flex items-center gap-4 pointer-events-none">
          <div className="text-white text-sm font-semibold">Beltran, Don Maxwell F.</div>
          <div className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-lg shadow-inner">92%</div>
        </div>

        {/* Floating Stat: 680+ Students Tracked */}
        <div className="stat-card opacity-0 absolute top-1/3 left-4 md:left-10 backdrop-blur-md bg-[#70170f] border border-[#ff3333]/30 text-white px-5 py-4 rounded-xl shadow-[0_10px_30px_rgba(188,19,19,0.4)] z-50 pointer-events-none">
          <div className="text-2xl md:text-3xl font-bold mb-1">680+</div>
          <div className="text-xs opacity-90">Students Tracked</div>
        </div>

        {/* Floating Stat: 95% Accuracy Rate */}
        <div className="stat-card opacity-0 absolute bottom-24 md:bottom-32 left-[15%] backdrop-blur-md bg-linear-to-br from-[#4a0e09] to-[#70170f] border border-white/10 text-white px-5 py-4 rounded-xl shadow-[0_10px_30px_rgba(188,19,19,0.3)] z-50 text-center pointer-events-none">
          <div className="text-2xl md:text-3xl font-bold mb-1">95%</div>
          <div className="text-xs opacity-90">Accuracy Rate</div>
        </div>

        {/* Floating Stat: 64 Active Courses */}
        <div className="stat-card opacity-0 absolute bottom-8 md:bottom-16 right-10 md:right-24 backdrop-blur-md bg-[#430202] border border-[#70170f]/30 rounded-xl px-5 py-4 shadow-2xl text-center z-50 pointer-events-none">
          <div className="text-white text-2xl md:text-3xl font-bold mb-1">64</div>
          <div className="text-gray-300 text-xs">Active Courses</div>
        </div>

      </div>
    </section>
  );
}
