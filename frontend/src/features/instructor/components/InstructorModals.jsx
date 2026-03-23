import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function CreateClassModal({ isOpen, onClose, onSubmit }) {
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');

  if (!isOpen) return null;

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
        
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Subject Name</label>
            <input required type="text" placeholder="e.g. Data Structures & Algorithms" className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313] focus:ring-1 focus:ring-[#bc1313]" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Course Code</label>
            <input required type="text" placeholder="e.g. CS 201" className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-[#bc1313]" />
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
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            <Button type="submit" className="bg-[#bc1313] hover:bg-[#890E0E] text-white">Create Class</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ClassCodeModal({ isOpen, onClose, classCode = 'CS201-2026-A-XY7Z' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center relative p-8"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Code</h2>
        <p className="text-gray-500 text-sm mb-6">Share this code with your students to allow them to enroll in this class.</p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">{classCode}</span>
          <button 
            onClick={handleCopy}
            className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-200 text-gray-600 hover:text-[#bc1313]'}`}
          >
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          </button>
        </div>
        
        <Button onClick={onClose} className="w-full bg-[#bc1313] hover:bg-[#890E0E] text-white">Done</Button>
      </motion.div>
    </div>
  );
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
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
