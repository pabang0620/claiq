import { create } from 'zustand'

export const useUIStore = create((set) => ({
  toasts: [],
  alerts: [],
  sidebarOpen: typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  dialog: null,

  showConfirm: (message, options = {}) =>
    new Promise((resolve) =>
      set({ dialog: { type: 'confirm', message, resolve, ...options } })
    ),

  showAlert: (message, options = {}) =>
    new Promise((resolve) =>
      set({ dialog: { type: 'alert', message, resolve, ...options } })
    ),

  closeDialog: (result) => {
    const { dialog } = useUIStore.getState()
    dialog?.resolve(result)
    set({ dialog: null })
  },


  addToast: (toast) => {
    const item = { id: Date.now() + Math.random(), duration: 3000, ...toast }
    if (item.type === 'error' || item.type === 'warning') {
      set((state) => ({ alerts: [...state.alerts, item] }))
    } else {
      set((state) => ({ toasts: [...state.toasts, item] }))
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  closeSidebar: () => set({ sidebarOpen: false }),
}))
