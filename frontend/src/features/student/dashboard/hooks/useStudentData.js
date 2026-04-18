import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../../../../services/studentService';

export default function useStudentData() {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [scores, setScores] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, classesRes, scoresRes, predictionsRes] = await Promise.allSettled([
        studentService.getProfile(),
        studentService.getClasses(),
        studentService.getScores(),
        studentService.getPredictions(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      else throw new Error('Failed to load profile');

      if (classesRes.status === 'fulfilled') setClasses(classesRes.value.data || []);
      if (scoresRes.status === 'fulfilled') setScores(scoresRes.value.data || []);
      
      // Predictions might fail if no scores exist yet
      if (predictionsRes.status === 'fulfilled') {
        setPredictions(predictionsRes.value.data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derived calculations
  const globalRank = 'Top 5%'; // Placeholder or require an aggregation backend API
  
  // ILO Coverage
  const calculateILO = () => {
    if (!scores.length) return { tech: 0, analytical: 0, ethics: 0, total: 0 };
    // MOCK MAPPING: We'll map ILO 1 to Tech, 2 to Analytical, 3 to Ethics for the donut
    const ilos = [1, 2, 3];
    const grouped = { 1: [], 2: [], 3: [] };
    scores.forEach(s => {
      if (grouped[s.ilo_number]) grouped[s.ilo_number].push(s.percentage);
    });
    
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const tech = avg(grouped[1]);
    const analytical = avg(grouped[2]);
    const ethics = avg(grouped[3]);
    const total = (tech + analytical + ethics) / 3;

    // Normalise to 100% for the donut chart (the segments need to sum to 100)
    const sum = tech + analytical + ethics || 1;
    return {
      techPct: Math.round((tech / sum) * 100),
      analyticalPct: Math.round((analytical / sum) * 100),
      ethicsPct: Math.round((ethics / sum) * 100),
      totalMastery: Math.round(total)
    };
  };

  return {
    profile,
    classes,
    scores,
    predictions,
    loading,
    error,
    globalRank,
    iloCoverage: calculateILO(),
    refetch: fetchAll,
  };
}
