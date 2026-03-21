import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  BookOpen,
  Archive,
  Plus,
  LogOut,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Code,
  Trash2,
  ArchiveIcon,
  RotateCcw,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import aspireLogo from 'figma:asset/5227b8b61c5f740be219c4cb41f95e2c30adf0d7.png';

type Student = {
  id: string;
  name: string;
  srCode: string;
  score: number;
  status: 'high' | 'average' | 'low';
};

type Class = {
  id: string;
  subjectName: string;
  courseCode: string;
  section: string;
  classCode: string;
  students: Student[];
};

type ArchivedClass = Class & {
  archivedDate: string;
};

type ILOScore = {
  studentName: string;
  ilo1: number;
  ilo2: number;
  ilo3: number;
  proficiencyScore: number;
};

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'archived'>('dashboard');
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classesDropdownOpen, setClassesDropdownOpen] = useState(false);
  const [classView, setClassView] = useState<'overview' | 'profiles' | 'scores'>('overview');
  const [classCodeOpen, setClassCodeOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'submit' | 'delete' | 'archive' | 'deleteStudent' | 'restoreClass' | 'deleteArchived'>('submit');
  const [verificationTarget, setVerificationTarget] = useState<string>('');
  
  // Dashboard filters
  const [yearFilter, setYearFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  
  // Scores Input filters
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // ILO Totals
  const [ilo1Total, setIlo1Total] = useState(50);
  const [ilo2Total, setIlo2Total] = useState(50);
  const [ilo3Total, setIlo3Total] = useState(50);

  // Create class form
  const [newClass, setNewClass] = useState({
    subjectName: '',
    courseCode: '',
    section: '',
  });

  // Mock data
  const [classes, setClasses] = useState<Class[]>([
    {
      id: '1',
      subjectName: 'Data Structures',
      courseCode: 'CS201',
      section: 'A',
      classCode: 'DS-2026-A-XY7Z',
      students: [
        { id: '1', name: 'Alice Johnson', srCode: '22-01234', score: 95, status: 'high' },
        { id: '2', name: 'Bob Smith', srCode: '22-01235', score: 88, status: 'average' },
        { id: '3', name: 'Carol White', srCode: '22-01236', score: 62, status: 'low' },
      ],
    },
    {
      id: '2',
      subjectName: 'Web Development',
      courseCode: 'CS301',
      section: 'B',
      classCode: 'WD-2026-B-ABC3',
      students: [
        { id: '4', name: 'David Lee', srCode: '22-01237', score: 92, status: 'high' },
        { id: '5', name: 'Emma Davis', srCode: '22-01238', score: 78, status: 'average' },
      ],
    },
  ]);

  const [archivedClasses, setArchivedClasses] = useState<ArchivedClass[]>([]);

  const [iloScores, setIloScores] = useState<ILOScore[]>([
    { studentName: 'Alice Johnson', ilo1: 0, ilo2: 0, ilo3: 0, proficiencyScore: 0 },
    { studentName: 'Bob Smith', ilo1: 0, ilo2: 0, ilo3: 0, proficiencyScore: 0 },
    { studentName: 'Carol White', ilo1: 0, ilo2: 0, ilo3: 0, proficiencyScore: 0 },
  ]);

  const topStudents = classes.flatMap(c => c.students).filter(s => s.status === 'high').slice(0, 5);
  const atRiskStudents = classes.flatMap(c => c.students).filter(s => s.status === 'low').slice(0, 5);
  const classRepresentatives = ['Alice Johnson - CS201', 'David Lee - CS301'];

  const handleCreateClass = () => {
    if (!newClass.subjectName || !newClass.courseCode || !newClass.section) {
      toast.error('Please fill in all fields');
      return;
    }

    const classCode = `${newClass.courseCode}-2026-${newClass.section}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newClassObj: Class = {
      id: Date.now().toString(),
      ...newClass,
      classCode,
      students: [],
    };

    setClasses([...classes, newClassObj]);
    setCreateClassOpen(false);
    setNewClass({ subjectName: '', courseCode: '', section: '' });
    toast.success('Class created successfully!');
  };

  const handleDeleteClass = () => {
    setClasses(classes.filter(c => c.id !== verificationTarget));
    setSelectedClass(null);
    setVerificationOpen(false);
    toast.success('Class deleted successfully!');
  };

  const handleArchiveClass = () => {
    const classToArchive = classes.find(c => c.id === verificationTarget);
    if (classToArchive) {
      setArchivedClasses([
        ...archivedClasses,
        { ...classToArchive, archivedDate: new Date().toLocaleDateString() },
      ]);
      setClasses(classes.filter(c => c.id !== verificationTarget));
      setSelectedClass(null);
      setVerificationOpen(false);
      toast.success('Class archived successfully!');
    }
  };

  const handleRestoreClass = () => {
    const classToRestore = archivedClasses.find(c => c.id === verificationTarget);
    if (classToRestore) {
      const { archivedDate, ...restoredClass } = classToRestore;
      setClasses([...classes, restoredClass]);
      setArchivedClasses(archivedClasses.filter(c => c.id !== verificationTarget));
      setVerificationOpen(false);
      toast.success('Class restored successfully!');
    }
  };

  const handleDeleteArchivedClass = () => {
    setArchivedClasses(archivedClasses.filter(c => c.id !== verificationTarget));
    setVerificationOpen(false);
    toast.success('Archived class deleted successfully!');
  };

  const handleDeleteStudent = () => {
    if (selectedClass) {
      const updatedClasses = classes.map(cls => {
        if (cls.id === selectedClass) {
          return {
            ...cls,
            students: cls.students.filter(s => s.id !== verificationTarget)
          };
        }
        return cls;
      });
      setClasses(updatedClasses);
      setVerificationOpen(false);
      toast.success('Student removed successfully!');
    }
  };

  const toggleClassesDropdown = () => {
    if (classesDropdownOpen) {
      // Closing dropdown - go back to My Classes dashboard
      setClassesDropdownOpen(false);
      setSelectedClass(null);
      setClassView('overview');
    } else {
      // Opening dropdown
      setClassesDropdownOpen(true);
    }
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setClassView('overview');
  };

  const handleScoreInput = (index: number, ilo: 'ilo1' | 'ilo2' | 'ilo3', score: number) => {
    const newIloScores = [...iloScores];
    newIloScores[index][ilo] = score;
    
    // Calculate proficiency score based on all ILOs
    const totalScore = newIloScores[index].ilo1 + newIloScores[index].ilo2 + newIloScores[index].ilo3;
    const totalPossible = ilo1Total + ilo2Total + ilo3Total;
    newIloScores[index].proficiencyScore = Math.round((totalScore / totalPossible) * 100);
    
    setIloScores(newIloScores);
  };

  const handleSubmitScores = () => {
    setVerificationAction('submit');
    setVerificationOpen(true);
  };

  const confirmSubmitScores = () => {
    setVerificationOpen(false);
    setClassView('overview');
    toast.success('Submitted Successfully!');
  };

  const handleVerificationAction = () => {
    switch (verificationAction) {
      case 'submit':
        confirmSubmitScores();
        break;
      case 'delete':
        handleDeleteClass();
        break;
      case 'archive':
        handleArchiveClass();
        break;
      case 'deleteStudent':
        handleDeleteStudent();
        break;
      case 'restoreClass':
        handleRestoreClass();
        break;
      case 'deleteArchived':
        handleDeleteArchivedClass();
        break;
    }
  };

  const currentClass = classes.find(c => c.id === selectedClass);

  const getVerificationMessage = () => {
    switch (verificationAction) {
      case 'submit':
        return 'Please confirm: Do you want to submit the assessment scores?';
      case 'delete':
        return 'Are you sure you want to delete this class? This action cannot be undone.';
      case 'archive':
        return 'Are you sure you want to archive this class?';
      case 'deleteStudent':
        return 'Are you sure you want to remove this student from the class?';
      case 'restoreClass':
        return 'Are you sure you want to restore this class?';
      case 'deleteArchived':
        return 'Are you sure you want to permanently delete this archived class? This action cannot be undone.';
      default:
        return 'Please confirm this action.';
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#1a0505] to-[#0a0101] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="h-8 mb-1">
            <img src={aspireLogo} alt="ASPIRE" className="h-full" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Instructor Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedClass(null);
              setClassesDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'dashboard' ? 'bg-[#bc1313] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <div>
            <button
              onClick={() => {
                setActiveTab('classes');
                toggleClassesDropdown();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'classes' ? 'bg-[#bc1313] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} />
                <span>Classes</span>
              </div>
              {classesDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {classesDropdownOpen && classes.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 mt-2 space-y-1">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => handleClassSelect(cls.id)}
                        className={`w-full px-4 py-2 text-sm rounded-lg text-left transition-all duration-200 ${
                          selectedClass === cls.id 
                            ? 'bg-[#890E0E] text-white' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {cls.courseCode} - {cls.section}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              setActiveTab('archived');
              setSelectedClass(null);
              setClassesDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'archived' ? 'bg-[#bc1313] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Archive size={20} />
            <span>Archived Classes</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && !selectedClass && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl mb-2 text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, Professor</p>
              </div>
              <Button
                onClick={() => setCreateClassOpen(true)}
                className="bg-[#bc1313] hover:bg-[#890E0E] text-white transition-all duration-200"
              >
                <Plus size={20} className="mr-2" />
                Create Class
              </Button>
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <Label className="text-gray-900">Class Year</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-900">Semester</Label>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="first">First Semester</SelectItem>
                    <SelectItem value="second">Second Semester</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#bc1313]/30"
              >
                <div className="text-gray-600 text-sm mb-2">Total Students</div>
                <div className="text-3xl text-gray-900">
                  {classes.flatMap(c => c.students).length}
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#bc1313]/30"
              >
                <div className="text-gray-600 text-sm mb-2">Active Courses</div>
                <div className="text-3xl text-gray-900">
                  {classes.length}
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#bc1313]/30"
              >
                <div className="text-gray-600 text-sm mb-2">School Year</div>
                <div className="text-3xl text-gray-900">2025-26</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#bc1313]/30"
              >
                <div className="text-gray-600 text-sm mb-2">Avg Performance</div>
                <div className="text-3xl text-gray-900">85%</div>
              </motion.div>
            </div>

            {/* Lists */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl mb-4 text-gray-900">Top Performing Students</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {topStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors duration-200">
                        <span className="text-sm text-gray-900">{student.name}</span>
                        <span className="text-green-600">{student.score}%</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl mb-4 text-gray-900">Students at Risk</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {atRiskStudents.length > 0 ? atRiskStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors duration-200">
                        <span className="text-sm text-gray-900">{student.name}</span>
                        <span className="text-red-600">{student.score}%</span>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-sm text-center py-8">No students at risk</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl mb-4 text-gray-900">Class Representatives</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {classRepresentatives.map((rep, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                        <span className="text-sm text-gray-900">{rep}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab - No Class Selected */}
        {activeTab === 'classes' && !selectedClass && (
          <div className="p-8">
            <h1 className="text-4xl mb-8 text-gray-900">My Classes</h1>
            
            {classes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600 mb-4">No classes yet</p>
                <Button
                  onClick={() => setCreateClassOpen(true)}
                  className="bg-[#bc1313] hover:bg-[#890E0E] text-white"
                >
                  <Plus size={20} className="mr-2" />
                  Create Your First Class
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <motion.div
                    key={cls.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#bc1313] hover:shadow-lg transition-all cursor-pointer duration-200"
                    onClick={() => handleClassSelect(cls.id)}
                  >
                    <h3 className="text-xl mb-2 text-gray-900">{cls.subjectName}</h3>
                    <p className="text-gray-600 text-sm mb-4">{cls.courseCode} - Section {cls.section}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span>{cls.students.length} students</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#bc1313]/10 flex items-center justify-center text-[#bc1313]">
                        →
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Classes Tab - Class Selected */}
        {activeTab === 'classes' && selectedClass && currentClass && (
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => {
                  if (classView !== 'overview') {
                    setClassView('overview');
                  } else {
                    setSelectedClass(null);
                    setClassesDropdownOpen(false);
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-[#bc1313] mb-4 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                {classView !== 'overview' ? 'Back to Overview' : 'Back to Classes'}
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl mb-2 text-gray-900">
                    {currentClass.subjectName}
                  </h1>
                  <p className="text-gray-600">{currentClass.courseCode} - Section {currentClass.section}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setVerificationAction('archive');
                      setVerificationTarget(currentClass.id);
                      setVerificationOpen(true);
                    }}
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition-all duration-200"
                  >
                    <ArchiveIcon size={18} className="mr-2" />
                    Archive
                  </Button>
                  <Button
                    onClick={() => {
                      setVerificationAction('delete');
                      setVerificationTarget(currentClass.id);
                      setVerificationOpen(true);
                    }}
                    className="bg-[#bc1313] hover:bg-[#890E0E] text-white transition-all duration-200"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Delete Class
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {classView === 'overview' && (
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={() => setClassView('scores')}
                  className="bg-[#bc1313] hover:bg-[#890E0E] text-white transition-all duration-200"
                >
                  <FileText size={18} className="mr-2" />
                  Scores Input
                </Button>
                <Button
                  onClick={() => setClassView('profiles')}
                  variant="outline"
                  className="border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-[#bc1313] transition-all duration-200"
                >
                  <Users size={18} className="mr-2" />
                  Profiles
                </Button>
                <Button
                  onClick={() => setClassCodeOpen(true)}
                  variant="outline"
                  className="border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-[#bc1313] transition-all duration-200"
                >
                  <Code size={18} className="mr-2" />
                  Class Code
                </Button>
              </div>
            )}

            {/* Overview View */}
            {classView === 'overview' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl mb-4 text-gray-900">Enrolled Students ({currentClass.students.length})</h3>
                {currentClass.students.length > 0 ? (
                  <div className="space-y-3">
                    {currentClass.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#bc1313]/20 rounded-full flex items-center justify-center text-[#bc1313] font-semibold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-gray-900 font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600">SR-Code: {student.srCode}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'high' ? 'bg-green-100 text-green-700' :
                            student.status === 'low' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {student.status === 'high' ? 'High Performing' :
                             student.status === 'low' ? 'Low Performing' : 'Average'}
                          </div>
                          <div className="text-lg text-gray-900 font-semibold">{student.score}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No students enrolled yet</p>
                )}
              </div>
            )}

            {/* Profiles View */}
            {classView === 'profiles' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl text-gray-900">Student Profiles</h3>
                    <p className="text-gray-600">{currentClass.students.length} students enrolled</p>
                  </div>
                  <div className="space-y-3">
                    {currentClass.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#bc1313]/20 rounded-full flex items-center justify-center text-[#bc1313] font-semibold text-lg">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-900 font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600">SR-Code: {student.srCode}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'high' ? 'bg-green-100 text-green-700' :
                            student.status === 'low' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {student.status === 'high' ? 'High Performing' :
                             student.status === 'low' ? 'Low Performing' : 'Average'}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-gray-200">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => {
                                  setVerificationAction('deleteStudent');
                                  setVerificationTarget(student.id);
                                  setVerificationOpen(true);
                                }}
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete Student
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scores Input View */}
            {classView === 'scores' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-2xl mb-6 text-gray-900">Input Assessment Scores</h3>

                  {/* Filters */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-gray-900">Assessment</Label>
                      <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assessments</SelectItem>
                          <SelectItem value="prelim">Preliminary Exam</SelectItem>
                          <SelectItem value="midterm">Midterm Exam</SelectItem>
                          <SelectItem value="finals">Final Exam</SelectItem>
                          <SelectItem value="problem-sets">Problem Sets</SelectItem>
                          <SelectItem value="laboratory">Laboratory</SelectItem>
                          <SelectItem value="technical-report">Technical Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-900">Type</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="written">Written</SelectItem>
                          <SelectItem value="practical">Practical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ILO Totals */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 mb-3 font-medium">Set ILO Totals (for all students)</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="ilo1Total" className="text-gray-900 text-sm">ILO 1 Total</Label>
                        <Input
                          id="ilo1Total"
                          type="number"
                          value={ilo1Total}
                          onChange={(e) => setIlo1Total(parseFloat(e.target.value) || 50)}
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ilo2Total" className="text-gray-900 text-sm">ILO 2 Total</Label>
                        <Input
                          id="ilo2Total"
                          type="number"
                          value={ilo2Total}
                          onChange={(e) => setIlo2Total(parseFloat(e.target.value) || 50)}
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ilo3Total" className="text-gray-900 text-sm">ILO 3 Total</Label>
                        <Input
                          id="ilo3Total"
                          type="number"
                          value={ilo3Total}
                          onChange={(e) => setIlo3Total(parseFloat(e.target.value) || 50)}
                          className="bg-white border-gray-300 text-gray-900 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scores Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left p-3 text-sm font-semibold text-gray-900">Name</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-900">ILO 1</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-900">ILO 2</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-900">ILO 3</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-900">Proficiency Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iloScores.map((score, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                            <td className="p-3 text-sm text-gray-900 font-medium">{score.studentName}</td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                value={score.ilo1 || ''}
                                onChange={(e) => handleScoreInput(index, 'ilo1', parseFloat(e.target.value) || 0)}
                                className="bg-white border-gray-300 text-gray-900 w-20 text-center"
                                placeholder="0"
                                max={ilo1Total}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                value={score.ilo2 || ''}
                                onChange={(e) => handleScoreInput(index, 'ilo2', parseFloat(e.target.value) || 0)}
                                className="bg-white border-gray-300 text-gray-900 w-20 text-center"
                                placeholder="0"
                                max={ilo2Total}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Input
                                type="number"
                                value={score.ilo3 || ''}
                                onChange={(e) => handleScoreInput(index, 'ilo3', parseFloat(e.target.value) || 0)}
                                className="bg-white border-gray-300 text-gray-900 w-20 text-center"
                                placeholder="0"
                                max={ilo3Total}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                score.proficiencyScore >= 80 ? 'bg-green-100 text-green-700' :
                                score.proficiencyScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                score.proficiencyScore > 0 ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {score.proficiencyScore}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitScores}
                      className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-8"
                    >
                      Submit Scores
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Archived Classes Tab */}
        {activeTab === 'archived' && (
          <div className="p-8">
            <h1 className="text-4xl mb-8 text-gray-900">Archived Classes</h1>
            
            {archivedClasses.length === 0 ? (
              <div className="text-center py-20">
                <Archive size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No archived classes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedClasses.map((cls) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <h3 className="text-xl mb-1 text-gray-900">{cls.subjectName}</h3>
                      <p className="text-gray-600 text-sm">{cls.courseCode} - Section {cls.section}</p>
                      <p className="text-gray-500 text-xs mt-2">Archived on {cls.archivedDate}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setVerificationAction('restoreClass');
                          setVerificationTarget(cls.id);
                          setVerificationOpen(true);
                        }}
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50 transition-all duration-200"
                      >
                        <RotateCcw size={18} className="mr-2" />
                        Restore
                      </Button>
                      <Button
                        onClick={() => {
                          setVerificationAction('deleteArchived');
                          setVerificationTarget(cls.id);
                          setVerificationOpen(true);
                        }}
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 size={18} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Class Dialog */}
      <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Class</DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details to create a new class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject" className="text-gray-900">Subject Name</Label>
              <Input
                id="subject"
                value={newClass.subjectName}
                onChange={(e) => setNewClass({ ...newClass, subjectName: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-2"
                placeholder="e.g., Data Structures"
              />
            </div>
            <div>
              <Label htmlFor="code" className="text-gray-900">Course Code</Label>
              <Input
                id="code"
                value={newClass.courseCode}
                onChange={(e) => setNewClass({ ...newClass, courseCode: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-2"
                placeholder="e.g., CS201"
              />
            </div>
            <div>
              <Label htmlFor="section" className="text-gray-900">Block/Section</Label>
              <Input
                id="section"
                value={newClass.section}
                onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 mt-2"
                placeholder="e.g., A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateClassOpen(false)}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClass}
              className="bg-[#bc1313] hover:bg-[#890E0E] text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirm Action</DialogTitle>
            <DialogDescription className="text-gray-600">
              {getVerificationMessage()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationOpen(false)}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerificationAction}
              className="bg-[#bc1313] hover:bg-[#890E0E] text-white"
            >
              {verificationAction === 'submit' ? 'Yes, Submit' : 'Yes, Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Code Dialog */}
      <Dialog open={classCodeOpen} onOpenChange={setClassCodeOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Class Code</DialogTitle>
            <DialogDescription className="text-gray-600">
              Share this code with your students to join the class
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-[#bc1313]/20 rounded-xl p-8 text-center">
              <div className="text-3xl tracking-wider mb-2 text-[#bc1313] font-mono font-bold">
                {currentClass?.classCode}
              </div>
              <p className="text-gray-600 text-sm">Class Code</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(currentClass?.classCode || '');
                toast.success('Class code copied to clipboard!');
              }}
              className="bg-[#bc1313] hover:bg-[#890E0E] text-white w-full"
            >
              <Code size={18} className="mr-2" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
