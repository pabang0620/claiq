import { create } from 'zustand'
import { setupApiAuth } from '../api/axios.js'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, isInitialized: true })
    setupApiAuth({
      getToken: () => get().accessToken,
      setToken: (token) => set({ accessToken: token }),
      logout: () => get().clearUser(),
    })
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  setInitialized: () => set({ isInitialized: true }),

  clearUser: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
    })
    setupApiAuth({
      getToken: () => null,
      setToken: () => {},
      logout: () => {},
    })
  },

  initAuth: () => {
    // App.jsx에서 /auth/me 호출 후 setAuth로 초기화
    setupApiAuth({
      getToken: () => get().accessToken,
      setToken: (token) => set({ accessToken: token }),
      logout: () => get().clearUser(),
    })
  },
}))
