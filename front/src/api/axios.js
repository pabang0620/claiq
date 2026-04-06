import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// authStore를 직접 import하면 순환 참조 발생 가능
// 대신 콜백 방식으로 런타임에 주입받음
let getAccessToken = () => null
let onTokenRefreshed = () => {}
let onAuthFailed = () => {}

export function setupApiAuth({ getToken, setToken, logout }) {
  getAccessToken = getToken
  onTokenRefreshed = setToken
  onAuthFailed = logout
}

// 요청 인터셉터 — Authorization 헤더 자동 주입
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 — 401 시 토큰 갱신 후 재시도
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = refreshRes.data?.data?.accessToken
        if (newToken) {
          onTokenRefreshed(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch {
        onAuthFailed()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
