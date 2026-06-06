import React, { useState, useEffect, useRef } from 'react';
import { Search, UploadCloud, FileText, AlertTriangle, AlertCircle, CheckCircle, Info, BookOpen, Calendar } from 'lucide-react';
import { request } from '../../../services/api';

export default function CurriculumTab() {
  const [curricula, setCurricula] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  
  // Upload states
  const [customName, setCustomName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [mismatchedCourses, setMismatchedCourses] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef(null);

  // Fetch curricula metadata
  const fetchCurricula = async (selectNewId = null) => {
    try {
      setLoading(true);
      const res = await request('GET', '/admin/curriculum');
      const list = res.data || [];
      setCurricula(list);
      if (list.length > 0) {
        if (selectNewId) {
          setSelectedCurriculumId(selectNewId);
        } else if (!selectedCurriculumId || !list.find(c => c.id === selectedCurriculumId)) {
          setSelectedCurriculumId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch curricula list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects for a specific curriculum version
  const fetchSubjects = async (curriculumId) => {
    if (!curriculumId) return;
    try {
      setLoading(true);
      const res = await request('GET', `/admin/curriculum/${curriculumId}/subjects`);
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurricula();
  }, []);

  useEffect(() => {
    if (selectedCurriculumId) {
      fetchSubjects(selectedCurriculumId);
    } else {
      setSubjects([]);
    }
  }, [selectedCurriculumId]);

  // Filtered subjects
  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.code.toLowerCase().includes(search.toLowerCase()) || 
                          s.title.toLowerCase().includes(search.toLowerCase());
    const matchesYear = filterYear === 'all' || s.year === filterYear;
    const matchesSem = filterSem === 'all' || s.semester === filterSem;
    return matchesSearch && matchesYear && matchesSem;
  });

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const fn = file.name.toLowerCase();
    if (!fn.endsWith('.pdf') && !fn.endsWith('.csv') && !fn.endsWith('.json')) {
      setUploadError('Unsupported file type. Please upload a PDF, CSV, or JSON file.');
      setUploadSuccess('');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('aspire_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Build upload URL with custom name if specified
      const uploadUrl = new URL(`${API_BASE}/admin/curriculum/upload`);
      if (customName.trim()) {
        uploadUrl.searchParams.append('custom_name', customName.trim());
      }
      
      const res = await fetch(uploadUrl.toString(), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed: ${res.status}`);
      }

      const responseData = await res.json();
      const uploadData = responseData.data;

      setImportedCount(uploadData.count);
      setCustomName(''); // Reset text field
      
      if (uploadData.warnings && uploadData.warnings.length > 0) {
        setMismatchedCourses(uploadData.warnings);
        setShowWarningModal(true);
      } else {
        setUploadSuccess(`Successfully imported "${uploadData.curriculum_name}" with ${uploadData.count} subjects.`);
      }

      // Reload list and auto-select the new curriculum
      await fetchCurricula(uploadData.curriculum_id);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload curriculum.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Find metadata of selected curriculum
  const activeCurriculum = curricula.find(c => c.id === selectedCurriculumId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-[#70170f]" />
          Curriculum Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload and structure multiple academic curriculum catalogs for Computer Engineering instructors.
        </p>
      </div>

      {/* Upload Curriculum Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Upload New Curriculum Version</h2>
            <p className="text-xs text-gray-500 mb-4">
              Add a new version catalog to the system database without deleting existing ones.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Curriculum Label / Version Name
              </label>
              <input 
                type="text"
                placeholder="e.g. BSCpE Curriculum 2024-2025 (Defaults to filename)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-gray-50 text-gray-950 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#70170f] focus:bg-white transition-all font-medium"
              />
            </div>
            
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 mb-4">
              <li><strong>PDF:</strong> Syllabus program document (parsed automatically using AI).</li>
              <li><strong>CSV:</strong> Must contain columns: <code>year</code>, <code>semester</code>, <code>code</code>, <code>title</code>.</li>
              <li><strong>JSON:</strong> Array of objects matching <code>{'{'} year, semester, code, title {'}'}</code>.</li>
            </ul>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-[#70170f] bg-[#70170f]/5' 
                : 'border-gray-200 hover:border-[#70170f]/50 hover:bg-gray-50'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70170f]"></div>
                <p className="text-sm font-semibold text-gray-600">Processing file with Gemini AI...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <UploadCloud className="h-10 w-10 text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Drag and drop file here, or click to browse</p>
                <p className="text-[11px] text-gray-400">PDF, CSV, or JSON up to 10MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-xs font-medium">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3.5 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2 text-green-700 text-xs font-medium animate-in fade-in duration-250">
              <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        {/* Curriculum Stats/Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Curriculum Information</h2>
            
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Active Catalog</span>
                <span className="text-[#70170f] font-bold text-xs truncate max-w-40" title={activeCurriculum?.name}>
                  {activeCurriculum?.name || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Courses</span>
                <span className="text-gray-900 font-bold">{subjects.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">1st Year Courses</span>
                <span className="text-gray-900 font-semibold">{subjects.filter(s => s.year === '1').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">2nd Year Courses</span>
                <span className="text-gray-900 font-semibold">{subjects.filter(s => s.year === '2').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">3rd Year Courses</span>
                <span className="text-gray-900 font-semibold">{subjects.filter(s => s.year === '3').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">4th Year Courses</span>
                <span className="text-gray-900 font-semibold">{subjects.filter(s => s.year === '4').length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2.5 p-3.5 bg-[#70170f]/5 border border-[#70170f]/10 rounded-xl text-[12px] text-gray-700 leading-relaxed">
            <Info className="h-5 w-5 text-[#70170f] shrink-0 mt-0.5" />
            <p>
              Multiple curriculum uploads catalog different academic catalogs. When creating classes, Instructors select which curriculum schema to pull subject records from.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Subject list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3 items-center">
            {/* Version Select Dropdown */}
            <div className="relative w-full md:w-72">
              <select
                value={selectedCurriculumId || ''}
                onChange={(e) => setSelectedCurriculumId(Number(e.target.value))}
                className="w-full bg-[#70170f]/5 text-[#70170f] border border-[#70170f]/10 rounded-xl px-3 py-2 outline-none focus:border-[#70170f] text-sm font-bold cursor-pointer"
              >
                {curricula.map((c) => (
                  <option key={c.id} value={c.id} className="text-gray-950 font-normal">
                    {c.name}
                  </option>
                ))}
                {curricula.length === 0 && (
                  <option value="">No curricula uploaded</option>
                )}
              </select>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
              <input 
                type="text"
                placeholder="Search code or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-[#70170f] text-sm"
              />
            </div>
          </div>

          <div className="flex w-full xl:w-auto items-center gap-3">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full md:w-36 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#70170f] text-sm"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="w-full md:w-36 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#70170f] text-sm"
            >
              <option value="all">All Semesters</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
              <option value="3">Midyear</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[50vh]">
          <table className="w-full min-w-160">
            <thead className="sticky top-0 z-10 bg-[#70170f]">
              <tr>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3.5 px-6">Year</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3.5 px-6">Semester</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3.5 px-6">Course Code</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3.5 px-6">Subject Title</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-gray-900">
                  <td className="py-3 px-6 text-sm text-gray-700 font-semibold">{s.year} Year</td>
                  <td className="py-3 px-6 text-sm text-gray-700 font-semibold">
                    {s.semester === '1' ? '1st Sem' : s.semester === '2' ? '2nd Sem' : 'Midyear'}
                  </td>
                  <td className="py-3 px-6 text-sm text-[#70170f] font-bold">{s.code}</td>
                  <td className="py-3 px-6 text-sm text-gray-800 font-medium">{s.title}</td>
                </tr>
              ))}
              {filteredSubjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 text-sm font-medium">
                    {loading ? 'Loading subjects...' : 'No subjects found for this curriculum.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML Mismatch Warning Modal Popup */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Machine Learning Mismatch Warning</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Curriculum upload finished with {mismatchedCourses.length} warning(s).
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-4 pr-1 p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2">
              <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                The following subjects in the uploaded curriculum do not match the names configured in the machine learning system:
              </p>
              <div className="divide-y divide-amber-100/50">
                {mismatchedCourses.map((title, idx) => (
                  <div key={idx} className="py-2 text-[12px] text-gray-700 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {title}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              <strong>Notice:</strong> Students enrolled in these specific classes will not receive automatically generated ML skill profiles/career recommendations unless the subjects are manually mapped to ML weights by a backend engineer.
            </p>

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setUploadSuccess(`Successfully imported curriculum with ${importedCount} subjects (${mismatchedCourses.length} warnings acknowledged).`);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold transition-all shadow-md"
              >
                Acknowledge & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
