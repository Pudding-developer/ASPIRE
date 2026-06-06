import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import { API_BASE, authHeaders } from '../../features/admin/utils';

import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

import AdminSidebar from '../../features/admin/components/AdminSidebar';
import DashboardTab from '../../features/admin/components/DashboardTab';
import InstructorsTab from '../../features/admin/components/InstructorsTab';
import TokensTab from '../../features/admin/components/TokensTab';
import GenerateTokenModal from '../../features/admin/components/GenerateTokenModal';
import StudentsTab from '../../features/admin/components/StudentsTab';
import AdvisingTab from '../../features/admin/components/AdvisingTab';
import CurriculumTab from '../../features/admin/components/CurriculumTab';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    if (!token) { setUnauthorized(true); return; }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.role !== 'admin') setUnauthorized(true);
    } catch { setUnauthorized(true); }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: authHeaders(token) });
    const data = await res.json();
    setStats(data.data);
  }, [token]);

  const fetchInstructors = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/instructors`, { headers: authHeaders(token) });
    const data = await res.json();
    setInstructors(data.data || []);
  }, [token]);

  const fetchTokens = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/admin/tokens`, { headers: authHeaders(token) });
    const data = await res.json();
    setTokens(data.data || []);
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'instructors' || tab === 'students' || tab === 'advising') fetchInstructors(); }, [tab, fetchInstructors]);
  useEffect(() => { if (tab === 'tokens') fetchTokens(); }, [tab, fetchTokens]);

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    setStudentLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: studentPage,
        limit: 10,
      });
      if (studentSearch) {
        queryParams.append('search', studentSearch);
      }
      const res = await fetch(`${API_BASE}/admin/students?${queryParams.toString()}`, {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setStudentTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setStudentLoading(false);
    }
  }, [token, studentPage, studentSearch]);

  useEffect(() => {
    if (tab === 'students') {
      fetchStudents();
    }
  }, [tab, fetchStudents]);

  const handleAssignAdvisor = useCallback(async (studentId, advisorId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/students/${studentId}/advisor`, {
        method: 'PUT',
        headers: {
          ...authHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advisor_id: advisorId }),
      });
      if (res.ok) {
        fetchStudents();
      } else {
        console.error("Failed to assign advisor:", await res.json());
      }
    } catch (err) {
      console.error("Failed to assign advisor:", err);
    }
  }, [token, fetchStudents]);

  const toggleInstructor = async (id, activate) => {
    const endpoint = activate ? 'activate' : 'deactivate';
    await fetch(`${API_BASE}/admin/instructors/${id}/${endpoint}`, {
      method: 'PATCH', headers: authHeaders(token),
    });
    fetchInstructors();
  };

  const removeInstructor = async (id) => {
    const res = await fetch(`${API_BASE}/admin/instructors/${id}`, {
      method: 'DELETE', headers: authHeaders(token),
    });
    if (res.ok) {
      // Remove from local state immediately — no refetch needed
      setInstructors(prev => prev.filter(i => i.id !== id));
      return { ok: true };
    }
    const errorCode = res.headers.get('X-Error-Code');
    return { ok: false, code: errorCode };
  };

  const deleteToken = async (id) => {
    const res = await fetch(`${API_BASE}/admin/tokens/${id}`, {
      method: 'DELETE', headers: authHeaders(token),
    });
    if (res.ok) fetchTokens();
  };

  return (
    <div className="h-screen w-full bg-[#fdf2f2] flex flex-row overflow-hidden text-gray-900 font-inter">
      <AdminSidebar tab={tab} setTab={setTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-8">
          {tab === 'dashboard' && <DashboardTab stats={stats} />}
          {tab === 'students' && (
            <StudentsTab
              students={students}
              page={studentPage}
              setPage={setStudentPage}
              totalPages={studentTotalPages}
              search={studentSearch}
              setSearch={setStudentSearch}
              loading={studentLoading}
              instructors={instructors}
              onAssignAdvisor={handleAssignAdvisor}
            />
          )}
          {tab === 'instructors' && <InstructorsTab instructors={instructors} toggleInstructor={toggleInstructor} removeInstructor={removeInstructor} />}
          {tab === 'advising' && (
            <AdvisingTab
              token={token}
              instructors={instructors}
              onAssignAdvisor={handleAssignAdvisor}
            />
          )}
          {tab === 'tokens' && <TokensTab tokens={tokens} setShowGenerateModal={setShowGenerateModal} deleteToken={deleteToken} />}
          {tab === 'curriculum' && <CurriculumTab />}
        </div>
      </main>

      {showGenerateModal && !unauthorized && (
        <GenerateTokenModal
          token={token}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={fetchTokens}
        />
      )}

      <AnimatePresence>
        {unauthorized && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-100 bg-[#0a0101] border border-red-500/20 shadow-[0_0_40px_rgba(255,0,0,0.15)] rounded-2xl p-8 z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 text-sm mb-8">
                You have to login as admin to access this page.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#cc0000] hover:bg-[#ff4444] text-white py-3 text-sm font-medium rounded-lg transition-colors shadow-lg"
              >
                Go to Homepage
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
