import { useEffect, useState } from 'react'
import { useRoadmapStore } from '../store/roadmapStore.js'
import { ACTIVE_SUBJECTS } from '../constants/subjects.js'

export function useWeakPoint() {
  const { weakTypes, isLoading, error, fetchWeakTypes } = useRoadmapStore()
  const [selectedSubject, setSelectedSubject] = useState(ACTIVE_SUBJECTS[0]?.code || 'korean')

  useEffect(() => {
    fetchWeakTypes(selectedSubject)
  }, [selectedSubject, fetchWeakTypes])

  return {
    weakTypes,
    isLoading,
    error,
    selectedSubject,
    setSelectedSubject,
    refresh: () => fetchWeakTypes(selectedSubject),
  }
}
