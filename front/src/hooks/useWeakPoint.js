import { useEffect, useState } from 'react'
import { useRoadmapStore } from '../store/roadmapStore.js'
import api from '../api/axios.js'

export function useWeakPoint() {
  const { weakTypes, isLoading, error, fetchWeakTypes } = useRoadmapStore()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [isSubjectLoading, setIsSubjectLoading] = useState(true)

  useEffect(() => {
    api.get('/subjects')
      .then((res) => {
        const list = res.data || []
        setSubjects(list)
        if (list.length > 0) setSelectedSubject(list[0].code)
      })
      .catch(() => {})
      .finally(() => setIsSubjectLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedSubject) return
    fetchWeakTypes(selectedSubject)
  }, [selectedSubject, fetchWeakTypes])

  return {
    weakTypes,
    isLoading,
    error,
    subjects,
    isSubjectLoading,
    selectedSubject,
    setSelectedSubject,
    refresh: () => fetchWeakTypes(selectedSubject),
  }
}
