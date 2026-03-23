import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars
import instructorDashboard from '../../../assets/instructor-dashboard.png';
import studentDashboard from '../../../assets/student-dashboard.png';

export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-12 px-6 overflow-hidden">
      <div className="relative h-[500px] md:h-[900px] mt-8 w-full">
        
        {/* Instructor Dashboard (Back Left) */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute left-0 top-0 w-[70%] md:w-[60%] z-0 rounded-2xl overflow-hidden border border-[#430202] shadow-[0_0_30px_rgba(188,19,19,0.15)] backdrop-blur-md"
        >
          <img 
            src={instructorDashboard} 
            alt="Instructor's Dashboard" 
            className="w-full h-auto rounded-2xl"
          />
        </motion.div>

        {/* Student Dashboard (Front Right, overlapping) */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="absolute right-0 top-32 md:top-48 w-[70%] md:w-[58%] z-10 rounded-2xl overflow-hidden border border-[#430202] shadow-[-20px_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <img 
            src={studentDashboard} 
            alt="Student Dashboard" 
            className="w-full h-auto rounded-2xl"
          />
        </motion.div>

        {/* Floating Stat: Beltran, Don Maxwell F. 92% */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-2 md:top-0 right-4 md:right-16 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 shadow-2xl z-20 flex items-center gap-4"
        >
          <div className="text-white text-sm font-semibold">Beltran, Don Maxwell F.</div>
          <div className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-lg shadow-inner">92%</div>
        </motion.div>

        {/* Floating Stat: 680+ Students Tracked */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-1/3 left-4 md:left-10 backdrop-blur-md bg-[#bc1313] border border-[#ff3333]/30 text-white px-5 py-4 rounded-xl shadow-[0_10px_30px_rgba(188,19,19,0.4)] z-20"
        >
          <div className="text-2xl md:text-3xl font-bold mb-1">680+</div>
          <div className="text-xs opacity-90">Students Tracked</div>
        </motion.div>

        {/* Floating Stat: 95% Accuracy Rate */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute bottom-24 md:bottom-32 left-[15%] backdrop-blur-md bg-gradient-to-br from-[#890E0E] to-[#bc1313] border border-white/10 text-white px-5 py-4 rounded-xl shadow-[0_10px_30px_rgba(188,19,19,0.3)] z-20 text-center"
        >
          <div className="text-2xl md:text-3xl font-bold mb-1">95%</div>
          <div className="text-xs opacity-90">Accuracy Rate</div>
        </motion.div>

        {/* Floating Stat: 64 Active Courses */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-8 md:bottom-16 right-10 md:right-24 backdrop-blur-md bg-[#430202] border border-[#bc1313]/30 rounded-xl px-5 py-4 shadow-2xl text-center z-20"
        >
          <div className="text-white text-2xl md:text-3xl font-bold mb-1">64</div>
          <div className="text-gray-300 text-xs">Active Courses</div>
        </motion.div>

      </div>
    </section>
  );
}
