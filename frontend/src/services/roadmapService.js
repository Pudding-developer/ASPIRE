import { request } from './api'

export const roadmapService = {
  getRoadmap: async (careerSlug) => {
    const data = await request('GET', `/api/roadmap/${careerSlug}`)
    return data.data
  },
  getAdviseeRoadmap: async (studentId, careerSlug) => {
    const data = await request('GET', `/api/instructor/advisees/${studentId}/roadmap/${careerSlug}`)
    return data.data
  },
  getAllSlugs: async () => {
    const data = await request('GET', '/api/roadmap/slugs/all')
    return data.data
  }
}

