import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

export default function InstructorsTab({ instructors, toggleInstructor, removeInstructor }) {
  const [confirm, setConfirm] = useState(null); // { id, full_name }
  const [toast, setToast]     = useState(null); // { message, type: 'success' | 'error' }

  const thClass = 'text-left text-xs text-gray-500 font-medium uppercase tracking-wider py-3 px-4';
  const tdClass = 'py-3 px-4 text-sm text-gray-300';

  // Auto-dismiss toast after 3.5 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleRemoveConfirm = async () => {
    const { id, full_name } = confirm;
    setConfirm(null);
    const result = await removeInstructor(id);
    if (result.ok) {
      setToast({ message: `${full_name} has been removed as an instructor.`, type: 'success' });
    } else if (result.code === 'LAST_INSTRUCTOR') {
      setToast({ message: 'Cannot remove the only active instructor.', type: 'error' });
    } else {
      setToast({ message: 'Failed to remove instructor. Please try again.', type: 'error' });
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold mb-6">Instructors</h1>
        <div className="bg-[#2a1a0e] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className={thClass}>Instructor</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Registered</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map(i => (
                <tr key={i.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className={tdClass}>
                    <div className="flex items-center gap-2.5">
                      {i.avatar_url
                        ? <img src={i.avatar_url} className="w-7 h-7 rounded-full" alt="" />
                        : <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">{i.full_name[0]}</div>
                      }
                      <span className="font-medium text-white">{i.full_name}</span>
                    </div>
                  </td>
                  <td className={tdClass + ' text-gray-400'}>{i.email}</td>
                  <td className={tdClass}><StatusBadge status={i.is_active ? 'active' : 'inactive'} /></td>
                  <td className={tdClass + ' text-gray-500'}>{new Date(i.created_at).toLocaleDateString()}</td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2">
                      {/* Activate — only when inactive */}
                      {!i.is_active && (
                        <button
                          onClick={() => toggleInstructor(i.id, true)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {/* Deactivate — only when active */}
                      {i.is_active && (
                        <button
                          onClick={() => toggleInstructor(i.id, false)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      {/* Remove Role — always visible */}
                      <button
                        onClick={() => setConfirm({ id: i.id, full_name: i.full_name })}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Remove Role
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {instructors.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-600 text-sm">No instructors yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a0a00] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">Remove Instructor Role</h2>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to remove instructor access for{' '}
              <span className="text-white font-medium">{confirm.full_name}</span>?{' '}
              This cannot be undone. They will lose access to the instructor dashboard immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="flex-1 py-2 rounded-lg bg-[#cc0000] hover:bg-[#a80000] text-white text-sm font-medium transition-colors"
              >
                Remove Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl border backdrop-blur-sm ${
          toast.type === 'error'
            ? 'bg-red-950/90 border-red-500/30 text-red-300'
            : 'bg-green-950/90 border-green-500/30 text-green-300'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
