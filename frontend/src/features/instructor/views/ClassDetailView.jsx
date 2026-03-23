import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Save, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function ClassDetailView({ classId, onBack, onShowCode, onArchive, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview');

  const classData = {
    subjectName: 'Data Structures',
    courseCode: 'CS 201',
    section: 'A',
    classCode: 'CS201-2026-A-XY7Z'
  };

  return (
    <div className="p-8">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-[#bc1313] transition-colors mb-6 font-medium"
      >
        <ArrowLeft size={18} /> Back to Classes
      </button>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{classData.subjectName}</h1>
          <p className="text-gray-600 mt-1 text-lg">{classData.courseCode} — Section {classData.section}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onArchive} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-white px-4 py-2">
            Archive
          </Button>
          <Button onClick={onDelete} className="bg-[#bc1313] hover:bg-[#890E0E] text-white px-4 py-2">
            Delete Class
          </Button>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-gray-200 pb-4">
        <Button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 ${activeTab === 'overview' ? 'bg-[#bc1313] text-white hover:bg-[#890E0E]' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Overview
        </Button>
        <Button 
          onClick={() => setActiveTab('scores')}
          className={`px-6 py-2 ${activeTab === 'scores' ? 'bg-[#bc1313] text-white hover:bg-[#890E0E]' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Scores Input
        </Button>
        <Button 
          onClick={() => setActiveTab('profiles')}
          className={`px-6 py-2 ${activeTab === 'profiles' ? 'bg-[#bc1313] text-white hover:bg-[#890E0E]' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          Profiles
        </Button>
        <Button onClick={onShowCode} variant="outline" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 ml-auto flex items-center gap-2 px-4 py-2">
          <Copy size={16} /> Class Code
        </Button>
      </div>

      {/* Dynamic Panels */}
      {activeTab === 'overview' && <OverviewPanel />}
      {activeTab === 'scores' && <ScoresInputPanel />}
      {activeTab === 'profiles' && <ProfilesPanel />}
    </div>
  );
}

function OverviewPanel() {
  const students = [
    { name: 'Alice Smith', id: '22-12345', score: '95', status: 'High', color: 'green' },
    { name: 'Bob Johnson', id: '22-12346', score: '82', status: 'Average', color: 'yellow' },
    { name: 'Charlie Davis', id: '22-12347', score: '65', status: 'Low', color: 'red' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Student Roster</h2>
      <div className="space-y-4">
        {students.map((student, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#bc1313]/20 text-[#bc1313] font-bold flex items-center justify-center">
                {student.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                student.color === 'green' ? 'bg-green-50 text-green-600 border-green-200' :
                student.color === 'yellow' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                'bg-red-50 text-red-600 border-red-200'
              }`}>
                {student.status}
              </span>
              <span className="font-bold text-gray-900 w-12 text-right">{student.score}%</span>
              <button className="text-gray-400 hover:text-gray-900 transition-colors"><MoreVertical size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoresInputPanel() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Assessment</label>
            <select className="block w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 outline-none">
              <option>Midterm Exam</option>
              <option>Quiz 1</option>
              <option>Final Project</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Type</label>
            <select className="block w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 outline-none">
              <option>Summative</option>
              <option>Formative</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-600">Max Scores:</span>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="ILO 1" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded" defaultValue={20} />
            <input type="number" placeholder="ILO 2" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded" defaultValue={30} />
            <input type="number" placeholder="ILO 3" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded" defaultValue={50} />
          </div>
        </div>
      </div>

      <div className="min-w-[800px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-3 text-sm font-bold text-gray-600">Student Name</th>
              <th className="p-3 text-center text-sm font-bold text-gray-600">ILO 1</th>
              <th className="p-3 text-center text-sm font-bold text-gray-600">ILO 2</th>
              <th className="p-3 text-center text-sm font-bold text-gray-600">ILO 3</th>
              <th className="p-3 text-right text-sm font-bold text-[#bc1313]">Proficiency</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">Student Name 0{i}</td>
                <td className="p-3 text-center"><input type="number" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center" defaultValue={18} /></td>
                <td className="p-3 text-center"><input type="number" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center" defaultValue={25} /></td>
                <td className="p-3 text-center"><input type="number" className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center" defaultValue={42} /></td>
                <td className="p-3 text-right font-bold text-[#bc1313]">85%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <Button className="bg-[#bc1313] hover:bg-[#890E0E] text-white flex items-center gap-2 px-6 py-2">
          <Save size={16} /> Submit Scores
        </Button>
      </div>
    </div>
  );
}

function ProfilesPanel() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#bc1313]/10 text-[#bc1313] font-bold flex items-center justify-center text-xl">
              S
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">Student Name {i}</p>
              <p className="text-xs text-gray-500">22-1234{i}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Performance</span>
                <span className="font-bold text-gray-900">8{i}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#bc1313] h-2 rounded-full" style={{ width: `8${i}%` }}></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Status Match</span>
              <span className="px-2 py-1 rounded bg-green-50 text-green-600 border border-green-200 text-xs font-bold">Good Standing</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
