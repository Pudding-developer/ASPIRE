/**
 * useCareerCoach — Transforms raw pipeline data into Career Coach UI state.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import usePipeline from '../../dashboard/hooks/usePipeline';
import useStudentData from '../../dashboard/hooks/useStudentData';
import {
  PROFICIENCY_PCT, inferCategory,
  MILESTONES_BY_CAT, CAREER_OPTIONS,
} from '../../../../data/careerConstants';
import { studentService } from '../../../../services/studentService';

/* ── Skill lookup ── */

/* Coerce a skill entry to a plain string. The pipeline sometimes emits
   matched_skills/gap_skills as objects (e.g. {name, priority}) instead of
   strings; this normalizes both shapes so downstream callers don't crash. */
function skillName(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') return String(entry.name ?? entry.skill ?? entry.title ?? '');
  return '';
}

function lookupProficiency(name, profile) {
  const lower = String(name || '').toLowerCase();
  if (!lower) return 0;
  const all = [...(profile?.technical_skills || []), ...(profile?.programming_languages || [])];
  const found = all.find(s => {
    const sn = String(s?.name || '').toLowerCase();
    if (!sn) return false;
    return sn.includes(lower) || lower.includes(sn);
  });
  return found ? (PROFICIENCY_PCT[found.proficiency] || 50) : 0;
}

/* ── Build skill list for a career match ── */

export function buildSkills(match, profile, aggregated) {
  const skills = [];
  const seen = new Set();
  (match.matched_skills || []).forEach(entry => {
    const name = skillName(entry);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const pct = Math.round(aggregated?.[name] || lookupProficiency(name, profile) || 70);
    skills.push({ name, percentage: pct, status: pct >= 70 ? 'strong' : 'developing' });
  });
  (match.gap_skills || []).forEach(entry => {
    const name = skillName(entry);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const raw = aggregated?.[name] || lookupProficiency(name, profile) || 5;
    const pct = Math.round(Math.min(raw, 35));
    skills.push({ name, percentage: pct, status: raw > 40 ? 'developing' : 'missing' });
  });
  return skills.sort((a, b) => b.percentage - a.percentage);
}

/* ── Build static gap analysis for a career not scored by the AI.
   Uses CAREER_OPTIONS.skills as the required-skills list and grades
   each against the student's current skill profile. */

export function buildStaticGaps(title, profile, aggregated) {
  const opt = CAREER_OPTIONS.find(o => o.title === title);
  if (!opt) return [];
  const seen = new Set();
  const rows = [];
  (opt.skills || []).forEach(name => {
    const key = String(name || '').toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const raw = aggregated?.[name] ?? lookupProficiency(name, profile);
    if (raw >= 70) {
      rows.push({ name, percentage: Math.round(raw), status: 'acquired' });
    } else if (raw > 0) {
      rows.push({ name, percentage: Math.round(raw), status: 'developing' });
    } else {
      rows.push({ name, percentage: 0, status: 'critical' });
    }
  });
  return rows;
}

/* ── Build gap analysis for roadmap ── */

