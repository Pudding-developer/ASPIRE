import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export default function ClassDirectoryModal({ cls, onClose }) {
  useEffect(() => {
    if (!cls) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cls, onClose]);

  if (!cls) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-205.5 overflow-hidden flex flex-col h-[88vh] max-h-230 relative"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#fafaf8]">
          <div>
            <h2 className="text-[1.3rem] font-extrabold text-gray-900 leading-tight">Class Directory</h2>
            <p className="text-[13px] font-semibold text-gray-500 mt-1">{cls.course_code} - {cls.subject_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8 overflow-hidden flex-1 flex flex-col">
          {/* Instructor Block */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Instructor</p>
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl">
              {cls.instructor_avatar ? (
                <img
                  src={cls.instructor_avatar}
                  alt={cls.instructor_name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#111827] flex justify-center items-center font-bold text-[18px] text-white">
                  {(cls.instructor_name || 'I').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[16px] font-bold text-gray-900">{cls.instructor_name || 'Assigned Instructor'}</p>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">Primary Educator</p>
              </div>
            </div>
          </div>

          {/* Enrolled Students Block */}
          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Enrolled Students ({cls.classmates?.length || 0})
            </p>
            {(!cls.classmates || cls.classmates.length === 0) ? (
              <div className="py-8 text-center text-[14px] text-gray-400 border border-dashed border-gray-200 rounded-xl">
                No students have enrolled in this class yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
                {cls.classmates.map((student, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#f3f4f6] text-[#4b5563] flex justify-center items-center font-bold text-[14px] shrink-0">
                        {(student.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[15px] font-semibold text-gray-800">{student.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
