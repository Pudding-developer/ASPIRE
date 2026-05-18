import { motion } from 'motion/react';
import { Users, ArrowRightCircle, Plus, BookOpen } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const hasMissingScores = (cls) => {
  const assessments = cls?.assessments || [];
  const students = cls?.students || [];
  const scores = cls?.scores || [];

  if (!assessments.length || !students.length) return false;

  const scoreMap = new Map();
  scores.forEach(score => {
    const key = `${score.student_id}-${score.assessment_id}`;
    if (!scoreMap.has(key)) scoreMap.set(key, []);
    scoreMap.get(key).push(score);
  });

  for (const student of students) {
    for (const assessment of assessments) {
      const entries = scoreMap.get(`${student.id}-${assessment.id}`);
      if (!entries || entries.length === 0) return true;
      if (entries.some(entry => entry.score == null)) return true;
    }
  }

  return false;
};

export default function MyClassesView({ classes = [], onSelectClass, onCreateClass }) {
  if (classes.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh]">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={32} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Classes Yet</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center">
          You haven't created any classes for this semester. Create your first class to start tracking student performance.
        </p>
        <Button onClick={onCreateClass} className="bg-[#70170f] hover:bg-[#4a0e09] text-white px-6 py-3 rounded-lg flex items-center gap-2">
          <Plus size={20} />
          Create Your First Class
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <Button onClick={onCreateClass} className="bg-[#70170f] hover:bg-[#4a0e09] text-white flex items-center gap-2 px-4 py-2">
          <Plus size={18} /> Create Class
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <motion.div
            key={cls.id}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => onSelectClass(`class-${cls.id}`)}
            className="relative bg-white border border-gray-200 rounded-xl p-6 hover:border-[#70170f] hover:shadow-lg cursor-pointer transition-colors"
          >
            {hasMissingScores(cls) && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                Missing Data
              </span>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{cls.subject_name}</h3>
              <p className="text-gray-600 text-sm">{cls.course_code} — Section {cls.section}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                <Users size={16} />
                <span>{cls.student_count ?? 0} Students</span>
              </div>
              <ArrowRightCircle size={20} className="text-[#70170f]" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
