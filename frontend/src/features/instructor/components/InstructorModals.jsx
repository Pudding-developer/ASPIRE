import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

import curriculumData from '../../../data/curriculum.json';

export function CreateClassModal({ isOpen, onClose, onSubmit }) {
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter curriculum data based on selected year and semester
  const availableSubjects = curriculumData.filter(
    (s) => s.year === year && s.semester === semester
  );

  useEffect(() => {
    if (!isOpen) return;
    setYear('1'); setSemester('1'); setSelectedCourseCode(''); setSection(''); setFormError('');
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Reset selected course when filters change
  useEffect(() => {
    if (availableSubjects.length > 0) {
      setSelectedCourseCode(availableSubjects[0].code);
    } else {
      setSelectedCourseCode('');
    }
  }, [year, semester]); // We intentionally do not include availableSubjects as a dependency

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseCode) {
      setFormError('Please select a subject from the curriculum.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    
    const subject = availableSubjects.find(s => s.code === selectedCourseCode);
    
    try {
      await onSubmit({
        subject_name: subject.title,
        course_code: subject.code,
        year_level: parseInt(year),
        semester: parseInt(semester),
        section,
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create class.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Filter Year Level</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#70170f]"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Filter Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#70170f]"
              >
                <option value="1">1st Sem</option>
                <option value="2">2nd Sem</option>
                <option value="3">Midyear</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select Curriculum Subject</label>
            <select 
              value={selectedCourseCode} 
              onChange={(e) => setSelectedCourseCode(e.target.value)} 
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f]"
            >
              {availableSubjects.length === 0 && (
                <option value="" disabled>No subjects found for this term</option>
              )}
              {availableSubjects.map((subject) => (
                <option key={subject.code} value={subject.code}>
                  {subject.code} — {subject.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Class Section</label>
            <input
              required
              type="text"
              placeholder={`e.g. ${year}${semester}01, ${year}${semester}02...`}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#70170f]"
            />
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            <Button type="submit" disabled={submitting || availableSubjects.length === 0} className="bg-[#70170f] hover:bg-[#4a0e09] text-white">
              {submitting ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ClassCodeModal({ isOpen, onClose, classCode = 'ABC-123-XYZ' }) {
  const [copied, setCopied] = useState(false);
  const [isJoinEnabled, setIsJoinEnabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative"
      >
        <div className="p-6 flex items-center justify-between pb-2">
          <h2 className="text-[1.3rem] font-bold text-[#1e293b]">Class Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 pt-4">
          <div className="bg-[#f8fafc] rounded-2xl p-10 flex items-center justify-between mb-8">
            <span className="font-mono text-5xl font-bold text-[#162032] tracking-wider">{classCode}</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#334155] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          
          <div className="flex items-center justify-end gap-3 text-sm text-[#475569] font-medium">
            <span>Automatically join</span>
            <button 
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${isJoinEnabled ? 'bg-blue-500' : 'bg-[#e2e8f0]'}`}
              onClick={() => setIsJoinEnabled(!isJoinEnabled)}
            >
              <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm absolute transition-transform ${isJoinEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-500 text-sm mb-8">{message}</p>
        
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
          <Button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 text-white ${variant === 'danger' ? 'bg-[#70170f] hover:bg-[#4a0e09]' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
