import { useState, useEffect } from 'react'
import { roadmapService } from '../../../../services/roadmapService'

export function useRoadmap(careerTitle, studentId = null) {
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

    const fetchRoadmap = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = studentId
          ? await roadmapService.getAdviseeRoadmap(studentId, encodeURIComponent(careerTitle))
          : await roadmapService.getRoadmap(encodeURIComponent(careerTitle))
        setRoadmap(data)
      } catch (err) {
        setError('Could not load roadmap')
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmap()
  }, [careerTitle, studentId])

  return { roadmap, loading, error }
}
