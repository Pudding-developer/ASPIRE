import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { UserCircle, GraduationCap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const instructorSteps = [
  {
    id: 1,
    emoji: '🏫',
    title: 'Class Ecosystem',
    desc: 'Create subjects and sections in seconds. Generate unique class codes to instantly enroll your students.',
    btnTitle: 'Setup Classes',
    btnDesc: 'Organize your subjects and sections with automated code generation.'
  },
  {
    id: 2,
    emoji: '📊',
    title: 'Smart Grading',
    desc: 'Map your assessments directly to Integrated Learning Outcomes (ILO) for precise mastery tracking.',
    btnTitle: 'Map & Grade',
    btnDesc: 'Input scores linked to ILOs to generate deep performance metrics.'
  },
  {
    id: 3,
    emoji: '🔮',
    title: 'Predictive Insights',
    desc: 'Identify at-risk students early with ML models that forecast academic trajectories based on current data.',
    btnTitle: 'Analyze & Predict',
    btnDesc: 'Monitor real-time progress and intervene with data-driven insights.'
  }
];

const studentSteps = [
  {
    id: 1,
    emoji: '🔑',
    title: 'Instant Access',
    desc: 'Enter the class code provided by your instructor to instantly sync with your academic dashboard.',
    btnTitle: 'Join Classes',
    btnDesc: 'Enroll in your subjects with a single code and start tracking.'
  },
  {
    id: 2,
    emoji: '🎯',
    title: 'Mastery Tracker',
    desc: 'Monitor your progress across every learning outcome. See exactly where you excel and where to focus.',
    btnTitle: 'Track Mastery',
    btnDesc: 'View real-time proficiency scores for every skill and outcome.'
  },
  {
    id: 3,
    emoji: '🚀',
    title: 'Career Roadmaps',
    desc: 'Transform your grades and skills into personalized, AI-generated career paths and industry roadmaps.',
    btnTitle: 'Build Future',
    btnDesc: 'Generate step-by-step career journeys based on your mastery.'
  }
];

export default function HowItWorksSection() {
  const [userType, setUserType] = useState('instructor');
  const [activeStep, setActiveStep] = useState(1);
  const containerRef = useRef(null);
  const panelsRef = useRef([]);

  const currentSteps = userType === 'instructor' ? instructorSteps : studentSteps;

  useGSAP(() => {
    gsap.fromTo('.hiw-header',
      { opacity: 0, y: 30 },
      { 
        opacity: 1, y: 0, duration: 1,
        scrollTrigger: { trigger: containerRef.current, start: "top 75%" }
      }
    );
  }, { scope: containerRef });

  useEffect(() => {
    setActiveStep(1);
  }, [userType]);

  useEffect(() => {
    panelsRef.current.forEach((panel, i) => {
      if (panel) {
        if (i + 1 === activeStep) {
          gsap.fromTo(panel, 
            { opacity: 0, y: 80, scale: 0.9, rotateX: 20 },
            { 
              opacity: 1, y: 0, scale: 1, rotateX: 0,
              duration: 0.8, 
              ease: "back.out(1.4)", 
              pointerEvents: 'auto' 
            }
          );
        } else {
          gsap.to(panel, { 
            opacity: 0, y: -20, scale: 0.95, 
            duration: 0.4, 
            pointerEvents: 'none' 
          });
        }
      }
    });
  }, [activeStep, userType]);

  return (
    <section id="how-it-works" ref={containerRef} className="py-24 px-6 bg-gradient-to-br from-[#9f0707] to-[#430202] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-[0.03] blur-[120px] rounded-full -mr-80 -mt-80 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 hiw-header opacity-0">
          <p className="text-white/40 mb-3 font-bold tracking-widest text-base uppercase">• HOW IT WORKS</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            How it works for <span className="text-white/70 italic">{userType === 'instructor' ? 'Instructors' : 'Students'}</span>
          </h2>
          
          <div className="inline-flex p-1.5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setUserType('instructor')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold transition-all duration-500 ${
                userType === 'instructor' ? 'bg-white text-[#9f0707] shadow-xl scale-105' : 'text-white/40 hover:text-white'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              For Instructors
            </button>
            <button
              onClick={() => setUserType('student')}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold transition-all duration-500 ${
                userType === 'student' ? 'bg-white text-[#9f0707] shadow-xl scale-105' : 'text-white/40 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              For Students
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center w-full max-w-6xl mx-auto">
          {/* Step Selectors */}
          <div className="space-y-4">
            {currentSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                onMouseEnter={() => setActiveStep(step.id)}
                className={`w-full text-left p-8 rounded-3xl border transition-all duration-500 group relative overflow-hidden ${
                  activeStep === step.id 
                    ? 'border-white/20 bg-white/10 backdrop-blur-3xl shadow-2xl' 
                    : 'border-transparent bg-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-8">
                  {/* Kinetic Step Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold italic transition-all duration-700 shrink-0 ${
                      activeStep === step.id 
                        ? 'bg-white text-[#9f0707] rotate-[360deg] shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                        : 'bg-white/10 text-white/40 rotate-0'
                    }`}>
                    {step.id}
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-1 transition-colors duration-500 ${activeStep === step.id ? 'text-white' : 'text-white/40'}`}>
                      {step.btnTitle}
                    </h3>
                    <p className={`text-sm leading-relaxed transition-all duration-700 font-medium ${activeStep === step.id ? 'text-white/70' : 'text-white/0 h-0 opacity-0'}`}>
                      {step.btnDesc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pop-up Visual Preview */}
          <div className="relative flex items-center justify-center min-h-[500px]">
            {currentSteps.map((step, i) => (
              <div
                key={`${userType}-${step.id}`}
                ref={el => panelsRef.current[i] = el}
                className="absolute w-full opacity-0 pointer-events-none"
              >
                <div className="bg-white/10 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/20 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.6)] h-[500px] flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-6xl shadow-2xl mb-12 rotate-3 transform-gpu">
                    {step.emoji}
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">{step.title}</h3>
                  <p className="text-white/70 text-lg max-w-[340px] mx-auto leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
