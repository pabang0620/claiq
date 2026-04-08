import api from './axios.js'

export const examApi = {
  generate: (data) => api.post('/exams/generate', data, { timeout: 120000 }),
  getStatus: (id) => api.get(`/exams/${id}/status`),
  submit: (id, answers) => api.post(`/exams/${id}/submit`, { answers }),
  getReport: (id) => api.get(`/exams/${id}/report`),
  getHistory: () => api.get('/exams/me/history'),
}
