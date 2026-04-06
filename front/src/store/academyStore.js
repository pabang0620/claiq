import { create } from 'zustand'
import api from '../api/axios.js'

export const useAcademyStore = create((set) => ({
  academy: null,
  isLoading: false,
  error: null,

  fetchAcademy: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/academies/me')
      set({ academy: data.data, isLoading: false })
    } catch (err) {
      set({ error: err.message || '학원 정보를 불러오지 못했습니다.', isLoading: false })
    }
  },

  updateAcademy: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.patch('/academies/me', payload)
      set({ academy: data.data, isLoading: false })
      return { success: true }
    } catch (err) {
      set({ error: err.message || '저장에 실패했습니다.', isLoading: false })
      return { success: false, error: err.message }
    }
  },
}))
