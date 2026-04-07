import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Header } from './Header.jsx'
import { ToastContainer } from '../ui/Toast.jsx'
import { useUIStore } from '../../store/uiStore.js'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const closeSidebar = useUIStore((s) => s.closeSidebar)
  const isDesktop = useIsDesktop()

  const desktopMargin = sidebarOpen ? 240 : 64

  return (
    <div className="min-h-screen bg-surface-50 flex">
      <Sidebar isOpen={sidebarOpen} />

      {/* 모바일 backdrop */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: isDesktop ? desktopMargin : 0 }}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-5 overflow-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
