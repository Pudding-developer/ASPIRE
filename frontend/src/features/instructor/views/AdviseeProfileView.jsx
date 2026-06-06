import { useState } from 'react';
import { 
  ArrowLeft, LayoutDashboard, Award, Github, BookOpen, AlertCircle
} from 'lucide-react';
import useStudentData from '../../student/dashboard/hooks/useStudentData';
import StudentDashboardView from '../../student/dashboard/views/StudentDashboardView';
import StudentPerformanceView from '../../student/performance/views/StudentPerformanceView';
import StudentGitHubView from '../../student/github/views/StudentGitHubView';
import EnrolledClassesView from '../../student/classes/views/EnrolledClassesView';

const primaryBtn = 'bg-[#70170f] hover:bg-[#4a0e09] text-white py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer';

export default function AdviseeProfileView({ studentId, onBack }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { profile: studentInfo, classes, archivedClasses, loading, error, predictions, refetch } = useStudentData({}, studentId);

  const handleNavigate = (view) => {
    if (view === 'my-performance') {
      setActiveTab('performance');
    } else if (view === 'github-analytics') {
      setActiveTab('projects');
    } else if (view === 'enrolled-classes') {
      setActiveTab('classes');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-[#70170f] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading advisee profile details...</p>
      </div>
    );
  }

  if (error || !studentInfo) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20 bg-white border border-red-100 rounded-2xl shadow-sm mt-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied or Error</h3>
        <p className="text-gray-500 mb-6">{error || "You do not have permission to view this student profile."}</p>
        <button onClick={onBack} className={primaryBtn}>
          Back to Advisees List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-6">
      {/* Compact Header & Navigation in a single row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3.5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-8 h-8 border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 transition-colors cursor-pointer shrink-0"
            title="Back to Advisees"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="text-lg font-extrabold text-gray-900 leading-none">{studentInfo.full_name}</h1>
            <span className="text-xs text-gray-400 font-medium font-mono">{studentInfo.sr_code}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-500">{studentInfo.email}</span>
          </div>
        </div>

        {/* Tab Navigation Inline */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'performance', label: 'My Performance', icon: Award },
            { id: 'projects', label: 'Project Insights', icon: Github },
            { id: 'classes', label: 'Classes', icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active 
                    ? 'bg-white text-[#70170f] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'dashboard' && (
        <StudentDashboardView user={studentInfo} studentId={studentId} onNavigate={handleNavigate} />
      )}
      {activeTab === 'performance' && (
        <StudentPerformanceView user={studentInfo} studentId={studentId} />
      )}
      {activeTab === 'projects' && (
        <StudentGitHubView user={studentInfo} studentId={studentId} isReadOnly={true} />
      )}
      {activeTab === 'classes' && (
        <EnrolledClassesView
          user={studentInfo}
          classes={classes}
          archivedClasses={archivedClasses}
          predictions={predictions}
          studentId={studentId}
          isReadOnly={true}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}
