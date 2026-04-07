import { create } from 'zustand'
import api from '../api/axios.js'

export const useRoadmapStore = create((set) => ({
  roadmap: null,
  weakTypes: [],
  isLoading: false,
  isRegenerating: false,
  error: null,

  fetchRoadmap: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/roadmap/me')
      set({ roadmap: data.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  regenerateRoadmap: async () => {
    set({ isRegenerating: true, error: null })
    try {
      const data = await api.post('/roadmap/regenerate')
      set({ roadmap: data.data, isRegenerating: false })
      return { success: true }
    } catch (err) {
      set({ error: err.message, isRegenerating: false })
      return { success: false, error: err.message }
    }
  },

  fetchWeakTypes: async (subject) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/students/me/type-stats', {
        params: subject ? { subject } : {},
      })
      const mapped = (data.data || []).map((d) => ({
        ...d,
        typeCode: d.type_code ?? d.typeCode,
        typeName: d.type_name ?? d.typeName ?? d.type_code ?? '',
        correctRate: parseFloat(d.correct_rate ?? d.correctRate ?? 0),
        totalAttempts: d.total_attempts ?? d.totalAttempts ?? 0,
        correctCount: d.correct_count ?? d.correctCount ?? 0,
        subjectName: d.subject_name ?? d.subjectName ?? '',
        subjectArea: d.subject_area ?? d.subjectArea ?? '',
      }))
      set({ weakTypes: mapped, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },
}))
