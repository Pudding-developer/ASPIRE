import { RotateCcw, Trash2, Users } from 'lucide-react';

export default function ArchivedClassesView({ classes = [], onRestore, onDelete }) {
  if (classes.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh] text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Archived Classes</h2>
        <p className="text-gray-500">Classes you archive will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Archived Classes</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium">
              Archived on {cls.archived_at ? new Date(cls.archived_at).toLocaleDateString() : '—'}
            </div>
            <div className="mb-8 mt-2">
              <h3 className="text-xl font-bold text-gray-400 mb-1">{cls.subject_name}</h3>
              <p className="text-gray-500 text-sm">{cls.course_code} — Section {cls.section}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <Users size={16} />
                <span>{cls.student_count ?? 0} Students</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRestore(cls.id); }}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                  title="Restore Class"
                >
                  <RotateCcw size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(cls.id); }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  title="Delete Permanently"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
