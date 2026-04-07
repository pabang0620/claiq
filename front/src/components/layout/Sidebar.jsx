import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  Map,
  BookOpen,
  TrendingDown,
  Award,
  Coins,
  Medal,
  BarChart2,
  Users,
  Settings,
  AlertTriangle,
  FileBarChart,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore.js'
import { ROLES } from '../../constants/roles.js'

const TEACHER_MENU = [
  { to: '/teacher', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/teacher/upload', icon: Upload, label: '강의 업로드' },
  { to: '/teacher/review', icon: CheckSquare, label: '문제 검증' },
  { to: '/teacher/attendance', icon: Calendar, label: '출결 관리' },
  { to: '/teacher/escalation', icon: MessageSquare, label: '질문 에스컬레이션' },
  { to: '/teacher/materials', icon: FileText, label: '강의 자료' },
]

const STUDENT_MENU = [
  { to: '/student', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/student/roadmap', icon: Map, label: 'D-day 로드맵' },
  { to: '/student/quiz', icon: BookOpen, label: '오늘의 문제' },
  { to: '/student/exam', icon: FileBarChart, label: '미니 모의고사' },
  { to: '/student/qa', icon: MessageSquare, label: 'AI Q&A' },
  { to: '/student/weak', icon: TrendingDown, label: '약점 분석' },
  { to: '/student/materials', icon: FileText, label: '강의 자료' },
  { to: '/student/points', icon: Coins, label: '포인트' },
  { to: '/student/badges', icon: Award, label: '뱃지' },
]

const OPERATOR_MENU = [
  { to: '/operator', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/operator/churn', icon: AlertTriangle, label: '이탈 위험' },
  { to: '/operator/stats', icon: BarChart2, label: '강의 통계' },
  { to: '/operator/report', icon: FileBarChart, label: '성취 리포트' },
  { to: '/operator/members', icon: Users, label: '멤버 관리' },
  { to: '/operator/settings', icon: Settings, label: '학원 설정' },
]

const MENU_BY_ROLE = {
  [ROLES.TEACHER]: TEACHER_MENU,
  [ROLES.STUDENT]: STUDENT_MENU,
  [ROLES.OPERATOR]: OPERATOR_MENU,
}

const ROLE_LABEL = {
  [ROLES.TEACHER]: '교강사',
  [ROLES.STUDENT]: '수강생',
  [ROLES.OPERATOR]: '운영자',
}

export function Sidebar({ isOpen }) {
  const user = useAuthStore((s) => s.user)
  const menu = MENU_BY_ROLE[user?.role] || []

  return (
    <aside
      className={[
        'fixed top-0 left-0 h-screen bg-white border-r border-zinc-200 z-30 flex flex-col transition-all duration-300 w-60',
        isOpen ? 'translate-x-0 md:w-60' : '-translate-x-full md:translate-x-0 md:w-16',
      ].join(' ')}
      aria-label="사이드바 네비게이션"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-100 flex-shrink-0">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-primary-700 text-lg">CLAIQ</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">CL</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {menu.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 mb-0.5 group',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium active:bg-primary-100'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 active:bg-zinc-100',
              ].join(' ')
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {isOpen && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {user && isOpen && (
        <div className="px-3 py-4 border-t border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
              {user.name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-800 truncate">{user.name}</p>
              <p className="text-xs text-zinc-400 truncate">
                {ROLE_LABEL[user.role] || user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
