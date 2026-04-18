/**
 * useCareerCoach — Transforms raw pipeline data into Career Coach UI state.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import usePipeline from '../../dashboard/hooks/usePipeline';
import useStudentData from '../../dashboard/hooks/useStudentData';
import {
  PROFICIENCY_PCT, inferCategory,
  MARKET_DATA, MILESTONES_BY_CAT,
} from '../../../../data/careerConstants';
import { studentService } from '../../../../services/studentService';

/* ── Skill lookup ── */

function lookupProficiency(name, profile) {
  const lower = name.toLowerCase();
  const all = [...(profile?.technical_skills || []), ...(profile?.programming_languages || [])];
  const found = all.find(s => {
    const sn = s.name.toLowerCase();
    return sn.includes(lower) || lower.includes(sn);
  });
  return found ? (PROFICIENCY_PCT[found.proficiency] || 50) : 0;
}

/* ── Build skill list for a career match ── */

export function buildSkills(match, profile, aggregated) {
  const skills = [];
  const seen = new Set();
  (match.matched_skills || []).forEach(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const pct = Math.round(aggregated?.[name] || lookupProficiency(name, profile) || 70);
    skills.push({ name, percentage: pct, status: pct >= 70 ? 'strong' : 'developing' });
  });
  (match.gap_skills || []).forEach(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const raw = aggregated?.[name] || lookupProficiency(name, profile) || 5;
    const pct = Math.round(Math.min(raw, 35));
    skills.push({ name, percentage: pct, status: raw > 40 ? 'developing' : 'missing' });
  });
  return skills.sort((a, b) => b.percentage - a.percentage);
}

/* ── Build gap analysis for roadmap ── */

export function buildGaps(match, profile, aggregated) {
  const gaps = [];
  const seen = new Set();
  (match.matched_skills || []).forEach(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const pct = Math.round(aggregated?.[name] || lookupProficiency(name, profile) || 70);
    gaps.push({ name, percentage: pct, status: pct >= 70 ? 'acquired' : 'developing' });
  });
  (match.gap_skills || []).forEach(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const pct = Math.round(Math.min(aggregated?.[name] || lookupProficiency(name, profile) || 5, 35));
    gaps.push({ name, percentage: pct, status: 'critical' });
  });
  return gaps.sort((a, b) => b.percentage - a.percentage).slice(0, 6);
}

/* ── Derive AI insights ── */

export function deriveInsights(match, isOptimal) {
  const ins = [];
  if (isOptimal) {
    ins.push({ type: 'pos', text: `This is your <strong>optimal path</strong>. Your skills align directly with ${match.title} requirements.` });
  }
  if (match.matched_skills?.length) {
    const top = match.matched_skills.slice(0, 2).map(s => `<strong>${s}</strong>`).join(' and ');
    ins.push({ type: 'pos', text: `Your ${top} skills are strong matches for this career path.` });
  }
  if (match.gap_skills?.length) {
    ins.push({
      type: 'tip',
      text: `Focus on <strong>${match.gap_skills[0]}</strong> to significantly increase your readiness for this role.`,
      badge: 'High impact',
    });
  }
  if (!isOptimal) {
    ins.push({ type: 'warn', text: 'Your profile shows stronger alignment with other career paths. Bridge the skill gaps listed below to succeed here.' });
  }
  return ins;
}



/* ── Main hook ── */

export default function useCareerCoach(userId) {
  const { report, loading: apiLoading, error, runPipeline, pipelineStatus, isRunning } = usePipeline(userId);
  const { predictions } = useStudentData();

  const [selectedIndex, setSelectedIndex] = useState(0);

  // ── Career goal state ──────────────────────────────────────────────────────
  const [chosenCareer, setChosenCareerState] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);

  // On mount: restore chosen career from backend
  useEffect(() => {
    studentService.getChosenCareer()
      .then(data => { if (data?.chosen_career) setChosenCareerState(data.chosen_career); })
      .catch(() => {/* silently ignore — career choice is non-critical */});
  }, []);

  const setChosenCareer = useCallback(async (career) => {
    setCareerLoading(true);
    try {
      const data = await studentService.setChosenCareer(career);
      setChosenCareerState(data.chosen_career);
    } catch (err) {
      console.error('Failed to save career choice:', err);
    } finally {
      setCareerLoading(false);
    }
  }, []);

  const pipelineData = report?.report;
  
  const careerMatches   = useMemo(() => pipelineData?.career_matches || [], [pipelineData]);
  const skillProfile    = pipelineData?.skill_profile || {};
  const recommendations = pipelineData?.recommendations || [];
  const summary         = pipelineData?.summary || report?.summary || '';
  const aggregatedSkills = predictions?.aggregated_skills || {};

  // Agent 7 progression data
  const progression = useMemo(() => {
    const raw = pipelineData?.progression;
    if (raw && typeof raw === 'object') return raw;
    // Try parsing if stored as JSON string
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }, [pipelineData]);

  const optimalIndex = useMemo(() => {
    if (!careerMatches.length) return 0;
    return careerMatches.reduce((best, m, i) => m.match_score > careerMatches[best].match_score ? i : best, 0);
  }, [careerMatches]);

  const selectedPath = careerMatches[selectedIndex] || null;
  const category  = selectedPath ? inferCategory(selectedPath.title) : 'TECHNOLOGY';
  const market     = MARKET_DATA[category]       || MARKET_DATA['TECHNOLOGY'];
  const milestones = MILESTONES_BY_CAT[category] || MILESTONES_BY_CAT['TECHNOLOGY'];

  const gaps = useMemo(
    () => selectedPath ? buildGaps(selectedPath, skillProfile, aggregatedSkills) : [],
    [selectedPath, skillProfile, aggregatedSkills],
  );
  const skills = useMemo(
    () => selectedPath ? buildSkills(selectedPath, skillProfile, aggregatedSkills) : [],
    [selectedPath, skillProfile, aggregatedSkills],
  );
  const insights = useMemo(
    () => selectedPath ? deriveInsights(selectedPath, selectedIndex === optimalIndex) : [],
    [selectedPath, selectedIndex, optimalIndex],
  );

  return {
    // Data
    loading: apiLoading,
    error,
    pipelineData,
    careerMatches,
    skillProfile,
    recommendations,
    summary,
    selectedPath,
    selectedIndex,
    setSelectedIndex,
    optimalIndex,
    category,
    market,
    milestones,
    gaps,
    skills,
    insights,
    // Agent 7 — progression
    progression,
    // Career goal
    chosenCareer,
    setChosenCareer,
    careerLoading,
    // Actions
    runPipeline,
    pipelineStatus,
    isRunning,
  };
}

