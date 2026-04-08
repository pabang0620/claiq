import api from './axios.js'

export const questionApi = {
  getPending: (params) =>
    api.get('/questions', { params: { status: 'pending', ...params } }),
  getById: (id) => api.get(`/questions/${id}`),
  review: (id, action, data) =>
    api.patch(`/questions/${id}/review`, { status: action, ...data }),
  getTodayQuiz: () => api.get('/questions/today'),
  submitAnswer: (id, answer, academyId) => api.post(`/questions/${id}/submit`, { answer, academy_id: academyId }),
  getTypeStats: (params) => api.get('/students/me/type-stats', { params }),
}
