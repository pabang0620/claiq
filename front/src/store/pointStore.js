import { create } from 'zustand'
import api from '../api/axios.js'
import { badgeApi } from '../api/badge.api.js'

export const usePointStore = create((set) => ({
  balance: 0,
  transactions: [],
  badges: [],
  streak: { current: 0, longest: 0 },
  isLoading: false,
  error: null,
  pagination: { page: 1, total: 0, limit: 20 },

  fetchBalance: async () => {
    try {
      const data = await api.get('/points/me/balance')
      set({ balance: data.data?.balance ?? 0 })
    } catch (err) {
      set({ error: err.message })
    }
  },

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/points/me/transactions', {
        params: { page: 1, limit: 20, ...params },
      })
      set({
        transactions: data.data || [],
        pagination: data.meta || { page: 1, total: 0, limit: 20 },
        isLoading: false,
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchBadges: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.get('/points/me/badges')
      set({ badges: data.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchStreak: async () => {
    try {
      const data = await api.get('/points/me/streak')
      const raw = data.data || {}
      set({
        streak: {
          current: raw.current_streak ?? raw.current ?? 0,
          longest: raw.longest_streak ?? raw.longest ?? 0,
        },
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  redeem: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.post('/points/me/redeem', {})
      set({ balance: data.data?.remainingBalance ?? 0, isLoading: false })
      return { success: true }
    } catch (err) {
      set({ error: err.message, isLoading: false })
      return { success: false, error: err.message }
    }
  },

  claimAllCompleteReward: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await badgeApi.claimAllCompleteReward()
      set({ isLoading: false })
      return { success: true, data: data.data }
    } catch (err) {
      set({ error: err.message, isLoading: false })
      return { success: false, error: err.message }
    }
  },
}))
