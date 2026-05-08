/**
 * careerConstants.js — Static data and helpers for the Career Coach feature.
 */

export const CIRC = 2 * Math.PI * 48; // SVG donut circumference

export const PROFICIENCY_PCT = { advanced: 90, intermediate: 65, beginner: 30 };

/* All careers a student can choose as their goal — kept in sync with backend
   VALID_CAREERS in app/api/student_routes.py. Each entry feeds the freeform
   career picker that appears before the AI report is generated. */
export const CAREER_OPTIONS = [
  {
    title: 'Full Stack Developer',
    blurb: 'Build complete web products end-to-end — frontend, backend, and database.',
    skills: ['React', 'Node.js / Python', 'PostgreSQL', 'REST APIs'],
    roadmap: 'https://roadmap.sh/full-stack',
  },
  {
    title: 'Backend Developer',
    blurb: 'Design APIs, services, and the data layer that powers modern apps.',
    skills: ['Python / JS', 'PostgreSQL', 'Docker', 'CI/CD'],
    roadmap: 'https://roadmap.sh/backend',
  },
  {
    title: 'Frontend Developer',
    blurb: 'Craft the interfaces users actually touch — fast, accessible, beautiful.',
    skills: ['React', 'TypeScript', 'CSS', 'Accessibility'],
    roadmap: 'https://roadmap.sh/frontend',
  },
  {
    title: 'DevOps Engineer',
    blurb: 'Automate deployments, run reliable infra, and keep production healthy.',
    skills: ['Linux', 'Docker', 'Kubernetes', 'AWS / GCP'],
    roadmap: 'https://roadmap.sh/devops',
  },
  {
    title: 'Data Scientist',
    blurb: 'Turn raw data into models, insights, and decisions that move the business.',
    skills: ['Python', 'pandas', 'SQL', 'Statistics'],
    roadmap: 'https://roadmap.sh/ai-data-scientist',
  },
  {
    title: 'AI Engineer',
    blurb: 'Ship LLM-powered products — RAG, agents, prompt design, and evals.',
    skills: ['Python', 'LLMs', 'Vector DBs', 'MLOps'],
    roadmap: 'https://roadmap.sh/ai-engineer',
  },
  {
    title: 'Cybersecurity',
    blurb: 'Defend systems and people — pentesting, incident response, and beyond.',
    skills: ['Networking', 'Linux', 'SIEM', 'Pentesting'],
    roadmap: 'https://roadmap.sh/cyber-security',
  },
  {
    title: 'Machine Learning',
    blurb: 'Build and deploy ML systems that learn from data at production scale.',
    skills: ['Python', 'PyTorch / TF', 'Feature Eng.', 'MLOps'],
    roadmap: 'https://roadmap.sh/machine-learning',
  },
  {
    title: 'Software Architect',
    blurb: 'Design the large-scale shape of systems — services, data, and tradeoffs.',
    skills: ['System Design', 'Distributed Systems', 'Cloud', 'Security'],
    roadmap: 'https://roadmap.sh/software-architect',
  },
  {
    title: 'QA Engineer',
    blurb: 'Build the test infrastructure that lets teams ship fast without breaking things.',
    skills: ['Test Automation', 'CI/CD', 'API Testing', 'Performance'],
    roadmap: 'https://roadmap.sh/qa',
  },
];

export const TABS = [
  { id: 'roadmap',  label: 'Roadmap' },
  { id: 'insights', label: 'Insights' },
  { id: 'chat',     label: 'AI Chat' },
];


