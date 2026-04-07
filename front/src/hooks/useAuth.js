import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { authApi } from '../api/auth.api.js'
import { useUIStore } from '../store/uiStore.js'
import { getDashboardPath } from '../utils/roleGuard.js'

export function useAuth() {
  const { user, accessToken, isAuthenticated, isInitialized, setAuth, clearUser } =
    useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const navigate = useNavigate()

  const login = useCallback(
    async (email, password) => {
      try {
        const res = await authApi.login(email, password)
        const { user: u, accessToken: token } = res.data
        setAuth(u, token)
        addToast({ type: 'success', message: `안녕하세요, ${u.name}님!` })
        navigate(getDashboardPath(u.role))
        return { success: true }
      } catch (err) {
        const message = err.message || '로그인에 실패했습니다.'
        addToast({ type: 'error', message })
        return { success: false, error: message }
      }
    },
    [setAuth, addToast, navigate]
  )

  const signup = useCallback(
    async (data) => {
      try {
        const res = await authApi.signup(data)
        const { user: u, accessToken: token } = res.data
        setAuth(u, token)
        addToast({ type: 'success', message: '회원가입이 완료됐습니다.' })
        navigate('/join-academy')
        return { success: true }
      } catch (err) {
        const message = err.message || '회원가입에 실패했습니다.'
        addToast({ type: 'error', message })
        return { success: false, error: message }
      }
    },
    [setAuth, addToast, navigate]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 무시
    } finally {
      clearUser()
      navigate('/login')
    }
  }, [clearUser, navigate])

  return {
    user,
    accessToken,
    isAuthenticated,
    isInitialized,
    login,
    signup,
    logout,
  }
}
