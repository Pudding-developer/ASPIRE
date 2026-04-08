import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const stepsData = [
  {
    id: 1,
    emoji: '📚',
    title: 'Class Setup',
    desc: 'Quickly create and organize your classes with automated class code generation for easy student enrollment.',
    btnTitle: 'Create Your Classes',
    btnDesc: 'Set up your courses with subject names, course codes, and sections. Invite students using class codes.'
  },
  {
    id: 2,
    emoji: '📝',
    title: 'Input Scores',
    desc: 'Map scores directly to Intended Learning Outcomes and generate comprehensive proficiency metrics instantly.',
    btnTitle: 'Input Assessment Scores',
    btnDesc: 'Map assessments to ILOs and input scores. The system automatically calculates proficiency scores for you.'
  },
  {
    id: 3,
    emoji: '📊',
    title: 'Analyze Intelligence',
    desc: 'Utilize advanced ML to forecast student achievement trajectories and apply data-driven academic interventions.',
    btnTitle: 'Analyze & Predict',
    btnDesc: 'View analytics, identify at-risk students, and get enrollment predictions based on student performance data.'
  }
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);
  const containerRef = useRef(null);
  const panelsRef = useRef([]);

  useGSAP(() => {
    // Reveal animation on scroll
    gsap.fromTo('.hiw-element',
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6, 
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true
        }
      }
    );
  }, { scope: containerRef });

  useEffect(() => {
    // Crossfade mechanism
    panelsRef.current.forEach((panel, i) => {
      if (panel) {
        if (i + 1 === activeStep) {
          gsap.fromTo(panel, 
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.3, pointerEvents: 'auto' }
          );
        } else {
          gsap.to(panel, { opacity: 0, duration: 0.3, pointerEvents: 'none' });
        }
      }
    });
  }, [activeStep]);

  return (
    <section id="how-it-works" ref={containerRef} className="py-24 px-6 bg-[#0a0101]">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 hiw-element opacity-0">
          <p className="text-[#bc1313] mb-2 font-bold tracking-widest text-xs uppercase">• HOW IT WORKS</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Up and running in <span className="text-[#bc1313] italic">3 simple steps</span>
          </h2>
        </div>

        <div className="hiw-element opacity-0 grid md:grid-cols-2 gap-12 items-center w-full max-w-5xl">
          <div className="space-y-4">
            {stepsData.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                onMouseEnter={() => setActiveStep(step.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                  activeStep === step.id ? 'border-[#bc1313] bg-gradient-to-r from-[#bc1313]/10 to-transparent shadow-[0_0_30px_rgba(188,19,19,0.15)]' : 'border-white/5 hover:border-white/10 bg-[#0a0101]'
                }`}
              >
                <div className="flex items-center gap-6 mb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg ${
                      activeStep === step.id ? 'bg-[#bc1313] text-white shadow-[#bc1313]/50' : 'bg-white/5 text-gray-500 shadow-transparent'
                    }`}
                  >
                    0{step.id}
                  </div>
                  <h3 className={`text-xl font-bold ${activeStep === step.id ? 'text-white' : 'text-gray-400'}`}>
                    {step.btnTitle}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed ml-[72px] ${activeStep === step.id ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.btnDesc}
                </p>
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center min-h-[400px]">
            {stepsData.map((step, i) => (
              <div
                key={step.id}
                ref={el => panelsRef.current[i] = el}
                className="absolute w-full opacity-0 pointer-events-none"
              >
                <div className="bg-[#0f0202] rounded-2xl p-10 shadow-2xl relative overflow-hidden h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-black to-transparent opacity-80"></div>
                  <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#bc1313] to-[#890E0E] rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-xl shadow-[#bc1313]/30">
                      {step.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