export function buildGaps(match, profile, aggregated) {
  const gaps = [];
  const seen = new Set();
  (match.matched_skills || []).forEach(entry => {
    const name = skillName(entry);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const pct = Math.round(aggregated?.[name] || lookupProficiency(name, profile) || 70);
    gaps.push({ name, percentage: pct, status: pct >= 70 ? 'acquired' : 'developing' });
  });
  (match.gap_skills || []).forEach(entry => {
    const name = skillName(entry);
    if (!name) return;
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

  /* Selection is driven by career *title* (not array index) so the active
     selection survives across re-renders, pipeline refreshes, and pinned
     careers that the AI hasn't scored. selectedIndex is derived from it. */
  const [selectedCareerTitle, setSelectedCareerTitle] = useState(null);

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
      window.dispatchEvent(new CustomEvent('aspire_career_chosen', { detail: data.chosen_career }));
    } catch (err) {
      console.error('Failed to save career choice:', err);
    } finally {
      setCareerLoading(false);
    }
  }, []);

  /* ── Visible career cards ──────────────────────────────────────────────────
     Per-user list of career titles the student wants pinned in the cards
     row of the Career Coach. Persisted in localStorage so it survives reloads.
     Initial state defaults to the chosen career; the user can hide cards
     individually and reveal others via the "All Career Trajectories" modal. */
  const visibleStorageKey = userId ? `aspire_visible_careers_${userId}` : null;
  const [visibleCareerTitles, setVisibleCareerTitles] = useState(() => {
    if (!visibleStorageKey) return new Set();
    try {
      const raw = localStorage.getItem(visibleStorageKey);
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    if (!visibleStorageKey) return;
    try {
      localStorage.setItem(visibleStorageKey, JSON.stringify([...visibleCareerTitles]));
    } catch { /* ignore */ }
  }, [visibleCareerTitles, visibleStorageKey]);

  // When the chosen career changes, automatically pin it in the cards row.
  useEffect(() => {
    if (!chosenCareer) return;
    setVisibleCareerTitles(prev => prev.has(chosenCareer) ? prev : new Set([...prev, chosenCareer]));
  }, [chosenCareer]);

  const showCareer = useCallback((title) => {
    if (!title) return;
    setVisibleCareerTitles(prev => prev.has(title) ? prev : new Set([...prev, title]));
  }, []);

  const hideCareer = useCallback((title) => {
    if (!title) return;
    setVisibleCareerTitles(prev => {
      if (!prev.has(title)) return prev;
      const next = new Set(prev);
      next.delete(title);
      return next;
    });
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
    let best = -1;
    for (let i = 0; i < careerMatches.length; i++) {
      if (!visibleCareerTitles.has(careerMatches[i].title)) continue;
      if (best === -1 || careerMatches[i].match_score > careerMatches[best].match_score) {
        best = i;
      }
    }
    if (best !== -1) return best;
    return careerMatches.reduce((b, m, i) => m.match_score > careerMatches[b].match_score ? i : b, 0);
  }, [careerMatches, visibleCareerTitles]);

  /* Resolve the active title — falls back according to user's "unpinning" logic:
     1. If a manual selection exists AND it is still pinned, use it.
     2. Otherwise, look at the remaining pinned (visible) careers:
        - If the student has "career progression" (readiness > 0), pick the pinned career with the highest match score.
        - Otherwise (first run/zero progress), pick the "left-most" pinned career.
     3. Fallback to chosenCareer (if pinned), then optimal, then the first pinned entry. */
  const activeTitle = useMemo(() => {
    const visibleArr = [...visibleCareerTitles];
    if (visibleArr.length === 0) return null;

    // 1. Valid manual selection
    if (selectedCareerTitle && visibleCareerTitles.has(selectedCareerTitle)) {
      return selectedCareerTitle;
    }

    // 2. Find best candidate among pinned careers
    const pinnedMatches = careerMatches
      .filter(m => visibleCareerTitles.has(m.title))
      .sort((a, b) => b.match_score - a.match_score);

    const hasProgression = (progression?.career_readiness_score > 0) || (progression?.readiness_change !== 0);

    if (pinnedMatches.length > 0) {
      if (hasProgression) {
        // Pick the highest scoring pinned career
        return pinnedMatches[0].title;
      } else {
        // Pick the "left-most" pinned career that has a match score
        const firstVisibleMatch = visibleArr.find(title => careerMatches.some(m => m.title === title && visibleCareerTitles.has(title)));
        if (firstVisibleMatch) return firstVisibleMatch;
        return pinnedMatches[0].title;
      }
    }

    // 3. Fallback to the very first pinned career (even if unanalyzed)
    if (chosenCareer && visibleCareerTitles.has(chosenCareer)) return chosenCareer;
    return visibleArr[0] || null;
  }, [selectedCareerTitle, visibleCareerTitles, careerMatches, progression, chosenCareer]);

  const selectedIndex = useMemo(
    () => activeTitle ? careerMatches.findIndex(m => m.title === activeTitle) : -1,
    [activeTitle, careerMatches],
  );
  const selectedPath = selectedIndex >= 0 ? careerMatches[selectedIndex] : null;
  const category  = activeTitle ? inferCategory(activeTitle) : 'TECHNOLOGY';
  const milestones = MILESTONES_BY_CAT[category] || MILESTONES_BY_CAT['TECHNOLOGY'];

  /* Gaps/skills/insights work for any title:
     - If the AI scored the title, use that match data (rich reasoning + skills).
     - Otherwise fall back to the static CAREER_OPTIONS skill list so the
       student still sees gap analysis for unanalyzed pinned careers. */
  const gaps = useMemo(() => {
    if (selectedPath) return buildGaps(selectedPath, skillProfile, aggregatedSkills);
    if (activeTitle) return buildStaticGaps(activeTitle, skillProfile, aggregatedSkills);
    return [];
  }, [selectedPath, activeTitle, skillProfile, aggregatedSkills]);

  const skills = useMemo(() => {
    if (selectedPath) return buildSkills(selectedPath, skillProfile, aggregatedSkills);
    if (activeTitle) return buildStaticGaps(activeTitle, skillProfile, aggregatedSkills);
    return [];
  }, [selectedPath, activeTitle, skillProfile, aggregatedSkills]);

  const insights = useMemo(
    () => selectedPath ? deriveInsights(selectedPath, selectedIndex === optimalIndex) : [],
    [selectedPath, selectedIndex, optimalIndex],
  );

  // Public setter — accept a title (preferred) or an array index.
  const setSelectedIndex = useCallback((arg) => {
    if (typeof arg === 'string') { setSelectedCareerTitle(arg); return; }
    if (typeof arg === 'number' && arg >= 0 && careerMatches[arg]) {
      setSelectedCareerTitle(careerMatches[arg].title);
    }
  }, [careerMatches]);

  return {
    // Data
    loading: apiLoading,
    error,
    pipelineData,
    reportCreatedAt: report?.created_at || null,
    careerMatches,
    skillProfile,
    recommendations,
    summary,
    selectedPath,
    selectedIndex,
    setSelectedIndex,
    activeTitle,
    optimalIndex,
    category,
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
    // Visible-cards state
    visibleCareerTitles,
    showCareer,
    hideCareer,
    // Actions
    runPipeline,
    pipelineStatus,
    isRunning,
  };
}

