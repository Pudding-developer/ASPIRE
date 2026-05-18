import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

export default function InstructorsTab({ instructors, toggleInstructor, removeInstructor }) {
  const [confirm, setConfirm] = useState(null); // { id, full_name }
  const [toast, setToast]     = useState(null); // { message, type: 'success' | 'error' }

  const thClass = 'text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-3 px-4';
  const tdClass = 'py-3.5 px-4 text-sm text-gray-300';

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
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Instructors</h1>
          <p className="mt-1 text-sm text-gray-500">Manage activation, deactivation, and access role assignments.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-230">
              <thead className="sticky top-0 z-10 bg-[#70170f]">
              <tr>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Instructor</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Email</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Registered</th>
                <th className="text-left text-[11px] text-white font-bold uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
              </thead>
              <tbody>
              {instructors.map(i => (
                <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2.5">
                      {i.avatar_url
                        ? <img src={i.avatar_url} className="w-7 h-7 rounded-full border border-gray-100" alt="" />
                        : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">{i.full_name[0]}</div>
                      }
                      <span className="font-bold text-gray-900">{i.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-600">{i.email}</td>
                  <td className="py-3.5 px-4 text-sm"><StatusBadge status={i.is_active ? 'active' : 'inactive'} /></td>
                  <td className="py-3.5 px-4 text-sm text-gray-500 font-medium">{new Date(i.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {!i.is_active && (
                        <button
                          onClick={() => toggleInstructor(i.id, true)}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {i.is_active && (
                        <button
                          onClick={() => toggleInstructor(i.id, false)}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ id: i.id, full_name: i.full_name })}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Remove Role
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {instructors.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm font-medium">No instructors registered yet.</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Remove Instructor Role</h2>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-8">
              Are you sure you want to remove instructor access for{' '}
              <strong className="text-gray-900">{confirm.full_name}</strong>?{' '}
              This action will immediately revoke their dashboard privileges.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-[13px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#70170f] hover:bg-[#5a120c] text-white text-[13px] font-bold transition-all shadow-md"
              >
                Remove Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-100 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border backdrop-blur-sm ${
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
