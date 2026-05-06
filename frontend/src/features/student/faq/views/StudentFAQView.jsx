import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../../components/ui/accordion';
import { HelpCircle, Search } from 'lucide-react';

export default function StudentFAQView() {
  const faqs = [
    {
      question: "How does the AI Career Coach help me?",
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
      question: "How do I join a new class?",
      answer: "Your instructors will provide unique class codes for every subject. You can simply enter these codes in your dashboard to instantly join the class roster, access materials, and start tracking your specific learning outcomes."
    },
    {
      question: "Is the AI analysis real-time?",
      answer: "Yes! Your skill profile, career roadmap, and academic predictions are updated in real-time as soon as new grades are posted or GitHub activity is synchronized. This ensures you always have the most current view of your progress."
    },
    {
      question: "How are my mastery levels calculated?",
      answer: "Mastery is calculated using a weighted average of your performance across assessments mapped to specific learning outcomes. The system accounts for the difficulty of the tasks and your consistency over time."
    },
    {
      question: "What should I do if my GitHub data isn't syncing?",
      answer: "Ensure you have authorized the ASPIRE GitHub app and that your repositories are either public or you have granted access to private ones. You can try refreshing the sync in the GitHub Analytics tab."
    },
    {
      question: "Can I customize my career roadmap?",
      answer: "Yes! You can explore different career paths in the Career Coach section. When you find a path you're interested in, you can pin it to make it your primary goal, and the system will tailor your roadmap accordingly."
    },
    {
      question: "How do I update my profile information?",
      answer: "You can update your personal details and academic interests through the settings section (accessible soon) or by contacting your institution's administrator."
    }
  ];

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#bc1313]/10 rounded-xl">
            <HelpCircle className="text-[#bc1313]" size={24} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Help Center & FAQ</h1>
        </div>
        <p className="text-gray-500 font-medium ml-12">Everything you need to know about the ASPIRE system.</p>
      </div>

      {/* Search Placeholder */}
      <div className="relative mb-12">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search for questions..." 
          className="w-full bg-white border border-gray-200 rounded-2xl py-5 pl-14 pr-6 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#bc1313]/20 focus:border-[#bc1313] transition-all shadow-sm"
        />
      </div>

      {/* FAQ Grid/List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem 
              key={i} 
              value={`item-${i}`} 
              className="bg-white border border-gray-100 rounded-2xl px-8 transition-all hover:border-[#bc1313]/30 shadow-sm hover:shadow-md overflow-hidden"
            >
              <AccordionTrigger className="hover:text-[#bc1313] text-gray-900 py-6 text-left text-lg font-bold transition-colors leading-tight">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed font-medium text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Contact Support Footer */}
      <div className="mt-8 p-8 bg-gray-900 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h3 className="text-xl font-bold mb-1">Still have questions?</h3>
          <p className="text-gray-400 text-sm">We're here to help you navigate your academic success.</p>
        </div>
        <button className="px-8 py-4 bg-[#bc1313] hover:bg-[#890E0E] text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20">
          Contact Support
        </button>
      </div>
    </div>
  );
}
