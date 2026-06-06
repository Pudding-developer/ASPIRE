import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Save, Copy, Archive, Trash2, Users, Code, BarChart2, ClipboardCheck, Edit2, Download, Upload, ClipboardList, FileUp, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import SearchInput from '../../../components/ui/SearchInput';
import { instructorApi } from '../../../services/instructorApi';

export default function ClassDetailView({ classId, classData, onBack, onShowCode, onArchive, onDelete, onClassRepChanged }) {
  const [activeTab, setActiveTab] = useState('profiles');
  const [lastTabBeforeScores, setLastTabBeforeScores] = useState('profiles');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [initialStudentSearch, setInitialStudentSearch] = useState('');
  const [partialAssessments, setPartialAssessments] = useState([]);
  const [csvModal, setCsvModal] = useState(null); // null | { assessments, unmatched, matched, total }
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvToast, setCsvToast] = useState(null);
  const csvFileRef = useRef(null);

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

  const fetchPartial = useCallback(() => {
    if (!resolvedClassId) return;
    instructorApi.getClassAssessments(resolvedClassId)
      .then(res => {
        const partial = (res?.data || []).filter(a => a.is_partial);
        setPartialAssessments(partial);
      })
      .catch(err => console.error('Failed to load assessment coverage', err));
  }, [resolvedClassId]);

  useEffect(() => {
    fetchPartial();
  }, [fetchPartial]);

  const missingByStudent = useMemo(() => {
    const map = new Map();
    for (const a of partialAssessments) {
      for (const sid of (a.ungraded_student_ids || [])) {
        if (!map.has(sid)) map.set(sid, []);
        map.get(sid).push(a);
      }
    }
    return map;
  }, [partialAssessments]);

  const missingAssessments = useMemo(() => {
    return students
      .map(student => {
        const missing = missingByStudent.get(student.id);
        return missing?.length ? { student, missing } : null;
      })
      .filter(Boolean);
  }, [students, missingByStudent]);

  const openScoresTab = (assessmentId = null, search = '') => {
    if (activeTab !== 'scores') {
      setLastTabBeforeScores(activeTab);
    }
    setEditingAssessmentId(assessmentId);
    setInitialStudentSearch(search);
    setActiveTab('scores');
  };

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
          
          <ScoresInputPanel 
            classId={resolvedClassId} 
            classData={classData} 
            editingAssessmentId={editingAssessmentId} 
            students={students} 
            studentsLoading={studentsLoading} 
            onSuccess={() => {
              fetchPartial();
              setActiveTab('submitted');
            }}
            initialSearch={initialStudentSearch}
            onImportCsvClick={() => csvFileRef.current?.click()}
          />
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
          {activeTab === 'profiles' && (
            <ProfilesPanel
              students={students}
              studentsLoading={studentsLoading}
              assessments={classData?.assessments || []}
              scores={classData?.scores || []}
              classId={resolvedClassId}
              onEditAssessment={openScoresTab}
              missingAssessments={missingAssessments}
              missingByStudent={missingByStudent}
              onToggleClassRep={async (studentId, nextValue) => {
                try {
                  await instructorApi.setClassRep(resolvedClassId, studentId, nextValue);
                  setStudents(prev => prev.map(s =>
                    s.id === studentId ? { ...s, is_class_rep: nextValue } : s
                  ));
                  onClassRepChanged?.();
                } catch (err) {
                  console.error('Failed to update class representative', err);
                }
              }}
            />
          )}
          {activeTab === 'submitted' && (
            <SubmittedAssessmentsPanel 
              classId={resolvedClassId} 
              onEdit={openScoresTab}
              missingAssessments={missingAssessments}
            />
          )}
        </div>
      )}

      {/* Hidden CSV file input */}
      <input
        ref={csvFileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (file.size > CSV_MAX_BYTES) {
            setCsvToast({ type: 'error', message: `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed is ${CSV_MAX_BYTES / 1024 / 1024} MB.` });
            return;
          }
          const nameCheck = validateCsvFilename(file.name, classData);
          if (nameCheck.error) {
            setCsvToast({ type: 'error', message: nameCheck.error });
            return;
          }
          try {
            const text = await file.text();
            const result = parseBatchCSV(text, students);
            if (result.error) {
              setCsvToast({ type: 'error', message: result.error });
              return;
            }
            if (result.assessments.length === 0) {
              setCsvToast({ type: 'error', message: 'No valid assessments found in this CSV.' });
              return;
            }
            setCsvModal(result);
          } catch (err) {
            setCsvToast({ type: 'error', message: `Failed to read file: ${err.message}` });
          }
        }}
      />

      {/* CSV toast */}
      {csvToast && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm border rounded-xl shadow-lg px-4 py-3 text-sm font-medium flex items-start justify-between gap-3
          ${csvToast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
          style={{ animation: 'fadeIn .2s ease' }}
        >
          <span>{csvToast.message}</span>
          <button onClick={() => setCsvToast(null)} className="opacity-60 hover:opacity-100 leading-none">
            <X size={14} />
          </button>
        </div>
      )}

      {/* CSV import modal */}
      {csvModal && (
        <CSVImportModal
          result={csvModal}
          classId={resolvedClassId}
          importing={csvImporting}
          onClose={() => setCsvModal(null)}
          onConfirm={async () => {
            setCsvImporting(true);
            try {
              await instructorApi.csvImportAssessments(resolvedClassId, {
                assessments: csvModal.assessments,
              });
              setCsvModal(null);
              setCsvToast({ type: 'success', message: `${csvModal.assessments.length} assessment(s) imported successfully.` });
              fetchPartial();
              setActiveTab('submitted');
            } catch (err) {
              setCsvToast({ type: 'error', message: err.message || 'Import failed.' });
            } finally {
              setCsvImporting(false);
            }
          }}
        />
      )}
    </>
  );
}

