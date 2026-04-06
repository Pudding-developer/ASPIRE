import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Save, Copy, Archive, Trash2, Users, Code, BarChart2, ClipboardCheck, Edit2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function ClassDetailView({ classId, classData, onBack, onShowCode, onArchive, onDelete }) {
  const [activeTab, setActiveTab] = useState('profiles');

  const subjectName = classData?.subject_name || '—';
  const courseCode  = classData ? `${classData.course_code} - ${classData.section}` : '—';

  return (
    <>
      {activeTab === 'scores' ? (
        <div className="p-8">
          {/* Back Button */}
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#0f172a] transition-colors mb-4 font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back to Classes
          </button>
          
          <h1 className="text-[2rem] font-bold text-[#1e293b] mb-8">Input Assessment Scores</h1>
          
          <ScoresInputPanel />
        </div>
      ) : (
        <div className="p-8">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6 text-[13px] font-medium"
          >
            <ArrowLeft size={16} /> Back to Classes
          </button>

          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-[2.5rem] tracking-tight font-extrabold text-[#111827] mb-1">{subjectName}</h1>
              <p className="text-[#6b7280] text-[17px]">{courseCode}</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Button onClick={onArchive} variant="outline" className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 bg-white px-5 py-[10px] font-bold text-sm shadow-sm rounded-lg flex items-center justify-center h-auto transition-colors">
                <Archive size={16} className="mr-2" /> Archive
              </Button>
              <Button onClick={onDelete} className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-5 py-[10px] font-bold text-sm shadow-sm rounded-lg flex items-center justify-center h-auto transition-colors">
                <Trash2 size={16} className="mr-2" /> Delete Class
              </Button>
            </div>
          </div>

          {/* Sub-nav */}
          <div className="flex items-center gap-8 mb-8 border-b border-gray-200 border-opacity-70">
            <button 
              onClick={() => setActiveTab('profiles')}
              className={`pb-3 flex items-center gap-3 text-[14px] font-semibold transition-colors border-b-2
                ${activeTab === 'profiles' ? 'border-[#bc1313] text-[#bc1313]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <Users size={16} /> Profiles
            </button>
            <button 
              onClick={onShowCode}
              className="pb-3 flex items-center gap-3 text-[14px] font-semibold transition-colors border-b-2 border-transparent text-[#6b7280] hover:text-[#374151]"
            >
              <Code size={16} /> Class Code
            </button>
            <button 
              onClick={() => setActiveTab('scores')}
              className={`pb-3 flex items-center gap-3 text-[14px] font-semibold transition-colors border-b-2
                ${activeTab === 'scores' ? 'border-[#bc1313] text-[#bc1313]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <BarChart2 size={16} /> Assessment Scoring
            </button>
            <button 
              onClick={() => setActiveTab('submitted')}
              className={`pb-3 flex items-center gap-3 text-[14px] font-semibold transition-colors border-b-2
                ${activeTab === 'submitted' ? 'border-[#bc1313] text-[#bc1313]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <ClipboardCheck size={16} /> Submitted Assessments
            </button>
          </div>

          {/* Dynamic Panels */}
          {activeTab === 'profiles' && <ProfilesPanel />}
          {activeTab === 'submitted' && <SubmittedAssessmentsPanel />}
        </div>
      )}
    </>
  );
}



function ScoresInputPanel() {
  const [numILOs, setNumILOs] = useState(4);
  const iloRange = Array.from({ length: numILOs }, (_, i) => i + 1);

  const students = [];

  return (
    <div className="w-full">
      {/* Dropdowns */}
      <div className="flex gap-6 mb-8 w-full">
        <div className="flex-1 space-y-2">
          <label className="text-[13px] font-semibold text-[#475569] tracking-wide">Assessment</label>
          <div className="relative">
            <select className="block w-full bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none text-[#1e293b] appearance-none shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
              <option>All Assessments</option>
              <option>Midterm Exam</option>
              <option>Quiz 1</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[13px] font-semibold text-[#475569] tracking-wide">Type</label>
          <div className="relative">
            <select className="block w-full bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none text-[#1e293b] appearance-none shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
              <option>All Types</option>
              <option>Summative</option>
              <option>Formative</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Set ILO Totals */}
      <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-[#1e293b]">Set ILO Totals (for all students)</h3>
          <div className="flex items-center gap-3 text-sm flex-row">
            <span className="text-[#64748b] font-medium mr-1 tracking-wide">Number of ILOs:</span>
            <span className={`font-semibold transition-colors ${numILOs === 3 ? 'text-[#64748b]' : 'text-gray-400'}`}>3 ILOs</span>
            <button 
              className="w-[42px] h-6 rounded-full bg-[#bc1313] flex items-center relative transition-colors px-1 cursor-pointer hover:bg-[#890E0E]"
              onClick={() => setNumILOs(numILOs === 3 ? 4 : 3)}
            >
              <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transform transition-transform ${numILOs === 4 ? 'translate-x-[16px]' : 'translate-x-0'}`} />
            </button>
            <span className={`font-semibold transition-colors ${numILOs === 4 ? 'text-[#1e293b]' : 'text-gray-400'}`}>4 ILOs</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {iloRange.map(i => (
            <div key={i} className="space-y-2">
              <label className="text-[13px] font-bold tracking-wide text-[#64748b]">ILO {i} Total</label>
              <input type="number" defaultValue={50} className="w-full border border-gray-200 rounded-lg px-4 py-[10px] outline-none focus:border-[#bc1313] text-[#1e293b] font-medium transition-colors hover:border-gray-300 mt-1 shadow-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No students enrolled yet. Share the class code for students to join.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-5 border-b border-r border-[#e2e8f0] bg-white w-[220px]" rowSpan={2}>
                  <span className="text-[13px] font-extrabold text-[#111827] flex justify-center">Name</span>
                </th>
                {iloRange.map(i => (
                  <th key={i} colSpan={2} className="p-4 text-center border-b border-[#e2e8f0] bg-white border-r last:border-r-0">
                    <span className="text-[15px] font-extrabold text-[#111827]">ILO {i}</span>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0] bg-white">
                {iloRange.map(i => (
                  <React.Fragment key={i}>
                    <th className="py-3 px-2 text-center text-[12px] font-semibold text-[#6b7280] border-r border-[#e2e8f0]">Score</th>
                    <th className="py-3 px-2 text-center text-[12px] font-semibold text-[#6b7280] border-r border-[#e2e8f0] last:border-r-0">Proficiency</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="p-6 font-semibold text-[#1f2937] text-[14px] border-r border-[#e2e8f0] leading-snug">
                    {student.name.split(' ').map((n, j) => <div key={j}>{n}</div>)}
                  </td>
                  {iloRange.map(i => (
                    <React.Fragment key={i}>
                      <td className="p-3 text-center border-r border-[#e2e8f0] bg-white align-middle">
                        <input type="number" className="w-[85px] h-[40px] px-2 py-1 text-[15px] border border-gray-200 rounded-lg text-center mx-auto block outline-none focus:border-[#bc1313] font-medium text-[#111827] hover:border-gray-300 transition-colors shadow-sm" defaultValue={0} />
                      </td>
                      <td className="p-3 text-center text-[14px] font-semibold text-[#9ca3af] border-r border-[#e2e8f0] last:border-r-0 bg-[#f9fafb] align-middle">
                        0%
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-end">
        <button className="bg-[#bc1313] hover:bg-[#890E0E] text-white font-medium py-[10px] px-8 rounded-lg shadow-sm transition-colors text-sm">
          Submit Scores
        </button>
      </div>
    </div>
  );
}

function ProfilesPanel() {
  const students = [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <h2 className="text-[1.15rem] font-bold text-[#1f2937] mb-6">Enrolled Students ({students.length})</h2>
      {students.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No students enrolled yet. Share the class code for students to join.</p>
      ) : (
        <div className="space-y-4">
          {students.map((student, i) => (
            <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
              <div className="flex items-center gap-6">
                <div className="w-[50px] h-[50px] rounded-full bg-[#fef2f2] text-[#bc1313] font-bold text-lg flex items-center justify-center">
                  {student.initial}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-[#111827] text-[15px]">{student.name}</p>
                  <p className="text-[13px] text-[#6b7280]">SR-Code: {student.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-[14px] py-[6px] rounded-full text-[11px] font-bold mr-4 ${
                  student.color === 'green' ? 'bg-[#dcfce7] text-[#166534]' :
                  student.color === 'blue' ? 'bg-[#dbeafe] text-[#1e40af]' :
                  'bg-[#fee2e2] text-[#991b1b]'
                }`}>
                  {student.status}
                </span>
                <span className="font-extrabold text-[1.4rem] text-[#111827] w-16 text-right tracking-tight">{student.score}%</span>
                <button className="text-[#9ca3af] hover:text-gray-600 transition-colors ml-4"><MoreVertical size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmittedAssessmentsPanel() {
  const assessments = [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-[1.15rem] font-bold text-[#1f2937]">Submitted Assessments ({assessments.length})</h2>
      </div>
      <div className="p-8 pt-6">
        {assessments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No assessments submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex flex-col gap-[6px]">
                  <h3 className="font-bold text-[#1e293b] text-[15px]">{assessment.title}</h3>
                  <p className="text-[13px] text-[#6b7280]">Date Submitted: {assessment.date}</p>
                </div>
                <button className="flex items-center gap-2 px-[18px] py-[8px] bg-white border border-gray-200 text-[#475569] text-[13px] font-bold rounded-[8px] hover:bg-gray-50 hover:text-[#1e293b] transition-all shadow-sm">
                  <Edit2 size={14} className="opacity-80" /> Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
