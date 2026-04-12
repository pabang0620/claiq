import api from './axios.js'

export const badgeApi = {
  getMyBadges: () => api.get('/badges/me'),
  claimAllCompleteReward: () => api.post('/badges/all-complete-reward'),
}