// ── CSV helpers ────────────────────────────────────────────────────────────────

const CSV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function normalizeAlnum(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function validateCsvFilename(filename, classData) {
  if (!classData) return { error: 'Class info not loaded yet — please try again.' };
  const base = filename.replace(/\.[^.]+$/, '');
  const norm = normalizeAlnum(base);
  const courseCode = normalizeAlnum(classData.course_code);
  const subjectName = normalizeAlnum(classData.subject_name);

  const matchesCourseCode = courseCode && norm.includes(courseCode);
  const matchesSubjectName = subjectName && norm.includes(subjectName);

  if (matchesCourseCode || matchesSubjectName) return { ok: true };
  return {
    error: `Filename "${filename}" does not match this class. Expected the filename to contain the course code "${classData.course_code}" or the course title "${classData.subject_name}".`,
  };
}

function parseRawCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines.map(line => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  });
}

function parseBatchCSV(text, students) {
  const allRows = parseRawCSV(text);

  // Find SR-CODE header row (Col A, case-insensitive, ignores spaces/dashes)
  const srRowIdx = allRows.findIndex(
    row => (row[0] || '').replace(/[\s\-_]/g, '').toUpperCase() === 'SRCODE'
  );
  if (srRowIdx === -1) {
    return { error: 'Could not find an "SR-CODE" header row in this file. Make sure Col A of the header row says "SR-CODE".' };
  }

  // Row 1 — assessment names, forward-fill across blank (merged) cells
  const nameRow = allRows[srRowIdx];
  const assessmentNames = [];
  let lastName = '';
  for (let c = 1; c < nameRow.length; c++) {
    const cell = (nameRow[c] || '').trim();
    if (cell) lastName = cell;
    assessmentNames.push(lastName);
  }

  // Row 2 — ILO labels e.g. "ILO 1", "ILO 2"
  const iloLabelRow = allRows[srRowIdx + 1] || [];
  const iloNumbers = [];
  for (let c = 1; c < iloLabelRow.length; c++) {
    const m = (iloLabelRow[c] || '').match(/ILO\s*(\d+)/i);
    iloNumbers.push(m ? parseInt(m[1], 10) : null);
  }

  // Row 3 — Total ILO (max scores)
  const maxScoreRow = allRows[srRowIdx + 2] || [];
  const maxScores = [];
  for (let c = 1; c < maxScoreRow.length; c++) {
    const v = parseFloat((maxScoreRow[c] || '').trim());
    maxScores.push(isNaN(v) ? null : v);
  }

  // Build per-column map
  const colCount = Math.max(assessmentNames.length, iloNumbers.length, maxScores.length);
  const colMap = [];
  for (let c = 0; c < colCount; c++) {
    const hasAll = assessmentNames[c] && iloNumbers[c] != null && maxScores[c] != null;
    colMap.push(hasAll ? { assessment: assessmentNames[c], ilo: iloNumbers[c], max: maxScores[c] } : null);
  }

  // Reject max_score <= 0
  for (let c = 0; c < colMap.length; c++) {
    const col = colMap[c];
    if (col && !(col.max > 0)) {
      return { error: `Max score for "${col.assessment}" ILO ${col.ilo} must be greater than 0 (got ${col.max}).` };
    }
  }

  // Reject duplicate ILO numbers within the same assessment
  const seenIlosByAssessment = new Map();
  for (const col of colMap) {
    if (!col) continue;
    if (!seenIlosByAssessment.has(col.assessment)) seenIlosByAssessment.set(col.assessment, new Set());
    const set = seenIlosByAssessment.get(col.assessment);
    if (set.has(col.ilo)) {
      return { error: `Duplicate ILO ${col.ilo} found in assessment "${col.assessment}". Each ILO number must appear only once per assessment.` };
    }
    set.add(col.ilo);
  }

  // Student lookup by sr_code
  const bySrCode = new Map(students.map(s => [(s.sr_code || '').trim().toLowerCase(), s]));

  const assessmentMap = new Map(); // name -> { ilos:{}, scores:{} }
  const unmatched = [];
  let matched = 0;

  for (let r = srRowIdx + 3; r < allRows.length; r++) {
    const row = allRows[r];
    if (!row || !row.some(c => c !== '')) continue;
    const rawCode = (row[0] || '').trim();
    if (!rawCode) continue;

    const student = bySrCode.get(rawCode.toLowerCase());
    if (!student) { unmatched.push(rawCode); continue; }
    matched++;

    for (let c = 0; c < colMap.length; c++) {
      const col = colMap[c];
      if (!col) continue;
      const raw = (row[c + 1] || '').trim();
      if (raw === '') continue;
      const score = parseFloat(raw);
      if (isNaN(score)) {
        return { error: `Invalid score for ${rawCode} on "${col.assessment}" ILO ${col.ilo} (row ${r + 1}): "${raw}" is not a number.` };
      }
      if (score < 0) {
        return { error: `Negative score for ${rawCode} on "${col.assessment}" ILO ${col.ilo} (row ${r + 1}): ${score}. Scores must be ≥ 0.` };
      }
      if (score > col.max) {
        return { error: `Score for ${rawCode} on "${col.assessment}" ILO ${col.ilo} (row ${r + 1}) is ${score}, which exceeds the max of ${col.max}.` };
      }
      if (!assessmentMap.has(col.assessment)) assessmentMap.set(col.assessment, { ilos: {}, scores: {} });
      const a = assessmentMap.get(col.assessment);
      a.ilos[col.ilo] = col.max;
      if (!a.scores[student.id]) a.scores[student.id] = {};
      a.scores[student.id][col.ilo] = score;
    }
  }

  const assessments = Array.from(assessmentMap.entries()).map(([name, d]) => ({
    name,
    type: 'Summative',
    ilos: d.ilos,
    scores: d.scores,
  }));

  return { assessments, unmatched, matched, total: students.length };
}

