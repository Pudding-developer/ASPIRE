import { request } from './api'

export const roadmapService = {
  getRoadmap: async (careerSlug) => {
    const data = await request('GET', `/api/roadmap/${careerSlug}`)
    return data.data
  },
  getAllSlugs: async () => {
    const data = await request('GET', '/api/roadmap/slugs/all')
    return data.data
  }
}

export const CAREER_TO_SLUG = {
  "Backend Developer": "backend",
  "Frontend Developer": "frontend",
  "Full Stack Developer": "full-stack",
  "DevOps Engineer": "devops",
  "Cybersecurity Analyst": "cyber-security",
  "Data Scientist": "ai-data-scientist",
  "AI Engineer": "ai-engineer",
  "Machine Learning Engineer": "machine-learning",
  "Software Architect": "software-architect"
}
