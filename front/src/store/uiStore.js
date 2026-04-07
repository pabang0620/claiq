import { create } from 'zustand'

export const useUIStore = create((set) => ({
  toasts: [],
  sidebarOpen: true,

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
