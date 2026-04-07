import { create } from 'zustand'
import api from '../api/axios.js'

export const useLectureStore = create((set, get) => ({
  lectures: [],
  currentLecture: null,
  uploadStatus: 'idle', // 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  uploadProgress: 0,
  processingStep: null, // 'stt' | 'embedding' | 'type_mapping' | 'question_gen'
  processingProgress: 0,
  isLoading: false,
  error: null,
  pagination: { page: 1, total: 0, limit: 10 },

  fetchLectures: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/lectures', { params: { page: 1, limit: 10, ...params } })
      set({
        lectures: data.data || [],
        pagination: data.meta || { page: 1, total: 0, limit: 10 },
        isLoading: false,
      })
    } catch (err) {
      set({ error: err.message || '강의 목록을 불러오지 못했습니다.', isLoading: false })
    }
  },

  fetchLectureById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get(`/lectures/${id}`)
      set({ currentLecture: data.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  uploadLecture: async (formData, onUploadProgress) => {
    set({ uploadStatus: 'uploading', uploadProgress: 0, error: null })
    try {
      const data = await api.post('/lectures', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total)
          set({ uploadProgress: percent })
          onUploadProgress?.(percent)
        },
        timeout: 300000,
      })
      set({ uploadStatus: 'processing', uploadProgress: 100 })
      return data.data
    } catch (err) {
      set({ uploadStatus: 'error', error: err.message || '업로드에 실패했습니다.' })
      throw err
    }
  },

  setUploadStatus: (status) => set({ uploadStatus: status }),
  setProcessingStep: (step, progress = 0) => set({ processingStep: step, processingProgress: progress }),
  resetUpload: () => set({ uploadStatus: 'idle', uploadProgress: 0, processingStep: null, processingProgress: 0 }),
}))
