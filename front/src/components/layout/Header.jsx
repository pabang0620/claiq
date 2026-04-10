import { Menu, Bell, LogOut, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Avatar } from '../ui/Avatar.jsx'

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-3 sm:px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="사이드바 토글"
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        {/* Breadcrumb */}
        <nav aria-label="브레드크럼">
          <ol className="flex items-center gap-1 text-sm text-zinc-500">
            <li className="hidden sm:block">CLAIQ</li>
            <li className="hidden sm:flex items-center">
              <ChevronRight size={14} className="mx-1" />
            </li>
            <li className="font-medium text-zinc-800">{getPageTitle(pathname)}</li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="알림"
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors relative"
        >
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
          <Avatar name={user?.name} size="sm" />
          {user && (
            <span className="hidden sm:block text-sm font-medium text-zinc-700">
              {user.name}
            </span>
          )}
          <button
            onClick={logout}
            aria-label="로그아웃"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

function getPageTitle(path) {
  if (path.includes('/upload')) return '강의 업로드'
  if (path.includes('/review')) return '문제 검증'
  if (path.includes('/attendance')) return '출결 관리'
  if (path.includes('/escalation')) return '질문 에스컬레이션'
  if (path.includes('/materials')) return '강의 자료'
  if (path.includes('/roadmap')) return 'D-day 로드맵'
  if (path.includes('/quiz')) return '오늘의 문제'
  if (path.includes('/exam')) return '미니 모의고사'
  if (path.includes('/qa')) return 'AI Q&A'
  if (path.includes('/weak')) return '약점 분석'
  if (path.includes('/points')) return '포인트'
  if (path.includes('/badges')) return '뱃지'
  if (path.includes('/churn')) return '이탈 위험'
  if (path.includes('/stats')) return '강의 통계'
  if (path.includes('/report')) return '성취 리포트'
  if (path.includes('/members')) return '멤버 관리'
  if (path.includes('/settings')) return '학원 설정'
  return '대시보드'
}
