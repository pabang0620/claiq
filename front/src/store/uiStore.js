import { create } from 'zustand'

export const useUIStore = create((set) => ({
  toasts: [],
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


  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now() + Math.random(), duration: 3000, ...toast },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  closeSidebar: () => set({ sidebarOpen: false }),
}))
