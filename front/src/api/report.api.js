import api from './axios.js'

export const reportApi = {
  generate: (data) => api.post('/reports/generate', {
    studentId: data.studentId,
    academyId: data.academyId,
    period: data.period,
  }),
  sendSms: (reportId) => api.post(`/reports/${reportId}/send-sms`),
  getList: (params) => api.get('/reports', { params }),
}
