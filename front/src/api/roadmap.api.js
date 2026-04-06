import api from './axios.js'

export const roadmapApi = {
  get: () => api.get('/roadmap/me'),
  regenerate: () => api.post('/roadmap/regenerate'),
  updateItem: (itemId, data) => api.patch(`/roadmap/items/${itemId}`, data),
}
