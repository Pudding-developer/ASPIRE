import { useState, useEffect, useCallback } from 'react';
import { instructorApi } from '../services/instructorApi';

export function useInstructorClasses() {
  const [classes, setClasses]           = useState([]);
  const [archivedClasses, setArchived]  = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRes, archivedRes, statsRes] = await Promise.all([
        instructorApi.getClasses(),
        instructorApi.getArchivedClasses(),
        instructorApi.getDashboardStats(),
      ]);
      setClasses(activeRes);
      setArchived(archivedRes);
      setStats(statsRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createClass = async (data) => {
    const newClass = await instructorApi.createClass(data);
    setClasses(prev => [...prev, newClass]);
    return newClass;
  };

  const archiveClass = async (id) => {
    await instructorApi.archiveClass(id);
    const cls = classes.find(c => c.id === id);
    setClasses(prev => prev.filter(c => c.id !== id));
    if (cls) setArchived(prev => [...prev, { ...cls, is_archived: true }]);
  };

  const deleteClass = async (id) => {
    await instructorApi.deleteClass(id);
    setClasses(prev => prev.filter(c => c.id !== id));
    setArchived(prev => prev.filter(c => c.id !== id));
  };

  return { classes, archivedClasses, stats, loading, error, createClass, archiveClass, deleteClass, refetch: fetchAll };
}
