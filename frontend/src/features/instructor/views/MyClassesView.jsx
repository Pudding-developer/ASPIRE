import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ArrowRightCircle, Plus, BookOpen, Filter, List, X, Copy, Check } from 'lucide-react';
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

export default function MyClassesView({
  classes = [],
  onSelectClass,
  onCreateClass,
  selectedYear = 'All',
  setSelectedYear,
  selectedSemester = 'All',
  setSelectedSemester,
}) {
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchYear = selectedYear === 'All' || cls.year_level === parseInt(selectedYear);
      const matchSemester = selectedSemester === 'All' || cls.semester === parseInt(selectedSemester);
      return matchYear && matchSemester;
    });
  }, [classes, selectedYear, selectedSemester]);

  const modalFilteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return filteredClasses;
    const lowerQuery = searchQuery.toLowerCase();
    return filteredClasses.filter(cls => 
      cls.course_code.toLowerCase().includes(lowerQuery) || 
      cls.subject_name.toLowerCase().includes(lowerQuery)
    );
  }, [filteredClasses, searchQuery]);

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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
            <Filter size={16} className="text-gray-400 ml-2" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 cursor-pointer outline-none"
            >
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 cursor-pointer outline-none"
            >
              <option value="All">All Semesters</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
              <option value="3">Summer</option>
            </select>
          </div>

          <Button 
            onClick={() => setShowCodesModal(true)} 
            variant="outline" 
            className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-2 px-4 py-2"
          >
            <List size={18} /> Class Codes
          </Button>

          <Button onClick={onCreateClass} className="bg-[#70170f] hover:bg-[#4a0e09] text-white flex items-center gap-2 px-4 py-2">
            <Plus size={18} /> Create Class
          </Button>
        </div>
      </div>
      
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No classes found matching your filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
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
                <p className="text-xs text-gray-400 mt-1">Year {cls.year_level} • Semester {cls.semester}</p>
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
      )}

      {/* Class Codes Modal */}
      <AnimatePresence>
        {showCodesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setShowCodesModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] relative z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Class Codes</h2>
                  <p className="text-sm text-gray-500 mt-1">Share these codes with students so they can join your classes.</p>
                </div>
                <button onClick={() => setShowCodesModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by course code or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#70170f]/20 focus:border-[#70170f] transition-all"
                  />
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {modalFilteredClasses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No class codes to display for the selected filters.</p>
                ) : (
                  <div className="space-y-3">
                    {modalFilteredClasses.map(cls => (
                      <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div>
                          <p className="font-bold text-gray-900">{cls.course_code} - Section {cls.section}</p>
                          <p className="text-xs text-gray-500">{cls.subject_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="bg-white border border-gray-200 px-3 py-1.5 rounded text-sm font-mono text-[#70170f] font-bold tracking-wide select-all">
                            {cls.class_code}
                          </code>
                          <button
                            onClick={() => handleCopy(cls.class_code)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === cls.class_code ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
