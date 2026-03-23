import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars
import { Activity, Users, Target, Zap } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function FeaturesSection() {
  const features = [
    {
      icon: <Activity className="w-5 h-5 text-[#bc1313]" />,
      title: "Predictive Analytics",
      description: "Forecast enrollment trends with machine learning models that analyze historical data and student behavior patterns."
    },
    {
      icon: <Users className="w-5 h-5 text-[#bc1313]" />,
      title: "Student Tracking",
      description: "Monitor student performance, identify at-risk learners, and track top performers in real-time dashboards."
    },
    {
      icon: <Target className="w-5 h-5 text-[#bc1313]" />,
      title: "ILO Mapping",
      description: "Map assessments to Intended Learning Outcomes and automatically calculate proficiency scores for better insights."
    },
    {
      icon: <Zap className="w-5 h-5 text-[#bc1313]" />,
      title: "Real-Time Insights",
      description: "Generate instant reports and visualizations that help instructors make data-driven decisions quickly."
    }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-[#0a0101]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#bc1313] mb-3 font-bold tracking-widest text-xs uppercase">• FEATURES</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to <span className="text-[#bc1313] italic">predict smarter</span>
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="bg-[#110202] border border-[#300505] rounded-2xl p-8 hover:border-[#bc1313] transition-colors shadow-2xl"
            >
              <div className="bg-[#bc1313]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-medium text-white mb-4">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
