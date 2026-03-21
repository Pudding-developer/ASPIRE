import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Menu, X, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import instructorDashboardImg from 'figma:asset/8f3c6db99a12701748f6a288b6143162ca6dd379.png';
import studentDashboardImg from 'figma:asset/b32ebf15e9306ff1ed662f1335093c61fb8495aa.png';
import aspireLogo from 'figma:asset/5227b8b61c5f740be219c4cb41f95e2c30adf0d7.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0101] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0a0101]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="h-8">
            <img src={aspireLogo} alt="ASPIRE" className="h-full" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="hover:text-[#bc1313] transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#bc1313] transition-colors">
              How it works
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-[#bc1313] transition-colors">
              FAQs
            </button>
          </div>

          <div className="hidden md:block">
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#bc1313] hover:bg-[#890E0E] text-white"
            >
              Log in
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0a0101] z-40 flex flex-col items-center justify-center gap-8 md:hidden"
        >
          <button onClick={() => scrollToSection('features')} className="text-2xl hover:text-[#bc1313] transition-colors">
            Features
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className="text-2xl hover:text-[#bc1313] transition-colors">
            How it works
          </button>
          <button onClick={() => scrollToSection('faq')} className="text-2xl hover:text-[#bc1313] transition-colors">
            FAQs
          </button>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#bc1313] hover:bg-[#890E0E] text-white text-xl px-8 py-6"
          >
            Log in
          </Button>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(188, 19, 19, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 19, 19, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Radial Red Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#bc1313] opacity-20 blur-[150px] rounded-full"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4">
              <p className="text-[#fffff] text-sm">
                Introducing ASPIRE v1.0 — ML-Powered Academic Forecasting
              </p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <span className="block text-6xl md:text-8xl leading-tight">
              <span className="text-white">Analyze. </span>
              <span className="text-[#bc1313] italic"> Predict. </span>
              <span className="text-white">Achieve.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-400 text-lg md:text-xl mb-8 max-w-3xl mx-auto"
          >
            ASPIRE provides advanced enrollment prediction tools that analyze student data, generate insights, and help you engage better — built for institutions of all sizes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-8 py-6 text-lg"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative min-h-[600px]">
            {/* Instructor Dashboard - Upper Left with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: -50, y: -50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative mb-8 md:mb-0 md:w-[60%]"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#bc1313] to-[#890E0E] rounded-2xl opacity-30 blur-2xl"></div>
              <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <img src={instructorDashboardImg} alt="Instructor Dashboard" className="w-full rounded-lg" />
                
                {/* Floating Analytics Badge 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  animate={{ y: [0, -10, 0] }}
                  whileHover={{ scale: 1.05 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 -right-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg"
                  style={{ transition: "all 2s ease-in-out" }}
                >
                  <div className="text-[#bc1313] text-xs mb-1">Avg Performance</div>
                  <div className="text-white text-2xl">92%</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Student Dashboard - Lower Right with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, x: 50, y: 50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              viewport={{ once: true }}
              className="relative md:absolute md:right-0 md:top-40 md:w-[60%]"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#890E0E] to-[#430202] rounded-2xl opacity-30 blur-2xl"></div>
              <div className="relative backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <img src={studentDashboardImg} alt="Student Dashboard" className="w-full rounded-lg" />
                
                {/* Floating Analytics Badge 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  animate={{ y: [0, -8, 0] }}
                  whileHover={{ scale: 1.05 }}
                  viewport={{ once: true }}
                  className="absolute -bottom-4 -left-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg"
                  style={{ transition: "all 2.5s ease-in-out" }}
                >
                  <div className="text-[#bc1313] text-xs mb-1">Active Students</div>
                  <div className="text-white text-2xl">680+</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Floating Stat Badges with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              animate={{ y: [0, -12, 0] }}
              whileHover={{ scale: 1.1 }}
              viewport={{ once: true }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-gradient-to-br from-[#bc1313]/80 to-[#890E0E]/80 border border-white/20 text-white px-5 py-4 rounded-xl shadow-2xl z-10"
              style={{ transition: "all 2s ease-in-out" }}
            >
              <div className="text-2xl">680+</div>
              <div className="text-xs opacity-90">Students Tracked</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              animate={{ y: [0, -15, 0] }}
              whileHover={{ scale: 1.1 }}
              viewport={{ once: true }}
              className="absolute bottom-32 left-1/4 backdrop-blur-md bg-gradient-to-br from-[#890E0E]/80 to-[#bc1313]/80 border border-white/20 text-white px-5 py-4 rounded-xl shadow-2xl z-10"
              style={{ transition: "all 2.3s ease-in-out" }}
            >
              <div className="text-2xl">95%</div>
              <div className="text-xs opacity-90">Accuracy Rate</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              animate={{ y: [0, -10, 0] }}
              whileHover={{ scale: 1.1 }}
              viewport={{ once: true }}
              className="absolute bottom-12 right-1/4 backdrop-blur-md bg-gradient-to-br from-[#430202]/80 to-[#890E0E]/80 border border-white/20 text-white px-5 py-4 rounded-xl shadow-2xl z-10"
              style={{ transition: "all 2.8s ease-in-out" }}
            >
              <div className="text-2xl">64</div>
              <div className="text-xs opacity-90">Active Courses</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-12 border-y border-white/10 mt-32 md:mt-48">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl text-[#bc1313] mb-2">680+</div>
              <div className="text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-[#bc1313] mb-2">64</div>
              <div className="text-gray-400">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-[#bc1313] mb-2">12</div>
              <div className="text-gray-400">Student Outcomes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-[#bc1313] mb-2">95%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#bc1313] mb-2">• FEATURES</p>
            <h2 className="text-5xl mb-4">
              Everything you need to <span className="text-[#bc1313] italic">predict smarter</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1a0505] to-[#0a0101] border border-[#bc1313]/20 rounded-xl p-6 hover:border-[#bc1313]/50 transition-all"
            >
              <div className="w-12 h-12 bg-[#bc1313]/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="text-[#bc1313]" />
              </div>
              <h3 className="text-xl mb-2">Predictive Analytics</h3>
              <p className="text-gray-400 text-sm">
                Forecast enrollment trends with machine learning models that analyze historical data and student behavior patterns.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1a0505] to-[#0a0101] border border-[#bc1313]/20 rounded-xl p-6 hover:border-[#bc1313]/50 transition-all"
            >
              <div className="w-12 h-12 bg-[#bc1313]/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-[#bc1313]" />
              </div>
              <h3 className="text-xl mb-2">Student Tracking</h3>
              <p className="text-gray-400 text-sm">
                Monitor student performance, identify at-risk learners, and track top performers in real-time dashboards.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1a0505] to-[#0a0101] border border-[#bc1313]/20 rounded-xl p-6 hover:border-[#bc1313]/50 transition-all"
            >
              <div className="w-12 h-12 bg-[#bc1313]/20 rounded-lg flex items-center justify-center mb-4">
                <Target className="text-[#bc1313]" />
              </div>
              <h3 className="text-xl mb-2">ILO Mapping</h3>
              <p className="text-gray-400 text-sm">
                Map assessments to Intended Learning Outcomes and automatically calculate proficiency scores for better insights.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-[#1a0505] to-[#0a0101] border border-[#bc1313]/20 rounded-xl p-6 hover:border-[#bc1313]/50 transition-all"
            >
              <div className="w-12 h-12 bg-[#bc1313]/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-[#bc1313]" />
              </div>
              <h3 className="text-xl mb-2">Real-Time Insights</h3>
              <p className="text-gray-400 text-sm">
                Generate instant reports and visualizations that help instructors make data-driven decisions quickly.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Shimmer Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#bc1313] to-transparent"></div>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#bc1313] mb-2">• HOW IT WORKS</p>
            <h2 className="text-5xl mb-4">
              Up and running in <span className="text-[#bc1313] italic">3 simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Steps on the Left */}
            <div className="space-y-4">
              <motion.button
                onClick={() => setActiveStep(1)}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className={`w-full text-left p-6 rounded-xl border transition-all ${
                  activeStep === 1 ? 'border-[#bc1313] bg-[#1a0505] scale-105' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ scale: activeStep === 1 ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      activeStep === 1 ? 'bg-[#bc1313] text-white shadow-lg shadow-[#bc1313]/50' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    01
                  </motion.div>
                  <h3 className="text-xl">Create Your Classes</h3>
                </div>
                <p className="text-gray-400 text-sm ml-[72px]">
                  Set up your courses with subject names, course codes, and sections. Invite students using class codes.
                </p>
              </motion.button>

              <motion.button
                onClick={() => setActiveStep(2)}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className={`w-full text-left p-6 rounded-xl border transition-all ${
                  activeStep === 2 ? 'border-[#bc1313] bg-[#1a0505] scale-105' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ scale: activeStep === 2 ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      activeStep === 2 ? 'bg-[#bc1313] text-white shadow-lg shadow-[#bc1313]/50' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    02
                  </motion.div>
                  <h3 className="text-xl">Input Assessment Scores</h3>
                </div>
                <p className="text-gray-400 text-sm ml-[72px]">
                  Map assessments to ILOs and input scores. The system automatically calculates proficiency scores for you.
                </p>
              </motion.button>

              <motion.button
                onClick={() => setActiveStep(3)}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className={`w-full text-left p-6 rounded-xl border transition-all ${
                  activeStep === 3 ? 'border-[#bc1313] bg-[#1a0505] scale-105' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ scale: activeStep === 3 ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                      activeStep === 3 ? 'bg-[#bc1313] text-white shadow-lg shadow-[#bc1313]/50' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    03
                  </motion.div>
                  <h3 className="text-xl">Analyze & Predict</h3>
                </div>
                <p className="text-gray-400 text-sm ml-[72px]">
                  View analytics, identify at-risk students, and get enrollment predictions based on student performance data.
                </p>
              </motion.button>
            </div>

            {/* Visual Panel on the Right */}
            <div className="relative flex items-center justify-center min-h-[400px]">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.9, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full"
              >
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center justify-center h-full min-h-[350px]">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#bc1313] to-[#890E0E] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-[#bc1313]/30">
                        {activeStep === 1 && '📚'}
                        {activeStep === 2 && '📝'}
                        {activeStep === 3 && '📊'}
                      </div>
                      <h3 className="text-2xl mb-4">
                        {activeStep === 1 && 'Class Setup'}
                        {activeStep === 2 && 'Score Management'}
                        {activeStep === 3 && 'Data Analytics'}
                      </h3>
                      <p className="text-gray-400">
                        {activeStep === 1 && 'Quickly create and organize your classes with automated class code generation for easy student enrollment.'}
                        {activeStep === 2 && 'Streamline your grading process with ILO mapping and automatic proficiency calculations.'}
                        {activeStep === 3 && 'Get real-time insights and ML-powered predictions to support student success.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Shimmer Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#bc1313] to-transparent"></div>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#bc1313] mb-2">• FAQS</p>
            <h2 className="text-5xl mb-4">
              Frequently asked <span className="text-[#bc1313] italic">questions</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-white/10 rounded-xl px-6 bg-[#0a0101]">
              <AccordionTrigger className="hover:text-[#bc1313]">
                What is ASPIRE and how does it work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                ASPIRE is an intelligent enrollment analytics platform that helps educational institutions predict student enrollment trends, track performance, and make data-driven decisions. It uses machine learning models to analyze historical data and provide actionable insights.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-white/10 rounded-xl px-6 bg-[#0a0101]">
              <AccordionTrigger className="hover:text-[#bc1313]">
                How accurate are the enrollment predictions?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Our predictive models achieve a 95% accuracy rate based on comprehensive analysis of student performance data, historical enrollment patterns, and learning outcome proficiency scores. The system continuously learns and improves with more data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-white/10 rounded-xl px-6 bg-[#0a0101]">
              <AccordionTrigger className="hover:text-[#bc1313]">
                Can I track individual student performance?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Yes! ASPIRE provides detailed student tracking capabilities, including performance metrics, ILO proficiency scores, and risk assessment indicators. You can identify top performers and at-risk students in real-time through your instructor dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-white/10 rounded-xl px-6 bg-[#0a0101]">
              <AccordionTrigger className="hover:text-[#bc1313]">
                What are Intended Learning Outcomes (ILOs)?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                ILOs are specific, measurable statements that describe what students should know, understand, or be able to do at the end of a course. ASPIRE allows you to map assessments to ILOs and automatically calculate proficiency scores to measure learning effectiveness.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-white/10 rounded-xl px-6 bg-[#0a0101]">
              <AccordionTrigger className="hover:text-[#bc1313]">
                Is my student data secure and private?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Absolutely. All student data is encrypted and stored securely. We comply with educational data privacy regulations and only authorized instructors can access their class data. You have full control over data sharing permissions and can archive or delete classes at any time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl mb-6">
            Ready to <span className="text-[#bc1313] italic">transform</span><br />
            the way you use analytics?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">Join ASPIRE today</p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-8 py-6 text-lg"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="h-6">
            <img src={aspireLogo} alt="ASPIRE" className="h-full" />
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <button className="hover:text-[#bc1313]">Features</button>
            <button className="hover:text-[#bc1313]">Blog</button>
            <button className="hover:text-[#bc1313]">Docs</button>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 ASPIRE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}