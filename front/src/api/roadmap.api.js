import api from './axios.js'

export const roadmapApi = {
  get: () => api.get('/roadmap/me'),
  regenerate: (academyId) => api.post('/roadmap/regenerate', { academy_id: academyId }),
  updateItem: (itemId, data) => api.patch(`/roadmap/items/${itemId}`, data),
}
