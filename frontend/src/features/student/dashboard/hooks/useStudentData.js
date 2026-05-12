import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../../../../services/studentService';

export default function useStudentData(filters = {}) {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [archivedClasses, setArchivedClasses] = useState([]);
  const [scores, setScores] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, classesRes, archivedClassesRes, scoresRes, predictionsRes] = await Promise.allSettled([
        studentService.getProfile(),
        studentService.getClasses(),
        studentService.getArchivedClasses(),
        studentService.getScores(),
        studentService.getPredictions(filters),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      else throw new Error('Failed to load profile');

      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.data || []);
      if (archivedClassesRes.status === 'fulfilled') setArchivedClasses(archivedClassesRes.value.data || []);
      if (scoresRes.status === 'fulfilled') setScores(scoresRes.value.data || []);
      
      if (predictionsRes.status === 'fulfilled') {
        setPredictions(predictionsRes.value.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ILO Coverage — derived from ML pipeline's SO scores (predictions.so_scores, 0–100).
  // The 13 Student Outcomes are grouped into 3 meaningful domains per the EE Curriculum Map:
  //   Technical Competency   → SO1, SO2, SO3, SO5, SO11
  //   Professional Practice  → SO4, SO6, SO7, SO8, SO9, SO12
  //   Social Responsibility  → SO10, SO13
  const calculateILO = () => {
    const so = predictions?.so_scores || {};

    const avg = (...keys) => {
      const vals = keys.map(k => so[k]).filter(v => typeof v === 'number' && isFinite(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const tech       = avg('SO1', 'SO2', 'SO3', 'SO5', 'SO11');
    const prof       = avg('SO4', 'SO6', 'SO7', 'SO8', 'SO9', 'SO12');
    const social     = avg('SO10', 'SO13');

    const total = (tech + prof + social) / 3;
    const sum   = tech + prof + social || 1;

    return {
      techPct:        Math.round((tech   / sum) * 100),
      analyticalPct:  Math.round((prof   / sum) * 100),
      ethicsPct:      Math.round((social / sum) * 100),
      totalMastery:   Math.round(total),
    };
  };

  const globalRank = 'Top 5%';

  return {
    profile,
    classes,
    archivedClasses,
    scores,
    predictions,
    loading,
    error,
    globalRank,
    iloCoverage: calculateILO(),
    refetch: fetchAll,
  };
}
