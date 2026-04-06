import api from './axios.js'

export const lectureApi = {
  upload: (formData, onUploadProgress) =>
    api.post('/lectures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 300000,
    }),
  getList: (params) => api.get('/lectures', { params }),
  getById: (id) => api.get(`/lectures/${id}`),
  getStatus: (id) => api.get(`/lectures/${id}/status`),
  delete: (id) => api.delete(`/lectures/${id}`),
  getMaterials: (lectureId) => api.get(`/lectures/${lectureId}/materials`),
  uploadMaterial: (lectureId, formData) =>
    api.post(`/lectures/${lectureId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMaterial: (lectureId, materialId) =>
    api.delete(`/lectures/${lectureId}/materials/${materialId}`),
  getMyMaterials: () => api.get('/materials/me'),
}
