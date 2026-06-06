import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';

gsap.registerPlugin(ScrollTrigger);

export default function FaqSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Header animation
    gsap.fromTo('.faq-header',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true
        }
      }
    );

    // Staggered accordion items
    gsap.fromTo('.faq-item',
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.faq-accordion',
          start: "top 85%",
          once: true
        }
      }
    );
  }, { scope: containerRef });

  const faqs = [
    {
      question: "How does the AI Career Coach help students?",
      answer: "The AI Career Coach analyzes your academic performance and skills to map out personalized career goals. It generates detailed, step-by-step roadmaps that show you exactly what you need to achieve to reach your dream job."
    },
    {
      question: "How does skill mapping work with my coursework?",
      answer: "Every assessment and project is mapped to specific Integrated Learning Outcomes (ILO). This allows ASPIRE to build a detailed 'skill map' of your academic journey, showing your proficiency levels in technical depth, analytical rigor, and professional ethics."
    },
    {
      question: "What makes the skill roadmaps different from a regular syllabus?",
      answer: "Unlike a static syllabus, our roadmaps are dynamic and personalized. They adapt based on your actual mastery levels, suggesting specific focus areas or supplementary learning paths to bridge the gap between your current skills and your target career goal."
    },
    {
      question: "What are the benefits of connecting GitHub?",
      answer: "By connecting GitHub, ASPIRE automatically detects your technical competencies from your real-world projects. This information is used to build an industry-ready academic portfolio and refine your career roadmap based on actual code contributions."
    },
    {
      question: "How do instructors identify students who need support?",
      answer: "Instructors have access to a predictive 'at-risk' dashboard. ASPIRE's ML models monitor student mastery of Learning Outcomes (ILO) and historical performance to flag students who may need intervention before they fall behind."
    },
    {
      question: "Is the AI analysis real-time?",
      answer: "Yes! Your skill profile, career roadmap, and academic predictions are updated in real-time as soon as new grades are posted or GitHub activity is synchronized. This ensures you always have the most current view of your progress."
    },
    {
      question: "How do students join their classes?",
      answer: "Instructors generate unique class codes for every subject. Students can simply enter these codes in their dashboard to instantly join the class roster, access materials, and start tracking their specific learning outcomes."
    }
  ];

  return (
    <section id="faq" ref={containerRef} className="pt-24 pb-20 px-6 bg-[#FFFFFF]">
      <div className="max-w-3xl mx-auto">
        <div className="faq-header text-center mb-16 opacity-0">
          <p className="text-[#9f0707] mb-2 font-bold tracking-widest text-base uppercase">• FAQS</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#430202]">
            Frequently asked <span className="text-[#9f0707] italic">questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="faq-accordion space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem 
              key={i} 
              value={`item-${i}`} 
              className="faq-item opacity-0 bg-white border border-[#9f0707]/10 rounded-2xl px-6 transition-all hover:border-[#9f0707]/30 shadow-sm hover:shadow-md"
            >
              <AccordionTrigger className="hover:text-[#9f0707] text-[#430202] py-6 text-left text-base font-bold transition-colors leading-tight">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#430202]/70 pb-6 leading-relaxed font-medium">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
