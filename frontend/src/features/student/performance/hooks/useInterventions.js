import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../../../../services/studentService';

/**
 * useInterventions — fetch the student's saved skill interventions.
 *
 * Backed by the standalone /api/student/interventions/{id} endpoint, which is
 * regenerated automatically whenever the instructor submits new scores.
 * 404 is treated as "not yet generated" (returns interventions = []), not an
 * error — the empty state in <SkillInterventions /> handles it.
 *
 * Usage:
 *   const { interventions, updatedAt, loading, refresh, runNow } = useInterventions(studentId);
 */
export default function useInterventions(studentId) {
  const [interventions, setInterventions] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaved = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getInterventions(studentId);
      setInterventions(res.data?.interventions || []);
      setUpdatedAt(res.data?.updated_at || null);
    } catch (e) {
      // 404 = no interventions yet (e.g., scores never submitted) — not an error
      if (!e.message?.includes('404')) {
        setError(e.message);
      }
      setInterventions([]);
      setUpdatedAt(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const runNow = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.runInterventions(studentId);
      setInterventions(res.data?.interventions || []);
      setUpdatedAt(res.data?.updated_at || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  return {
    interventions,
    updatedAt,
    loading,
    error,
    refresh: fetchSaved,
    runNow,
  };
}
