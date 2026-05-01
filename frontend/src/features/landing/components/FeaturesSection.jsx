import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Brain, Map, Code, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Header reveal
    gsap.fromTo('.feature-header',
      { opacity: 0, y: 50 },
      { 
        opacity: 1, y: 0, duration: 0.8,
        scrollTrigger: { trigger: containerRef.current, start: "top 80%" }
      }
    );

    // Sequential Feature Reveal
    const cards = gsap.utils.toArray('.feature-card');
    
    cards.forEach((card, i) => {
      let fromVars = { opacity: 0, y: 100 };
      
      if (i % 2 === 0) {
        fromVars = { opacity: 0, x: -50, y: 50 };
      } else {
        fromVars = { opacity: 0, x: 50, y: 50 };
      }

      gsap.fromTo(card,
        fromVars,
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );

      // Add "How It Works" style Pop-up Hover Effect using GSAP
      // This ensures it overrides the entrance styles
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -15,
          scale: 1.05,
          boxShadow: "0 30px 60px -15px rgba(159,7,7,0.2)",
          borderColor: "rgba(159,7,7,0.3)",
          duration: 0.4,
          ease: "back.out(1.7)", // Same pop-up ease as How It Works
          zIndex: 10
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          borderColor: "rgba(159,7,7,0.1)",
          duration: 0.4,
          ease: "power2.out",
          zIndex: 0
        });
      });
    });
  }, { scope: containerRef });

  const features = [
    {
      icon: <Brain className="w-5 h-5 text-[#9f0707]" />,
      title: "Skill Profiling",
      description: "Map your progress against Integrated Learning Outcomes (ILO) to detect technical strengths and identify growth areas with real-time competency tracking."
    },
    {
      icon: <Map className="w-5 h-5 text-[#9f0707]" />,
      title: "AI Career Roadmaps",
      description: "Transform your academic achievements into personalized career paths with detailed, AI-generated step-by-step guidance."
    },
    {
      icon: <Code className="w-5 h-5 text-[#9f0707]" />,
      title: "Academic Portfolio",
      description: "Seamlessly integrate your GitHub repositories to showcase your top projects in an industry-ready professional portfolio."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#9f0707]" />,
      title: "Predictive Analytics",
      description: "Stay ahead of your academic goals with ML-driven performance predictions based on your historical and current data."
    }
  ];

  return (
    <section id="features" ref={containerRef} className="py-24 px-6 bg-[#FFFFFF] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="feature-header text-center mb-16 opacity-0">
          <p className="text-[#9f0707] mb-3 font-bold tracking-widest text-base uppercase">• FEATURES</p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#430202] mb-4">
            Powerful tools to <span className="text-[#9f0707] italic">accelerate your future</span>
          </h2>
          <p className="text-[#430202]/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            ASPIRE combines machine learning with your academic journey to provide real-time insights and professional career guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card opacity-0 bg-white border border-[#9f0707]/10 rounded-2xl p-8 flex flex-col group relative cursor-pointer"
            >
              <div className="bg-[#9f0707]/5 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-[#430202] mb-4">{feature.title}</h3>
              <p className="text-sm text-[#430202]/70 leading-relaxed flex-1 font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
