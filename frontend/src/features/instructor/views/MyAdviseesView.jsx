import { useState, useEffect } from 'react';
import { Search, User, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import useAuth from '../../auth/hooks/useAuth';

export default function MyAdviseesView({ onSelectAdvisee }) {
  const { token } = useAuth();
  const [advisees, setAdvisees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAdvisees() {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${apiBase}/api/instructor/advisees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdvisees(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch advisees:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdvisees();
  }, [token]);

  const filteredAdvisees = advisees.filter(a => 
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.sr_code?.toLowerCase().includes(search.toLowerCase()) ||
    (a.chosen_career && a.chosen_career.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 w-full">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <GraduationCap className="text-[#70170f] w-8 h-8" />
            My Advisees
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and review academic and professional performance for your assigned student advisees.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search advisees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#70170f] focus:ring-1 focus:ring-[#70170f] text-sm shadow-sm transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-[#70170f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading advisees roster...</p>
        </div>
      ) : filteredAdvisees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvisees.map((advisee) => (
            <div 
              key={advisee.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* User Header */}
                <div className="flex items-center gap-4 mb-4">
                  {advisee.avatar_url ? (
                    <img 
                      src={advisee.avatar_url} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-50" 
                      alt={advisee.full_name} 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#fcf5f5] border border-red-100 flex items-center justify-center text-[#70170f] font-bold text-lg">
                      {advisee.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 leading-snug">{advisee.full_name || '—'}</h3>
                    <code className="text-xs text-gray-400 font-mono">{advisee.sr_code}</code>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-6 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Email</span>
                    <span className="text-gray-700 truncate max-w-[200px]" title={advisee.email}>{advisee.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Chosen Career</span>
                    <span className="text-[#70170f] font-semibold truncate max-w-[200px]">
                      {advisee.chosen_career || 'Not Chosen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Action */}
              <button
                onClick={() => onSelectAdvisee(advisee.id)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#70170f] hover:bg-[#4a0e09] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer"
              >
                View Profile Insights
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <User className="mx-auto w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No advisees found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {search ? "No advisees match your search criteria. Try a different query." : "You have not been assigned as an advisor to any students yet."}
          </p>
        </div>
      )}
    </div>
  );
}