// ── CSV Import Modal ───────────────────────────────────────────────────────────

function CSVImportModal({ result, importing, onClose, onConfirm }) {
  const { assessments, unmatched, matched, total } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileUp size={22} className="text-[#1e3a5f]" />
            <h2 className="text-xl font-extrabold text-[#111827]">CSV Import Preview</h2>
          </div>
          <button onClick={onClose} disabled={importing} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          {/* Match summary */}
          <div className={`flex items-center gap-3 rounded-xl px-5 py-4 border text-sm font-semibold
            ${matched === total ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {matched === total
              ? <CheckCircle2 size={18} />
              : <AlertTriangle size={18} />}
            <span>
              {matched} of {total} enrolled students matched by SR-Code.
              {unmatched.length > 0 && ` ${unmatched.length} unmatched — their rows will be skipped.`}
            </span>
          </div>

          {/* Unmatched list */}
          {unmatched.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-amber-700 font-semibold mb-2">
                Unmatched SR-Codes ({unmatched.length})
              </summary>
              <ul className="ml-4 mt-2 space-y-1 text-amber-800 text-xs">
                {unmatched.slice(0, 20).map((code, i) => <li key={i}>• {code}</li>)}
                {unmatched.length > 20 && <li className="opacity-60">…and {unmatched.length - 20} more</li>}
              </ul>
            </details>
          )}

          {/* Assessments table */}
          <div>
            <h3 className="text-[15px] font-extrabold text-[#1e293b] mb-3">
              Assessments to Import ({assessments.length})
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[#374151]">Assessment Name</th>
                    <th className="px-4 py-3 font-bold text-[#374151]">ILOs</th>
                    <th className="px-4 py-3 font-bold text-[#374151]">Max Scores</th>
                    <th className="px-4 py-3 font-bold text-[#374151] text-right">Students Scored</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a, i) => {
                    const iloEntries = Object.entries(a.ilos).sort((x, y) => x[0] - y[0]);
                    const scoredCount = Object.keys(a.scores).length;
                    return (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-[#111827]">{a.name}</td>
                        <td className="px-4 py-3 text-[#475569]">
                          {iloEntries.map(([n]) => `ILO ${n}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-[#475569]">
                          {iloEntries.map(([, v]) => v).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1e3a5f]">{scoredCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Assessments with the same name already in this class will be <strong>updated</strong> (scores overwritten). New assessments will be created. All defaults to <strong>Summative</strong>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-6 py-[10px] rounded-xl border border-gray-200 text-[#374151] font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={importing || assessments.length === 0}
            className="px-6 py-[10px] rounded-xl bg-[#1e3a5f] hover:bg-[#152d4a] text-white font-semibold text-sm transition-colors disabled:bg-gray-400 flex items-center gap-2"
          >
            {importing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <FileUp size={16} /> Import {assessments.length} Assessment{assessments.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
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

function ScoresInputPanel({ classId, classData, editingAssessmentId, students = [], studentsLoading = false, onSuccess, initialSearch = '', onImportCsvClick }) {
  const [activeILOs, setActiveILOs] = useState([1, 2, 3, 4]);
  const iloRange = useMemo(() => [...activeILOs].sort((a, b) => a - b), [activeILOs]);

  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentType, setAssessmentType] = useState('Summative');
  const [iloTotals, setIloTotals] = useState({ 1: 50, 2: 50, 3: 50, 4: 50 });
  const [studentScores, setStudentScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [studentSearch, setStudentSearch] = useState(initialSearch);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.full_name || '').toLowerCase().includes(q));
  }, [students, studentSearch]);

  const ungradedStudentIds = useMemo(() => {
    if (!editingAssessmentId || !students.length) return new Set();
    const hasAnyScore = (sid) => {
      const scores = studentScores[sid] || {};
      return iloRange.some(i => {
        const v = scores[i];
        return v !== '' && v != null && parseFloat(v) > 0;
      });
    };
    const anyoneGraded = students.some(s => hasAnyScore(s.id));
    if (!anyoneGraded) return new Set();
    return new Set(students.filter(s => !hasAnyScore(s.id)).map(s => s.id));
  }, [editingAssessmentId, students, studentScores, iloRange]);

  const incompleteCount = ungradedStudentIds.size;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!editingAssessmentId || !classId) {
      setAssessmentName('');
      setAssessmentType('Summative');
      setActiveILOs([1, 2, 3, 4]);
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
        const activeFromData = Object.keys(ilos).map(Number).filter(n => !isNaN(n) && n > 0);
        setActiveILOs(activeFromData.length > 0 ? activeFromData : [1, 2, 3, 4]);
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

  const toastStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  return (
    <div className="w-full relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm border rounded-xl shadow-lg px-4 py-3 text-sm font-medium ${toastStyles[toast.type] || toastStyles.error}`}>
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="text-current opacity-60 hover:opacity-100 leading-none">×</button>
          </div>
        </div>
      )}
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
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((num) => {
              const isActive = activeILOs.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => {
                    setActiveILOs(prev => {
                      if (isActive) {
                        // Don't allow removing the last one
                        if (prev.length <= 1) return prev;
                        return prev.filter(i => i !== num);
                      } else {
                        return [...prev, num];
                      }
                    });
                  }}
                  className={`w-10 h-10 rounded-lg font-bold transition-all shadow-sm border ${
                    isActive
                      ? 'bg-[#70170f] text-white border-[#70170f]'
                      : 'bg-white text-[#64748b] border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              );
            })}
            <span className="text-[#64748b] font-medium ml-2 tracking-wide">Select ILOs to Grade</span>
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

      {/* Students table header (with bulk-import CTAs) */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          <h3 className="text-xl font-extrabold text-[#1e293b] whitespace-nowrap">
            Students {students.length > 0 && (
              <span className="text-[#64748b] font-semibold">
                {studentSearch ? `(${filteredStudents.length} of ${students.length})` : `(${students.length})`}
              </span>
            )}
          </h3>
          <SearchInput
            value={studentSearch}
            onChange={setStudentSearch}
            placeholder="Search students by name..."
            className="max-w-xs flex-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={onImportCsvClick}
            disabled={students.length === 0}
            className="bg-[#1e3a5f] hover:bg-[#152d4a] disabled:bg-gray-400 text-white px-5 py-[10px] font-bold text-[15px] shadow-sm rounded-lg flex items-center justify-center h-auto transition-colors"
          >
            <FileUp size={18} className="mr-2" /> Import CSV
          </Button>
        </div>
      </div>
      {incompleteCount > 0 && (
        <details className="mb-3 text-sm" open>
          <summary className="text-amber-700 cursor-pointer select-none">
            {incompleteCount} {incompleteCount === 1 ? 'student has' : 'students have'} not received scores for this assessment yet
          </summary>
          <ul className="mt-2 ml-4 space-y-1 text-[13px] text-amber-800">
            {students
              .filter(s => ungradedStudentIds.has(s.id))
              .map(s => (
                <li key={s.id}>
                  <span className="font-medium">{formatNameLastFirst(s.full_name)}</span>
                </li>
              ))}
          </ul>
        </details>
      )}

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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={1 + iloRange.length * 2} className="text-center text-gray-400 text-[15px] py-8">
                    No students match "{studentSearch}".
                  </td>
                </tr>
              ) : filteredStudents.map((student, idx) => {
                const isUngraded = ungradedStudentIds.has(student.id);
                return (
                  <tr key={student.id || idx} className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 ${isUngraded ? 'bg-amber-50/40' : ''}`}>
                    <td className="p-5 font-semibold text-[#1f2937] text-[16px] border-r border-[#e2e8f0] leading-snug">
                      <div className="flex items-center gap-2">
                        {isUngraded && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                            title="No scores submitted for this student yet"
                          />
                        )}
                        <span className="block wrap-break-word">{formatNameLastFirst(student.full_name)}</span>
                        {isUngraded && (
                          <span className="ml-auto text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5 whitespace-nowrap">
                            not graded yet
                          </span>
                        )}
                      </div>
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
                            className="w-16 h-9 px-2 py-1 text-[15px] border border-gray-200 rounded-lg text-center mx-auto block outline-none focus:border-[#70170f] hover:border-gray-300 font-medium text-[#111827] transition-colors shadow-sm"
                          />
                        </td>
                        <td className="p-2 text-center text-[15px] font-semibold text-[#9ca3af] border-r border-[#e2e8f0] last:border-r-0 bg-[#f9fafb] align-middle">
                          {pct}%
                        </td>
                      </React.Fragment>
                    );
                  })}
                  </tr>
                );
              })}
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

