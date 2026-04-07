import api from './axios.js'

export const pointApi = {
  getBalance: () => api.get('/points/me/balance'),
  getTransactions: () => api.get('/points/me/transactions'),
  getBadges: () => api.get('/points/me/badges'),
  getStreak: () => api.get('/points/me/streak'),
  redeem: (academyId) => api.post('/points/me/redeem', { academy_id: academyId }),
  getRewards: () => api.get('/points/rewards'),
}
