import { useEffect } from 'react'
import { useRoadmapStore } from '../store/roadmapStore.js'

export function useRoadmap() {
  const { roadmap, isLoading, isRegenerating, error, fetchRoadmap, regenerateRoadmap } =
    useRoadmapStore()

  useEffect(() => {
    fetchRoadmap()
  }, [fetchRoadmap])

  return { roadmap, isLoading, isRegenerating, error, fetchRoadmap, regenerateRoadmap }
}
