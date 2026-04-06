import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function CreateClassModal({ isOpen, onClose, onSubmit }) {
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSubjectName(''); setCourseCode(''); setYear('1'); setSemester('1'); setSection(''); setFormError('');
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await onSubmit({
        subject_name: subjectName,
        course_code: courseCode,
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Subject Name</label>
            <input required type="text" placeholder="e.g. Data Structures & Algorithms" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313] focus:ring-1 focus:ring-[#bc1313]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Course Code</label>
            <input required type="text" placeholder="e.g. CS 201" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Year Level</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313]"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313]"
              >
                <option value="1">1st Sem</option>
                <option value="2">2nd Sem</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Section</label>
            <input
              required
              type="text"
              placeholder={`e.g. ${year}${semester}01, ${year}${semester}02...`}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313]"
            />
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-[#bc1313] hover:bg-[#890E0E] text-white">
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
            className={`flex-1 text-white ${variant === 'danger' ? 'bg-[#bc1313] hover:bg-[#890E0E]' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
