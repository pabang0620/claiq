import api from './axios.js'

export const dashboardApi = {
  getTeacher: () => api.get('/dashboard/teacher'),
  getStudent: () => api.get('/dashboard/student'),
  getOperator: () => api.get('/dashboard/operator'),
  getChurnRisk: (params) => api.get('/dashboard/churn-risk', { params }),
  getLectureStats: (params) => api.get('/dashboard/lecture-stats', { params }),
  getAttendanceStats: (params) => api.get('/dashboard/attendance-stats', { params }),
  generateRiskComments: (data) => api.post('/dashboard/risk-comments', data),
}
