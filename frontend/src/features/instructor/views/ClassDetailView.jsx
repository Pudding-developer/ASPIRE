import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MoreVertical, Save, Copy, Archive, Trash2, Users, Code, BarChart2, ClipboardCheck, Edit2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { instructorApi } from '../../../services/instructorApi';

export default function ClassDetailView({ classId, classData, onBack, onShowCode, onArchive, onDelete }) {
  const [activeTab, setActiveTab] = useState('profiles');
  const [lastTabBeforeScores, setLastTabBeforeScores] = useState('profiles');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);

  const openScoresTab = (assessmentId = null) => {
    if (activeTab !== 'scores') {
      setLastTabBeforeScores(activeTab);
    }
    setEditingAssessmentId(assessmentId);
    setActiveTab('scores');
  };

  const resolvedClassId = useMemo(() => {
    if (classData?.id) return classData.id;
    if (typeof classId === 'number') return classId;
    if (typeof classId === 'string' && classId.startsWith('class-')) {
      const parsed = Number(classId.replace('class-', ''));
      return Number.isNaN(parsed) ? null : parsed;
    }
    const parsed = Number(classId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [classData?.id, classId]);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      if (!resolvedClassId) {
        setStudents([]);
        return;
      }
      setStudentsLoading(true);
      try {
        const response = await instructorApi.getClassStudents(resolvedClassId);
        if (!cancelled) {
          setStudents(response?.data || []);
        }
      } catch {
        if (!cancelled) {
          setStudents([]);
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false);
        }
      }
    };

    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [resolvedClassId]);

  const subjectName = classData?.subject_name || '—';
  const courseCode  = classData ? `${classData.course_code} - ${classData.section}` : '—';

  return (
    <>
      {activeTab === 'scores' ? (
        <div className="p-8">
          {/* Back Button */}
          <button 
            onClick={() => setActiveTab(lastTabBeforeScores || 'profiles')}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#0f172a] transition-colors mb-4 font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <h1 className="text-[2rem] font-bold text-[#1e293b] mb-8">
            {editingAssessmentId ? 'Edit Assessment Scores' : 'Input Assessment Scores'}
          </h1>
          
          <ScoresInputPanel classId={resolvedClassId} editingAssessmentId={editingAssessmentId} students={students} studentsLoading={studentsLoading} onSuccess={() => setActiveTab('submitted')} />
        </div>
      ) : (
        <div className="p-8">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6 text-[15px] font-medium"
          >
            <ArrowLeft size={18} /> Back to Classes
          </button>

          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-[2.5rem] tracking-tight font-extrabold text-[#111827] mb-1">{subjectName}</h1>
              <p className="text-[#6b7280] text-[19px]">{courseCode}</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Button onClick={onArchive} variant="outline" className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 bg-white px-5 py-[10px] font-bold text-[15px] shadow-sm rounded-lg flex items-center justify-center h-auto transition-colors">
                <Archive size={18} className="mr-2" /> Archive
              </Button>
              <Button onClick={onDelete} className="bg-[#70170f] hover:bg-[#4a0e09] text-white px-5 py-[10px] font-bold text-[15px] shadow-sm rounded-lg flex items-center justify-center h-auto transition-colors">
                <Trash2 size={18} className="mr-2" /> Delete Class
              </Button>
            </div>
          </div>

          {/* Sub-nav */}
          <div className="flex items-center gap-8 mb-8 border-b border-gray-200 border-opacity-70">
            <button 
              onClick={() => setActiveTab('profiles')}
              className={`pb-3 flex items-center gap-3 text-[16px] font-semibold transition-colors border-b-2
                ${activeTab === 'profiles' ? 'border-[#70170f] text-[#70170f]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <Users size={18} /> Profiles
            </button>
            <button 
              onClick={onShowCode}
              className="pb-3 flex items-center gap-3 text-[16px] font-semibold transition-colors border-b-2 border-transparent text-[#6b7280] hover:text-[#374151]"
            >
              <Code size={18} /> Class Code
            </button>
            <button 
              onClick={() => openScoresTab(null)}
              className={`pb-3 flex items-center gap-3 text-[16px] font-semibold transition-colors border-b-2
                ${activeTab === 'scores' ? 'border-[#70170f] text-[#70170f]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <BarChart2 size={18} /> Assessment Scoring
            </button>
            <button 
              onClick={() => setActiveTab('submitted')}
              className={`pb-3 flex items-center gap-3 text-[16px] font-semibold transition-colors border-b-2
                ${activeTab === 'submitted' ? 'border-[#70170f] text-[#70170f]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              <ClipboardCheck size={18} /> Submitted Assessments
            </button>
          </div>

          {/* Dynamic Panels */}
          {activeTab === 'profiles' && <ProfilesPanel students={students} studentsLoading={studentsLoading} />}
          {activeTab === 'submitted' && <SubmittedAssessmentsPanel classId={resolvedClassId} onEdit={(id) => openScoresTab(id)} />}
        </div>
      )}
    </>
  );
}



function formatNameLastFirst(fullName = '') {
  const clean = fullName.trim();
  if (!clean) return '—';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(' ');
  return `${lastName}, ${firstNames}`;
}

function ScoresInputPanel({ classId, editingAssessmentId, students = [], studentsLoading = false, onSuccess }) {
  const [numILOs, setNumILOs] = useState(4);
  const iloRange = Array.from({ length: numILOs }, (_, i) => i + 1);

  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentType, setAssessmentType] = useState('Summative');
  const [iloTotals, setIloTotals] = useState({ 1: 50, 2: 50, 3: 50, 4: 50 });
  const [studentScores, setStudentScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!editingAssessmentId || !classId) {
      setAssessmentName('');
      setAssessmentType('Summative');
      setNumILOs(4);
      setIloTotals({ 1: 50, 2: 50, 3: 50, 4: 50 });
      setStudentScores({});
      return;
    }
    
    let cancelled = false;
    const fetchAssessment = async () => {
      try {
        const res = await instructorApi.getClassAssessmentDetails(classId, editingAssessmentId);
        if (cancelled) return;
        const data = res.data;
        setAssessmentName(data.name);
        setAssessmentType(data.type);
        
        const ilos = data.ilos || {};
        const maxIlo = Math.max(...Object.keys(ilos).map(Number), 0) || 4;
        setNumILOs(Math.max(maxIlo, 3));
        setIloTotals(ilos);
        setStudentScores(data.scores || {});
      } catch (err) {
        console.error("Failed to load assessment", err);
      }
    };
    fetchAssessment();
    return () => { cancelled = true; };
  }, [editingAssessmentId, classId]);

  const handleScoreChange = (studentId, ilo, val) => {
    setStudentScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [ilo]: val === '' ? '' : Number(val)
      }
    }));
  };

  const handleIloTotalChange = (ilo, val) => {
    setIloTotals(prev => ({
      ...prev,
      [ilo]: val === '' ? '' : Number(val)
    }));
  };

  const handleSubmit = async () => {
    if (!assessmentName.trim()) {
      setErrorMsg('Please enter an assessment name.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      name: assessmentName.trim(),
      type: assessmentType,
      ilos: Object.fromEntries(
        iloRange.map(i => [i, Number(iloTotals[i]) || 0])
      ),
      scores: {}
    };

    students.forEach(student => {
      payload.scores[student.id] = Object.fromEntries(
        iloRange.map(i => [i, Number(studentScores[student.id]?.[i]) || 0])
      );
    });

    try {
      if (editingAssessmentId) {
        await instructorApi.updateAssessmentScores(classId, editingAssessmentId, payload);
      } else {
        await instructorApi.submitAssessmentScores(classId, payload);
      }
      // Reset form on success
      setAssessmentName('');
      setStudentScores({});
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit scores.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Inputs */}
      <div className="flex gap-6 mb-8 w-full">
        <div className="flex-1 space-y-2">
          <label className="text-[15px] font-semibold text-[#475569] tracking-wide">Assessment Name</label>
          <input 
            type="text"
            value={assessmentName}
            onChange={(e) => setAssessmentName(e.target.value)}
            placeholder="e.g. Midterm Exam"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[16px] outline-none text-[#1e293b] shadow-sm focus:border-[#70170f] transition-colors"
          />
        </div>
        <div className="w-1/3 space-y-2">
          <label className="text-[15px] font-semibold text-[#475569] tracking-wide">Type</label>
          <div className="relative">
            <select 
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
              className="block w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-[16px] outline-none text-[#1e293b] appearance-none shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
            >
              <option value="Summative">Summative</option>
              <option value="Formative">Formative</option>
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
          <h3 className="text-xl font-extrabold text-[#1e293b]">Set ILO Totals (for all students)</h3>
          <div className="flex items-center gap-3 text-[16px] flex-row">
            <span className="text-[#64748b] font-medium mr-1 tracking-wide">Number of ILOs:</span>
            <span className={`font-semibold transition-colors ${numILOs === 3 ? 'text-[#64748b]' : 'text-gray-400'}`}>3 ILOs</span>
            <button 
              className="w-[42px] h-6 rounded-full bg-[#70170f] flex items-center relative transition-colors px-1 cursor-pointer hover:bg-[#4a0e09]"
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
              <label className="text-[15px] font-bold tracking-wide text-[#64748b]">ILO {i} Total</label>
              <input 
                type="number" 
                value={iloTotals[i]}
                onChange={(e) => handleIloTotalChange(i, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-[10px] text-[16px] outline-none focus:border-[#70170f] text-[#1e293b] font-medium transition-colors hover:border-gray-300 mt-1 shadow-sm" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {studentsLoading ? (
          <p className="text-gray-400 text-[16px] text-center py-8">Loading enrolled students...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-400 text-[16px] text-center py-8">No students enrolled yet. Share the class code for students to join.</p>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr>
                <th className="p-5 border-b border-r border-[#e2e8f0] bg-white w-80" rowSpan={2}>
                  <span className="text-[16px] font-extrabold text-[#111827] flex justify-center">Name</span>
                </th>
                {iloRange.map(i => (
                  <th key={i} colSpan={2} className="p-4 text-center border-b border-[#e2e8f0] bg-white border-r last:border-r-0">
                    <span className="text-[16px] font-extrabold text-[#111827]">ILO {i}</span>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0] bg-white">
                {iloRange.map(i => (
                  <React.Fragment key={i}>
                    <th className="py-3 px-1.5 text-center text-[14px] font-semibold text-[#6b7280] border-r border-[#e2e8f0] w-20">Score</th>
                    <th className="py-3 px-1.5 text-center text-[14px] font-semibold text-[#6b7280] border-r border-[#e2e8f0] last:border-r-0 w-20">Proficiency</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student.id || idx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="p-5 font-semibold text-[#1f2937] text-[16px] border-r border-[#e2e8f0] leading-snug">
                    <span className="block wrap-break-word">{formatNameLastFirst(student.full_name)}</span>
                  </td>
                  {iloRange.map(i => {
                    const score = studentScores[student.id]?.[i] ?? '';
                    const maxScore = iloTotals[i] || 1;
                    const pct = score === '' ? 0 : Math.round((Number(score) / maxScore) * 100);
                    return (
                      <React.Fragment key={i}>
                        <td className="p-2 text-center border-r border-[#e2e8f0] bg-white align-middle">
                          <input 
                            type="number" 
                            value={score}
                            onChange={(e) => handleScoreChange(student.id, i, e.target.value)}
                            className="w-16 h-9 px-2 py-1 text-[15px] border border-gray-200 rounded-lg text-center mx-auto block outline-none focus:border-[#70170f] font-medium text-[#111827] hover:border-gray-300 transition-colors shadow-sm" 
                          />
                        </td>
                        <td className="p-2 text-center text-[15px] font-semibold text-[#9ca3af] border-r border-[#e2e8f0] last:border-r-0 bg-[#f9fafb] align-middle">
                          {pct}%
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {errorMsg && <p className="text-red-500 font-medium text-sm mt-4 text-right">{errorMsg}</p>}

      {/* Action Button */}
      <div className="mt-8 flex justify-end">
        <button 
          disabled={submitting}
          onClick={handleSubmit}
          className="bg-[#70170f] hover:bg-[#4a0e09] disabled:bg-gray-400 text-white font-medium py-[10px] px-8 rounded-lg shadow-sm transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit Scores'}
        </button>
      </div>
    </div>
  );
}

function ProfilesPanel({ students = [], studentsLoading = false }) {

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <h2 className="text-[1.25rem] font-bold text-[#1f2937] mb-6">Enrolled Students ({students.length})</h2>
      {studentsLoading ? (
        <p className="text-gray-400 text-[16px] text-center py-8">Loading enrolled students...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-400 text-[16px] text-center py-8">No students enrolled yet. Share the class code for students to join.</p>
      ) : (
        <div className="space-y-4">
          {students.map((student, i) => (
            <div key={student.id || i} className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
              <div className="flex items-center gap-6">
                <div className="w-[50px] h-[50px] rounded-full bg-[#fef2f2] text-[#70170f] font-bold text-xl flex items-center justify-center overflow-hidden">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name || 'Student'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    style={{ display: student.avatar_url ? 'none' : 'flex' }}
                    className="w-full h-full items-center justify-center"
                  >
                    {student.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-[#111827] text-[17px]">{student.full_name}</p>
                  <p className="text-[15px] text-[#6b7280]">{student.sr_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="px-[14px] py-[6px] rounded-full text-[13px] font-bold mr-4 bg-[#dbeafe] text-[#1e40af]">
                  Enrolled
                </span>
                <span className="font-semibold text-[0.9rem] text-[#6b7280] text-right tracking-tight">
                  {student.email}
                </span>
                <button className="text-[#9ca3af] hover:text-gray-600 transition-colors ml-4"><MoreVertical size={24} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmittedAssessmentsPanel({ classId, onEdit }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await instructorApi.getClassAssessments(classId);
        if (!cancelled) setAssessments(res.data || []);
      } catch (e) {
        console.error("Failed to load assessments", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [classId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment? This will immediately affect student dashboard metrics.")) return;
    try {
      await instructorApi.deleteAssessment(classId, id);
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert("Failed to delete assessment");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-[1.25rem] font-bold text-[#1f2937]">Submitted Assessments ({assessments.length})</h2>
      </div>
      <div className="p-8 pt-6">
        {loading ? (
          <p className="text-gray-400 text-[16px] text-center py-4">Loading history...</p>
        ) : assessments.length === 0 ? (
          <p className="text-gray-400 text-[16px] text-center py-4">No assessments submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, i) => (
              <div key={assessment.id || i} className="flex items-center justify-between p-6 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex flex-col gap-[6px]">
                  <h3 className="font-bold text-[#1e293b] text-[17px]">{assessment.name}</h3>
                  <p className="text-[15px] text-[#6b7280]">Date Submitted: {new Date(assessment.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => onEdit(assessment.id)} className="flex items-center gap-2 px-[18px] py-[8px] bg-white border border-gray-200 text-[#475569] text-[15px] font-bold rounded-[8px] hover:bg-gray-50 hover:text-[#1e293b] transition-all shadow-sm">
                    <Edit2 size={16} className="opacity-80" /> Edit
                  </button>
                  <button onClick={() => handleDelete(assessment.id)} className="flex items-center gap-2 px-[14px] py-[8px] bg-white border border-red-200 text-[#70170f] text-[15px] font-bold rounded-[8px] hover:bg-red-50 transition-all shadow-sm">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
