import { useState, useEffect } from 'react';
import { Search, Users, X, GripVertical, Check, AlertCircle } from 'lucide-react';

export default function AdvisingTab({ token, instructors = [], onAssignAdvisor }) {
  const [localStudents, setLocalStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [activeDropInstructorId, setActiveDropInstructorId] = useState(null);
  const [isHoveredDirectoryDrop, setIsHoveredDirectoryDrop] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      setLoadingStudents(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiBase}/admin/students?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLocalStudents(data.students || []);
        }
      } catch (err) {
        console.error("Failed to load students for advising board:", err);
      } finally {
        setLoadingStudents(false);
      }
    }
    if (token) {
      loadStudents();
    }
  }, [token]);

  // Drag & Drop handlers
  const handleDragStart = (e, studentId) => {
    e.dataTransfer.setData('text/plain', studentId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverInstructor = (e, instructorId) => {
    e.preventDefault();
    setActiveDropInstructorId(instructorId);
  };

  const handleDragLeaveInstructor = () => {
    setActiveDropInstructorId(null);
  };

  const handleDropOnInstructor = async (e, instructorId) => {
    e.preventDefault();
    setActiveDropInstructorId(null);
    const studentIdStr = e.dataTransfer.getData('text/plain');
    if (!studentIdStr) return;
    const studentId = parseInt(studentIdStr);
    
    // Optimistic Update
    setLocalStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, advisor_id: instructorId } : s
    ));

    // Backend save
    try {
      await onAssignAdvisor(studentId, instructorId);
    } catch (err) {
      console.error("Failed to assign advisor:", err);
    }
  };

  const handleDragOverDirectory = (e) => {
    e.preventDefault();
    setIsHoveredDirectoryDrop(true);
  };

  const handleDragLeaveDirectory = () => {
    setIsHoveredDirectoryDrop(false);
  };

  const handleDropOnDirectory = async (e) => {
    e.preventDefault();
    setIsHoveredDirectoryDrop(false);
    const studentIdStr = e.dataTransfer.getData('text/plain');
    if (!studentIdStr) return;
    const studentId = parseInt(studentIdStr);

    const student = localStudents.find(s => s.id === studentId);
    if (student && student.advisor_id === null) return; // Already unassigned

    // Optimistic Update
    setLocalStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, advisor_id: null } : s
    ));

    // Backend save
    try {
      await onAssignAdvisor(studentId, null);
    } catch (err) {
      console.error("Failed to unassign advisor:", err);
    }
  };

  const handleUnassignClick = async (studentId) => {
    setLocalStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, advisor_id: null } : s
    ));
    try {
      await onAssignAdvisor(studentId, null);
    } catch (err) {
      console.error("Failed to unassign advisor:", err);
    }
  };

  // Filter students based on search and selected filter toggle
  const filteredStudents = localStudents.filter(s => {
    const matchesSearch = 
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.sr_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    
    if (filterUnassigned) {
      return matchesSearch && s.advisor_id === null;
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)] overflow-hidden">
      {/* LEFT COLUMN: Advisors & Assigned Students */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Advising Map</h1>
          <p className="mt-1 text-sm text-gray-500">Manage instructor advising loads using drag-and-drop assignments.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
          {instructors.map((inst) => {
            const assigned = localStudents.filter(s => s.advisor_id === inst.id);
            const isTarget = activeDropInstructorId === inst.id;

            return (
              <div
                key={inst.id}
                onDragOver={(e) => handleDragOverInstructor(e, inst.id)}
                onDragLeave={handleDragLeaveInstructor}
                onDrop={(e) => handleDropOnInstructor(e, inst.id)}
                className={`flex flex-col bg-white border rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-200 ${
                  isTarget 
                    ? 'border-[#70170f] bg-[#fdf2f2] scale-[1.03] ring-4 ring-[#70170f]/10 shadow-md' 
                    : 'border-[#eed7d3] hover:border-gray-300'
                }`}
              >
                {/* Advisor Info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate">{inst.full_name}</h3>
                    <p className="text-xs text-gray-600 truncate mt-0.5" title={inst.email}>{inst.email}</p>
                  </div>
                  <span className="bg-[#70170f] text-white font-extrabold text-[10px] px-3 py-1 rounded-full shrink-0 shadow-sm ml-2">
                    {assigned.length} {assigned.length === 1 ? 'Advisee' : 'Advisees'}
                  </span>
                </div>

                {/* Advisee drop area or list */}
                <div className="flex-1 flex flex-col justify-start min-h-[200px] bg-[#fcf7f7] rounded-2xl p-4 border-2 border-dashed border-[#ecd5d2]">
                  {assigned.length > 0 ? (
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {assigned.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-white border border-[#eed7d3] p-3 rounded-xl text-sm shadow-xs hover:border-[#70170f] hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} className="w-7 h-7 rounded-full border border-gray-100 object-cover" alt="" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#fcf5f5] flex items-center justify-center text-[10px] font-black text-[#70170f] border border-[#eed7d3] shrink-0">
                                {(student.full_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold text-gray-900 truncate text-xs leading-none mb-1">{student.full_name}</p>
                              <code className="text-[10px] text-gray-600 font-bold font-mono leading-none">{student.sr_code}</code>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignClick(student.id)}
                            className="text-gray-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                            title="Unassign Advisee"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <Users className="w-8 h-8 text-[#70170f]/30 mb-2" />
                      <p className="text-xs font-bold text-gray-600">No Advisees Assigned</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Drag students here to map</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Students Directory (Draggable Cards List) */}
      <div 
        onDragOver={handleDragOverDirectory}
        onDragLeave={handleDragLeaveDirectory}
        onDrop={handleDropOnDirectory}
        className={`w-full lg:w-[360px] bg-white border rounded-3xl p-6 flex flex-col shadow-md shrink-0 transition-all duration-200 ${
          isHoveredDirectoryDrop 
            ? 'border-2 border-dashed border-[#70170f] bg-[#fdf2f2] scale-[0.99]' 
            : 'border-[#eed7d3]'
        }`}
      >
        <div className="mb-4">
          <h3 className="font-black text-gray-900 text-lg flex items-center justify-between">
            Students Directory
            {isHoveredDirectoryDrop && (
              <span className="text-[10px] bg-[#70170f] text-white font-black px-2.5 py-1 rounded-md tracking-wider uppercase shadow-xs animate-pulse">
                Drop to Unassign
              </span>
            )}
          </h3>
          <p className="text-xs font-semibold text-gray-500 mt-1 leading-relaxed">
            Drag cards onto advisors. Drag cards back here to unassign them.
          </p>
        </div>

        {/* Search & Filter Toggles */}
        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 border border-[#eed7d3] rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#70170f] focus:ring-2 focus:ring-[#70170f]/15 text-sm shadow-2xs transition-all font-medium"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setFilterUnassigned(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                !filterUnassigned 
                  ? 'bg-[#70170f] text-white border-[#70170f] shadow-sm' 
                  : 'bg-white text-gray-700 border-[#eed7d3] hover:bg-[#fcf5f5] hover:text-[#70170f]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnassigned(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                filterUnassigned 
                  ? 'bg-[#70170f] text-white border-[#70170f] shadow-sm' 
                  : 'bg-white text-gray-700 border-[#eed7d3] hover:bg-[#fcf5f5] hover:text-[#70170f]'
              }`}
            >
              Unassigned Only
            </button>
          </div>
        </div>

        {/* Students List Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <div className="w-7 h-7 border-3 border-[#70170f] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold">Loading directory...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((s) => {
              const currentAdvisor = instructors.find(inst => inst.id === s.advisor_id);

              return (
                <div
                  key={s.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, s.id)}
                  className="flex items-center justify-between border border-[#eed7d3] p-4 rounded-2xl bg-white shadow-xs hover:border-[#70170f] hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-grab active:cursor-grabbing group select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical size={16} className="text-gray-300 group-hover:text-[#70170f]/60 transition-colors shrink-0" />
                    
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 text-xs truncate max-w-[190px]">{s.full_name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <code className="text-[10px] text-gray-600 font-bold font-mono leading-none">{s.sr_code}</code>
                        {currentAdvisor ? (
                          <span 
                            className="bg-[#fcf5f5] text-[#70170f] font-bold text-[9px] px-2 py-0.5 rounded-md border border-[#eed7d3] truncate max-w-[110px]" 
                            title={`Advisor: ${currentAdvisor.full_name}`}
                          >
                            {currentAdvisor.full_name}
                          </span>
                        ) : (
                          <span className="bg-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md border border-amber-600/10 shadow-3xs">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-gray-500">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold">No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
