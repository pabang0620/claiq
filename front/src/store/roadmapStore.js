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
      set({ weakTypes: data.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },
}))
