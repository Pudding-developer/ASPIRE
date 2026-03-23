import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // eslint-disable-line no-unused-vars

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#0a0101]">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16">
          <p className="text-[#bc1313] mb-2 font-bold tracking-widest text-xs uppercase">• HOW IT WORKS</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Up and running in <span className="text-[#bc1313] italic">3 simple steps</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center w-full max-w-5xl">
          <div className="space-y-4">
            <button
              onClick={() => setActiveStep(1)}
              onMouseEnter={() => setActiveStep(1)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                activeStep === 1 ? 'border-[#bc1313] bg-gradient-to-r from-[#bc1313]/10 to-transparent shadow-[0_0_30px_rgba(188,19,19,0.15)]' : 'border-white/5 hover:border-white/10 bg-[#0a0101]'
              }`}
            >
              <div className="flex items-center gap-6 mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg ${
                    activeStep === 1 ? 'bg-[#bc1313] text-white shadow-[#bc1313]/50' : 'bg-white/5 text-gray-500 shadow-transparent'
                  }`}
                >
                  01
                </div>
                <h3 className={`text-xl font-bold ${activeStep === 1 ? 'text-white' : 'text-gray-400'}`}>
                  Create Your Classes
                </h3>
              </div>
              <p className={`text-sm leading-relaxed ml-[72px] ${activeStep === 1 ? 'text-gray-300' : 'text-gray-600'}`}>
                Set up your courses with subject names, course codes, and sections. Invite students using class codes.
              </p>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              onMouseEnter={() => setActiveStep(2)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                activeStep === 2 ? 'border-[#bc1313] bg-gradient-to-r from-[#bc1313]/10 to-transparent shadow-[0_0_30px_rgba(188,19,19,0.15)]' : 'border-white/5 hover:border-white/10 bg-[#0a0101]'
              }`}
            >
              <div className="flex items-center gap-6 mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg ${
                    activeStep === 2 ? 'bg-[#bc1313] text-white shadow-[#bc1313]/50' : 'bg-white/5 text-gray-500 shadow-transparent'
                  }`}
                >
                  02
                </div>
                <h3 className={`text-xl font-bold ${activeStep === 2 ? 'text-white' : 'text-gray-400'}`}>
                  Input Assessment Scores
                </h3>
              </div>
              <p className={`text-sm leading-relaxed ml-[72px] ${activeStep === 2 ? 'text-gray-300' : 'text-gray-600'}`}>
                Map assessments to ILOs and input scores. The system automatically calculates proficiency scores for you.
              </p>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              onMouseEnter={() => setActiveStep(3)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                activeStep === 3 ? 'border-[#bc1313] bg-gradient-to-r from-[#bc1313]/10 to-transparent shadow-[0_0_30px_rgba(188,19,19,0.15)]' : 'border-white/5 hover:border-white/10 bg-[#0a0101]'
              }`}
            >
              <div className="flex items-center gap-6 mb-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-lg ${
                    activeStep === 3 ? 'bg-[#bc1313] text-white shadow-[#bc1313]/50' : 'bg-white/5 text-gray-500 shadow-transparent'
                  }`}
                >
                  03
                </div>
                <h3 className={`text-xl font-bold ${activeStep === 3 ? 'text-white' : 'text-gray-400'}`}>
                  Analyze & Predict
                </h3>
              </div>
              <p className={`text-sm leading-relaxed ml-[72px] ${activeStep === 3 ? 'text-gray-300' : 'text-gray-600'}`}>
                View analytics, identify at-risk students, and get enrollment predictions based on student performance data.
              </p>
            </button>
          </div>

          <div className="relative flex items-center justify-center min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="bg-[#0f0202] rounded-2xl p-10 shadow-2xl relative overflow-hidden h-[400px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-black to-transparent opacity-80"></div>
                  <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#bc1313] to-[#890E0E] rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-xl shadow-[#bc1313]/30">
                      {activeStep === 1 && '📚'}
                      {activeStep === 2 && '📝'}
                      {activeStep === 3 && '📊'}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {activeStep === 1 && 'Class Setup'}
                      {activeStep === 2 && 'Input Scores'}
                      {activeStep === 3 && 'Analyze Intelligence'}
                    </h3>
                    <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                      {activeStep === 1 && 'Quickly create and organize your classes with automated class code generation for easy student enrollment.'}
                      {activeStep === 2 && 'Map scores directly to Intended Learning Outcomes and generate comprehensive proficiency metrics instantly.'}
                      {activeStep === 3 && 'Utilize advanced ML to forecast student achievement trajectories and apply data-driven academic interventions.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
