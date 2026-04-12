import { create } from 'zustand'
import api from '../api/axios.js'
import { useAcademyStore } from './academyStore.js'

export const useExamStore = create((set, get) => ({
  currentExam: null,
  answers: {},
  remainingTime: 0,
  isSubmitted: false,
  report: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  generateExam: async (lectureIds = []) => {
    set({ isGenerating: true, error: null, answers: {}, isSubmitted: false, report: null })
    try {
      const academy = useAcademyStore.getState().academy
      const body = {
        ...(academy?.id ? { academy_id: academy.id } : {}),
        ...(lectureIds.length > 0 ? { lecture_ids: lectureIds } : {}),
      }
      const data = await api.post('/exams/generate', body, { timeout: 120000 })
      const exam = data.data
      set({
        currentExam: exam,
        remainingTime: exam.time_limit_sec ?? exam.timeLimitSec ?? 1200,
        isGenerating: false,
      })
      return exam
    } catch (err) {
      set({ error: err.message, isGenerating: false })
      throw err
    }
  },

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  submitExam: async () => {
    const { currentExam, answers } = get()
    if (!currentExam) return
    set({ isLoading: true, error: null })
    try {
      // 백엔드 submitSchema: answers: [{ question_id, submitted }] 배열 형식으로 변환
      const answersArray = Object.entries(answers).map(([question_id, submitted]) => ({
        question_id,
        submitted: String(submitted),
      }))
      const data = await api.post(`/exams/${currentExam.id}/submit`, { answers: answersArray })
      set({ isSubmitted: true, report: data.data, isLoading: false })
      return data.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchReport: async (examId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get(`/exams/${examId}/report`)
      set({ report: data.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  tick: () =>
    set((state) => ({
      remainingTime: Math.max(0, state.remainingTime - 1),
    })),

  resetExam: () =>
    set({ currentExam: null, answers: {}, remainingTime: 0, isSubmitted: false, report: null }),
}))
