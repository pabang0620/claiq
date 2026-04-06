import api from './axios.js'

export const attendanceApi = {
  getList: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  update: (id, data) => api.patch(`/attendance/${id}`, data),
  bulkMark: (data) => api.post('/attendance/bulk', data),
  getMyAttendance: () => api.get('/attendance/me'),
}
