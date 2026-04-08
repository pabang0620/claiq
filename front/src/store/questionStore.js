import { create } from 'zustand'
import api from '../api/axios.js'
import { useAcademyStore } from './academyStore.js'

export const useQuestionStore = create((set) => ({
  pendingQuestions: [],
  currentQuestion: null,
  todayQuiz: [],
  submissionResult: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, total: 0, limit: 10 },

  fetchPendingQuestions: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/questions', {
        params: { status: 'pending', page: 1, limit: 10, ...params },
      })
      set({
        pendingQuestions: data.data || [],
        pagination: data.meta || { page: 1, total: 0, limit: 10 },
        isLoading: false,
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchQuestionById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get(`/questions/${id}`)
      set({ currentQuestion: data.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  reviewQuestion: async (id, action, editedData = {}) => {
    set({ isLoading: true, error: null })
    try {
      const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action
      await api.patch(`/questions/${id}/review`, { status, ...editedData })
      set((state) => ({
        pendingQuestions: state.pendingQuestions.filter((q) => q.id !== id),
        isLoading: false,
      }))
      return { success: true }
    } catch (err) {
      set({ error: err.message, isLoading: false })
      return { success: false, error: err.message }
    }
  },

  fetchTodayQuiz: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/questions/today')
      set({ todayQuiz: data.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  submitAnswer: async (questionId, answer) => {
    try {
      const academy = useAcademyStore.getState().academy
      const academy_id = academy?.id
      const data = await api.post(`/questions/${questionId}/submit`, { submitted: answer, academy_id })
      set({ submissionResult: data.data })
      return data.data
    } catch (err) {
      throw err
    }
  },

  clearSubmissionResult: () => set({ submissionResult: null }),
}))
