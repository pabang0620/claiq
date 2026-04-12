import api from './axios.js'

export const pointApi = {
  getBalance: () => api.get('/points/me/balance'),
  getTransactions: () => api.get('/points/me/transactions'),
  getBadges: () => api.get('/points/me/badges'),
  getStreak: () => api.get('/points/me/streak'),
  redeem: () => api.post('/points/me/redeem', {}),
  getRewards: () => api.get('/points/rewards'),
  claimAllBadgeReward: () => api.post('/badges/all-complete-reward'),
}