export const MILESTONES_BY_CAT = {
  'ENGINEERING': [
    { name: 'Core Curriculum',     sub: 'Years 1-2 Foundation',            status: 'done' },
    { name: 'Digital Electronics', sub: 'CpE 410, Logic Circuits',         status: 'done' },
    { name: 'Microprocessors Lab', sub: 'CpE 417, HDL (In Progress)',      status: 'current' },
    { name: 'Embedded Systems',    sub: 'CpE 428, Capstone',              status: 'pending' },
    { name: 'Capstone & OJT',     sub: 'CpE 430, ENGG 417',              status: 'pending' },
  ],
  'DATA SCIENCE': [
    { name: 'Core Curriculum', sub: 'Years 1-2 Foundation',                    status: 'done' },
    { name: 'Math & Statistics', sub: 'MATH 403, Data Analysis',               status: 'done' },
    { name: 'Programming',     sub: 'Python, Data Structures (In Progress)',   status: 'current' },
    { name: 'Data Systems',    sub: 'Database, Analytics',                     status: 'pending' },
    { name: 'Capstone & OJT',  sub: 'CpE 430, ENGG 417',                     status: 'pending' },
  ],
  'TECHNOLOGY': [
    { name: 'Core Curriculum', sub: 'Years 1-2 Foundation',                    status: 'done' },
    { name: 'Programming',     sub: 'OOP, Data Structures',                   status: 'done' },
    { name: 'Software Design', sub: 'CpE 418, Web Systems (In Progress)',     status: 'current' },
    { name: 'Advanced Dev',    sub: 'Full-Stack, Database',                   status: 'pending' },
    { name: 'Capstone & OJT',  sub: 'CpE 430, ENGG 417',                     status: 'pending' },
  ],
  'NETWORKING': [
    { name: 'Core Curriculum',    sub: 'Years 1-2 Foundation',                 status: 'done' },
    { name: 'Data Communications',sub: 'Networking Basics',                    status: 'done' },
    { name: 'Network Security',   sub: 'CpE 419, Routing (In Progress)',      status: 'current' },
    { name: 'Cisco CCNA Prep',    sub: 'CpE 423, 427',                        status: 'pending' },
    { name: 'Capstone & OJT',     sub: 'CpE 430, ENGG 417',                  status: 'pending' },
  ],
  'AI RESEARCH': [
    { name: 'Core Curriculum',     sub: 'Years 1-2 Foundation',                status: 'done' },
    { name: 'Advanced Mathematics',sub: 'MATH 403, 404, CpE 408',             status: 'done' },
    { name: 'Python & Statistics', sub: 'DSP, Programming (In Progress)',      status: 'current' },
    { name: 'ML Elective',        sub: 'Machine Learning Course',             status: 'pending' },
    { name: 'AI Capstone & OJT',  sub: 'CpE 430, Research',                  status: 'pending' },
  ],
};

/* ── Helper functions ── */

export function inferCategory(title) {
  const l = title.toLowerCase();
  if (l.includes('embed') || l.includes('firmware') || l.includes('hardware')) return 'ENGINEERING';
  if (l.includes('data') && (l.includes('analy') || l.includes('scien')))      return 'DATA SCIENCE';
  if (l.includes('network') || l.includes('cisco'))                            return 'NETWORKING';
  if (l.includes('ai') || l.includes('ml') || l.includes('machine') || l.includes('deep learn')) return 'AI RESEARCH';
  return 'TECHNOLOGY';
}

export function matchColor(score) {
  return score >= 85 ? '#2d7a3a' : score >= 70 ? '#9a6c00' : '#70170f';
}

export function matchBadgeCls(score) {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (score >= 70) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-[#70170f] border border-red-200';
}

export function parseRec(str) {
  const l = str.toLowerCase();
  let label = 'RECOMMENDATION';
  if (l.includes('course') || l.includes('enroll') || l.includes('cpen') || l.includes('math')) label = 'ELECTIVE COURSE';
  else if (l.includes('project') || l.includes('build') || l.includes('github')) label = 'INDUSTRY PROJECT';
  else if (l.includes('certif') || l.includes('ccna') || l.includes('aws'))      label = 'CERTIFICATION';
  else if (l.includes('practice') || l.includes('learn') || l.includes('coursera') || l.includes('kaggle')) label = 'SELF-STUDY';
  const idx = str.search(/[:\u2014\u2013]/);
  if (idx > 0 && idx < 50) {
    return { label, title: str.substring(0, idx).trim(), desc: str.substring(idx + 1).trim() };
  }
  return { label, title: str.length > 45 ? str.substring(0, 42) + '...' : str, desc: str };
}
