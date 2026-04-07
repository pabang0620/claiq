import { useEffect } from 'react'
import axios from 'axios'
import AppRoutes from './routes/AppRoutes.jsx'
import { useAuthStore } from './store/authStore.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function App() {
  const { setAuth, setInitialized, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
    const controller = new AbortController()

    axios
      .get(`${BASE_URL}/auth/me`, {
        withCredentials: true,
        signal: controller.signal,
      })
      .then((res) => {
        const { user, accessToken } = res.data?.data || {}
        if (user && accessToken) {
          setAuth(user, accessToken)
        } else {
          setInitialized()
        }
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          setInitialized()
        }
      })

    return () => controller.abort()
  }, [setAuth, setInitialized, initAuth])

  return <AppRoutes />
}
