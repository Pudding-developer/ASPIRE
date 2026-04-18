import { useState, useEffect } from 'react'
import { roadmapService, CAREER_TO_SLUG } from '../../../../services/roadmapService'

export function useRoadmap(careerTitle) {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Gracefully handle undefined / null careerTitle
    if (!careerTitle) {
      setRoadmap(null)
      setError(null)
      return
    }

    const slug = CAREER_TO_SLUG[careerTitle]
    if (!slug) {
      // Unknown title — don't crash, just surface a clean error
      setError(`No roadmap available for "${careerTitle}"`)
      return
    }

    const fetchRoadmap = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await roadmapService.getRoadmap(slug)
        setRoadmap(data)
      } catch (err) {
        setError('Could not load roadmap')
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmap()
  }, [careerTitle])

  return { roadmap, loading, error }
}
