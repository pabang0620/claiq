import api from './axios.js'

export const academyApi = {
  create: (data) => api.post('/academies', data),
  getById: (id) => api.get(`/academies/${id}`),
  getMe: () => api.get('/academies/me'),
  updateMe: (data) => api.patch('/academies/me', data),
  join: (code) => api.post('/academies/join', { code }),
  getMembers: () => api.get('/academies/me/members'),
  invite: (data) => api.post('/academies/me/members/invite', data),
  removeMember: (userId) => api.delete(`/academies/me/members/${userId}`),
  updateMemberRole: (userId, role) => api.patch(`/academies/me/members/${userId}/role`, { role }),
  getCoupons: () => api.get('/academies/me/coupons'),
  createCoupon: (data) => api.post('/academies/me/coupons', data),
  deleteCoupon: (id) => api.delete(`/academies/me/coupons/${id}`),
  awardCoupon: (couponId, studentId) => api.post(`/academies/me/coupons/${couponId}/award`, { studentId }),
  getMyScholarships: () => api.get('/academies/me/scholarships'),
}
