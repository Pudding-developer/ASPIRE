import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function AnimatedCounter({ target, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  
  useGSAP(() => {
    const el = ref.current;
    const obj = { val: 0 };
    
    gsap.to(obj, {
      val: target,
      duration: duration,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        once: true
      },
      onUpdate: () => {
        if(el) {
          el.innerHTML = Math.floor(obj.val) + suffix;
        }
      }
    });
  }, { scope: ref });

  return <span ref={ref}>0{suffix}</span>;
}

export default function StatsStrip() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.stat-item', 
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6, 
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-20 border-y border-white/5 bg-[#0a0101]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
        <div className="stat-item opacity-0">
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={680} suffix="+" />
          </div>
          <div className="text-sm text-gray-400">Students</div>
        </div>
        <div className="stat-item opacity-0">
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={64} />
          </div>
          <div className="text-sm text-gray-400">Courses</div>
        </div>
        <div className="stat-item opacity-0">
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={12} />
          </div>
          <div className="text-sm text-gray-400">Student Outcomes</div>
        </div>
        <div className="stat-item opacity-0">
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={95} suffix="%" />
          </div>
          <div className="text-sm text-gray-400">Accuracy</div>
        </div>
      </div>
    </section>
  );
}
