import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function DashboardView({ onCreateClass }) {
  return (
    <div className="p-8">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Portal</h1>
          <p className="text-gray-600 mt-1">Welcome back, Professor</p>
        </div>
        <Button 
          onClick={onCreateClass}
          className="bg-[#bc1313] hover:bg-[#890E0E] text-white flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Create Class
        </Button>
      </div>

      {/* Filters Row */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <select className="bg-white border border-gray-300 text-gray-900 rounded-lg p-3 outline-none focus:border-[#bc1313] focus:ring-1 focus:ring-[#bc1313]">
          <option>All Class Years</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
        <select className="bg-white border border-gray-300 text-gray-900 rounded-lg p-3 outline-none focus:border-[#bc1313] focus:ring-1 focus:ring-[#bc1313]">
          <option>All Semesters</option>
          <option>First Semester</option>
          <option>Second Semester</option>
          <option>Midterm</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Students', value: '142' },
          { label: 'Active Courses', value: '4' },
          { label: 'School Year', value: '2025-2026' },
          { label: 'Avg Performance', value: '87.5%' },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#bc1313]/30 transition-all cursor-default"
          >
            <p className="text-gray-500 text-sm mb-2">{stat.label}</p>
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Lists Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Performing */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-gray-900 mb-4 shrink-0">Top Performing Students</h3>
          <div className="overflow-y-auto max-h-64 pr-2 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={`top-${i}`} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                <span className="font-medium text-gray-800">Alice Smith {i}</span>
                <span className="text-green-600 font-bold">9{i}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* At Risk */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-gray-900 mb-4 shrink-0">Students at Risk</h3>
          <div className="overflow-y-auto max-h-64 pr-2 space-y-3">
            {[1,2,3].map(i => (
              <div key={`risk-${i}`} className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
                <span className="font-medium text-gray-800">Bob Johnson {i}</span>
                <span className="text-red-600 font-bold">6{i}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Class Representatives */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-gray-900 mb-4 shrink-0">Class Representatives</h3>
          <div className="overflow-y-auto max-h-64 pr-2 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={`rep-${i}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <span className="font-medium text-gray-800">Charlie Davis {i}</span>
                <span className="text-gray-500 text-sm">CS20{i}-A</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
