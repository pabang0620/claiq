import api from './axios.js'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true }),
  me: () => axios.get(`${BASE_URL}/auth/me`, { withCredentials: true }),
  joinAcademy: (code) => api.post('/academies/join', { code }),
  changePassword: (data) => api.patch('/auth/password', data),
}
