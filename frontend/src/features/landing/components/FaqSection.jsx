import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion';

export default function FaqSection() {
  return (
    <section id="faq" className="py-24 px-6 bg-[#0a0101]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#bc1313] mb-2 font-bold tracking-widest text-xs uppercase">• FAQS</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Frequently asked <span className="text-[#bc1313] italic">questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4 shadow-black/50 shadow-2xl">
          {/* FAQ 1 */}
          <AccordionItem value="item-1" className="bg-transparent border border-white/5 rounded-2xl px-6 transition-all hover:border-[#bc1313]/30">
            <AccordionTrigger className="hover:text-[#bc1313] text-gray-300 py-6 text-left text-base font-medium transition-colors">
              What is ASPIRE and how does it work?
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 pb-6 leading-relaxed">
              ASPIRE is an intelligent enrollment analytics platform that helps educational institutions predict student enrollment trends, track performance, and make data-driven decisions. It uses machine learning models to analyze historical data and provide actionable insights.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 2 */}
          <AccordionItem value="item-2" className="bg-transparent border border-white/5 rounded-2xl px-6 transition-all hover:border-[#bc1313]/30">
            <AccordionTrigger className="hover:text-[#bc1313] text-gray-300 py-6 text-left text-base font-medium transition-colors">
              How accurate are the enrollment predictions?
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 pb-6 leading-relaxed">
              Our predictive models achieve a 98% accuracy rate based on comprehensive analysis of student performance data, historical enrollment patterns, and learning outcome proficiency scores mapped directly to assessments.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 3 */}
          <AccordionItem value="item-3" className="bg-transparent border border-white/5 rounded-2xl px-6 transition-all hover:border-[#bc1313]/30">
            <AccordionTrigger className="hover:text-[#bc1313] text-gray-300 py-6 text-left text-base font-medium transition-colors">
              Can I track individual student performance?
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 pb-6 leading-relaxed">
              Yes! ASPIRE provides detailed student tracking capabilities across multiple classes and sections. You can easily manage archives, active sessions, and multi-course curriculums dynamically.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 4 */}
          <AccordionItem value="item-4" className="bg-transparent border border-white/5 rounded-2xl px-6 transition-all hover:border-[#bc1313]/30">
            <AccordionTrigger className="hover:text-[#bc1313] text-gray-300 py-6 text-left text-base font-medium transition-colors">
              What are Intended Learning Outcomes (ILOs)?
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 pb-6 leading-relaxed">
              Intended Learning Outcomes (ILOs) are specific goals that state what a student should know, be able to do, or value after completing a course. ASPIRE lets you map assessment items directly to these ILOs to generate precise proficiency scores.
            </AccordionContent>
          </AccordionItem>

          {/* FAQ 5 */}
          <AccordionItem value="item-5" className="bg-transparent border border-white/5 rounded-2xl px-6 transition-all hover:border-[#bc1313]/30">
            <AccordionTrigger className="hover:text-[#bc1313] text-gray-300 py-6 text-left text-base font-medium transition-colors">
              Is my student data secure and private?
            </AccordionTrigger>
            <AccordionContent className="text-gray-500 pb-6 leading-relaxed">
              Absolutely. All student data is encrypted and stored securely. We comply with strict educational data privacy regulations, and only authorized educators can access their cohort data.
            </AccordionContent>
          </AccordionItem>
          
        </Accordion>
      </div>
    </section>
  );
}
