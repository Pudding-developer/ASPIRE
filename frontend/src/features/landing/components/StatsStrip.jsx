import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react'; // eslint-disable-line no-unused-vars

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <section className="py-20 border-y border-white/5 bg-[#0a0101]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={680} suffix="+" />
          </div>
          <div className="text-sm text-gray-400">Students</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={64} />
          </div>
          <div className="text-sm text-gray-400">Courses</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={12} />
          </div>
          <div className="text-sm text-gray-400">Student Outcomes</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="text-4xl md:text-5xl font-light text-[#bc1313] mb-3">
            <AnimatedCounter target={95} suffix="%" />
          </div>
          <div className="text-sm text-gray-400">Accuracy</div>
        </motion.div>
      </div>
    </section>
  );
}