function MissingAssessmentsSidebar({ missingAssessments, onEditAssessment, missingCount, highlightedStudentId }) {
  return (
    <div className="w-full lg:w-[400px] shrink-0">
      <div className="bg-[#fdf2f2] border border-red-100 rounded-2xl p-6 shadow-sm sticky top-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-[#70170f] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#70170f] animate-pulse" />
            Student with Missing Assessments
          </h3>
          <span className="bg-[#70170f] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
            {missingCount}
          </span>
        </div>

        {missingCount === 0 ? (
          <div className="bg-white/50 border border-red-50 rounded-xl p-8 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-red-200 mb-3" />
            <p className="text-red-900/60 font-bold text-sm">All students are graded!</p>
            <p className="text-red-900/40 text-[11px] mt-1">Excellent work keeping up with submissions.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 custom-scrollbar">
            {missingAssessments.map(({ student, missing }) => {
              const isHighlighted = highlightedStudentId === student.id;
              return (
                <div 
                  key={student.id} 
                  id={`sidebar-student-${student.id}`}
                  className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group duration-500 ${
                    isHighlighted 
                      ? 'bg-red-50 border-red-400 ring-2 ring-red-400 ring-offset-2 scale-[1.02]' 
                      : 'bg-white border-red-100'
                  }`}
                >
                  <div className="mb-3">
                    <p className="text-[15px] font-extrabold text-[#111827] truncate">{student.full_name}</p>
                    <p className="text-[12px] font-semibold text-[#64748b]">{student.sr_code}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missing.map(assessment => (
                      <button 
                        key={assessment.id}
                        onClick={() => onEditAssessment?.(assessment.id, student.full_name)}
                        className="bg-red-50 hover:bg-[#70170f] text-[#70170f] hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-100 transition-all flex items-center gap-2 group/btn"
                      >
                        <BarChart2 size={12} />
                        <span className="truncate max-w-[200px]">{assessment.name || 'Assessment'}</span>
                        <span className="text-[9px] opacity-60 font-black ml-auto group-hover/btn:opacity-100">MISSING SCORE</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-red-200/50">
          <p className="text-[11px] text-red-900/50 font-bold uppercase tracking-wider leading-relaxed">
            Click on an assessment to automatically navigate and input scores for that student.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfilesPanel({ students = [], studentsLoading = false, classId, onToggleClassRep, onEditAssessment, missingAssessments = [], missingByStudent = new Map() }) {
  const [search, setSearch] = useState('');
  const [filterOption, setFilterOption] = useState('all'); // 'all' | 'completed' | 'missing'
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuContainerRef = useRef(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleStudentClick = (studentId) => {
    setHighlightedStudentId(studentId);
    setTimeout(() => {
      const el = document.getElementById(`sidebar-student-${studentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedStudentId(null);
    }, 3000);
  };

  useEffect(() => {
    if (openMenuId == null) return;
    const handler = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const { completedCount, missingCountUnique } = useMemo(() => {
    let completed = 0;
    let missing = 0;
    students.forEach(s => {
      const studentMissing = missingByStudent.get(s.id) || [];
      if (studentMissing.length > 0) {
        missing++;
      } else {
        completed++;
      }
    });
    return { completedCount: completed, missingCountUnique: missing };
  }, [students, missingByStudent]);

  const filtered = useMemo(() => {
    let result = students;

    // Filter by grade status
    if (filterOption === 'completed') {
      result = result.filter(s => {
        const studentMissing = missingByStudent.get(s.id) || [];
        return studentMissing.length === 0;
      });
    } else if (filterOption === 'missing') {
      result = result.filter(s => {
        const studentMissing = missingByStudent.get(s.id) || [];
        return studentMissing.length > 0;
      });
    }

    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter(s => (s.full_name || '').toLowerCase().includes(q));
  }, [students, search, filterOption, missingByStudent]);

  const missingCount = missingAssessments.length;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Main Column: Enrolled Students */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm w-full">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="text-[1.5rem] font-extrabold text-[#111827] whitespace-nowrap">
              Enrolled Students {students.length > 0 && (
                <span className="text-[#64748b] font-semibold ml-2">
                  {search || filterOption !== 'all' ? `(${filtered.length} of ${students.length})` : `(${students.length})`}
                </span>
              )}
            </h2>
            {students.length > 0 && (
              <div className="flex bg-gray-50 border border-gray-200/80 p-1 rounded-xl gap-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setFilterOption('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterOption === 'all'
                      ? 'bg-white text-[#70170f] shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOption('completed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterOption === 'completed'
                      ? 'bg-white text-emerald-700 shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-emerald-600 hover:bg-white/50'
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOption('missing')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterOption === 'missing'
                      ? 'bg-white text-[#70170f] shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-red-600 hover:bg-white/50'
                  }`}
                >
                  Missing ({missingCountUnique})
                </button>
              </div>
            )}
          </div>
          {students.length > 0 && (
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search students by name..."
              className="max-w-xs flex-1"
            />
          )}
        </div>

        {studentsLoading ? (
          <p className="text-gray-400 text-[16px] text-center py-12">Loading enrolled students...</p>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-[16px]">No students enrolled yet.</p>
            <p className="text-gray-400 text-sm mt-1">Share the class code for students to join.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-[16px] text-center py-12">No students match "{search}".</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((student, i) => {
              const studentMissing = missingByStudent.get(student.id) || [];
              return (
              <div 
                key={student.id || i} 
                onClick={() => {
                  if (studentMissing.length > 0) {
                    handleStudentClick(student.id);
                  }
                }}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all bg-white group ${
                  studentMissing.length > 0 
                    ? 'cursor-pointer hover:border-red-200 hover:shadow-sm' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#fef2f2] text-[#70170f] font-bold text-xl flex items-center justify-center overflow-hidden border border-[#fecaca]">
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
                  <div className="flex flex-col gap-0.5">
                    <p className="font-extrabold text-[#111827] text-[17px] group-hover:text-[#70170f] transition-colors">{student.full_name}</p>
                    <p className="text-[14px] font-medium text-[#6b7280]">{student.sr_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {studentMissing.length > 0 && (
                    <span
                      className="px-[12px] py-[5px] rounded-full text-[11px] font-bold bg-red-50 text-[#70170f] border border-red-100"
                      title={`Missing scores for: ${studentMissing.map(a => a.name).join(', ')}`}
                    >
                      {studentMissing.length} {studentMissing.length === 1 ? 'missing grade' : 'missing grades'}
                    </span>
                  )}
                  {student.is_class_rep && (
                    <span className="px-[12px] py-[5px] rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                      Class Rep
                    </span>
                  )}
                  <span className="px-[14px] py-[6px] rounded-full text-[12px] font-bold bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
                    Enrolled
                  </span>
                  <span className="font-semibold text-[14px] text-[#64748b] hidden md:block">
                    {student.email}
                  </span>
                  <div className="relative ml-2" ref={openMenuId === student.id ? menuContainerRef : null}>
                    <button
                      onClick={() => setOpenMenuId(prev => prev === student.id ? null : student.id)}
                      className="p-2 text-[#9ca3af] hover:text-[#111827] hover:bg-gray-100 rounded-lg transition-all"
                      aria-label="Student actions"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === student.id && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-20 animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={() => {
                            onToggleClassRep?.(student.id, !student.is_class_rep);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#475569] hover:bg-gray-50 hover:text-[#111827] transition-colors"
                        >
                          {student.is_class_rep ? 'Remove as Class Representative' : 'Appoint as Class Representative'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Column: Missing Assessments */}
      <MissingAssessmentsSidebar 
        missingAssessments={missingAssessments} 
        onEditAssessment={onEditAssessment} 
        missingCount={missingCount} 
        highlightedStudentId={highlightedStudentId}
      />
    </div>
  );
}

function SubmittedAssessmentsPanel({ classId, onEdit, missingAssessments = [] }) {
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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm w-full overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-[1.5rem] font-extrabold text-[#111827]">Submitted Assessments ({assessments.length})</h2>
        </div>
        <div className="p-8 pt-6">
          {loading ? (
            <p className="text-gray-400 text-[16px] text-center py-12">Loading history...</p>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-[16px]">No assessments submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment, i) => {
                const ungraded = assessment.ungraded_student_ids?.length || 0;
                const total = assessment.total_enrolled || 0;
                return (
                  <div key={assessment.id || i} className={`flex items-center justify-between p-6 rounded-2xl border bg-white transition-all shadow-sm hover:shadow-md group ${ungraded > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-[#1e293b] text-[18px] group-hover:text-[#70170f] transition-colors">{assessment.name}</h3>
                        {ungraded > 0 && (
                          <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-3 py-1 shadow-sm uppercase tracking-tight">
                            {ungraded} {ungraded === 1 ? 'missing grade' : 'missing grades'}
                          </span>
                        )}
                        {ungraded === 0 && total > 0 && (
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-3 py-1 shadow-sm uppercase tracking-tight">
                            All graded
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-medium text-[#64748b]">Date Submitted: {new Date(assessment.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => onEdit(assessment.id)} className="flex items-center gap-2 px-[20px] py-[10px] bg-white border border-gray-200 text-[#475569] text-[14px] font-extrabold rounded-xl hover:bg-gray-50 hover:text-[#111827] transition-all shadow-sm">
                        <Edit2 size={16} /> Edit
                      </button>
                      <button onClick={() => handleDelete(assessment.id)} className="flex items-center gap-2 px-[16px] py-[10px] bg-white border border-red-100 text-[#70170f] text-[14px] font-extrabold rounded-xl hover:bg-red-50 transition-all shadow-sm">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <MissingAssessmentsSidebar 
        missingAssessments={missingAssessments} 
        onEditAssessment={onEdit} 
        missingCount={missingAssessments.length} 
      />
    </div>
  );
}
