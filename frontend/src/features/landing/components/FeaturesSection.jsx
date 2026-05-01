import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Activity, Users, Target, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.feature-card',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: "easeOut",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true
        }
      }
    );
  }, { scope: containerRef });

  const features = [
    {
      icon: <Activity className="w-5 h-5 text-[#70170f]" />,
      title: "Predictive Analytics",
      description: "Forecast enrollment trends with machine learning models that analyze historical data and student behavior patterns."
    },
    {
      icon: <Users className="w-5 h-5 text-[#70170f]" />,
      title: "Student Tracking",
      description: "Monitor student performance, identify at-risk learners, and track top performers in real-time dashboards."
    },
    {
      icon: <Target className="w-5 h-5 text-[#70170f]" />,
      title: "ILO Mapping",
      description: "Map assessments to Intended Learning Outcomes and automatically calculate proficiency scores for better insights."
    },
    {
      icon: <Zap className="w-5 h-5 text-[#70170f]" />,
      title: "Real-Time Insights",
      description: "Generate instant reports and visualizations that help instructors make data-driven decisions quickly."
    }
  ];

  return (
    <section id="features" ref={containerRef} className="py-24 px-6 bg-[#0a0101]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#70170f] mb-3 font-bold tracking-widest text-xs uppercase">• FEATURES</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to <span className="text-[#70170f] italic">predict smarter</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card opacity-0 bg-[#110202] border border-[#300505] rounded-2xl p-8 hover:border-[#70170f] transition-colors shadow-2xl"
            >
              <div className="bg-[#70170f]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-medium text-white mb-4">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
