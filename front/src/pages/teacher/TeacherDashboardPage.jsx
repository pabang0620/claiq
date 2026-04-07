import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, CheckSquare, Calendar, MessageSquare, TrendingUp } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { dashboardApi } from '../../api/dashboard.api.js'
import { useAuthStore } from '../../store/authStore.js'
import { formatDate } from '../../utils/formatDate.js'

export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .getTeacher()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <PageSpinner />

  const stats = [
    { label: '이번 주 업로드', value: summary?.weeklyUploads ?? 0, icon: Upload, color: 'text-blue-600 bg-blue-100' },
    { label: '검증 대기 문제', value: summary?.pendingQuestions ?? 0, icon: CheckSquare, color: 'text-amber-600 bg-amber-100' },
    { label: '이번 주 출석률', value: `${summary?.attendanceRate ?? 0}%`, icon: Calendar, color: 'text-emerald-600 bg-emerald-100' },
    { label: '에스컬레이션', value: summary?.escalations ?? 0, icon: MessageSquare, color: 'text-red-600 bg-red-100' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{formatDate(new Date().toISOString(), 'YYYY년 MM월 DD일')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg border border-zinc-200 p-5 flex items-center gap-4 hover:border-primary-200 hover:shadow-sm transition-all duration-150">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="강의 업로드"
          subtitle="오늘 수업 음성 파일을 업로드하세요"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              AI가 자동으로 수능 유형별 문제를 생성합니다.
            </p>
            <Link to="/teacher/upload">
              <Button size="sm">
                <Upload size={14} />
                업로드
              </Button>
            </Link>
          </div>
        </Card>

        <Card
          title="문제 검증 대기"
          subtitle={`${summary?.pendingQuestions ?? 0}개 문제가 검증을 기다립니다`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              AI 생성 문제를 검토하고 승인/반려하세요.
            </p>
            <Link to="/teacher/review">
              <Button size="sm" variant={summary?.pendingQuestions > 0 ? 'primary' : 'outline'}>
                <CheckSquare size={14} />
                검증하기
              </Button>
            </Link>
          </div>
        </Card>

        <Card
          title="에스컬레이션 답변"
          subtitle={`${summary?.escalations ?? 0}개 질문이 답변을 기다립니다`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              AI가 답변하지 못한 질문에 직접 답변하세요.
            </p>
            <Link to="/teacher/escalation">
              <Button size="sm" variant={summary?.escalations > 0 ? 'danger' : 'outline'}>
                <MessageSquare size={14} />
                답변하기
              </Button>
            </Link>
          </div>
        </Card>

        <Card
          title="출결 관리"
          subtitle="오늘의 출결을 확인하고 수정하세요"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              수강생 출결 현황을 한눈에 관리합니다.
            </p>
            <Link to="/teacher/attendance">
              <Button size="sm" variant="outline">
                <Calendar size={14} />
                출결 관리
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent lectures */}
      {summary?.recentLectures?.length > 0 && (
        <Card title="최근 업로드한 강의">
          <div className="space-y-3">
            {summary.recentLectures.map((lecture) => (
              <div key={lecture.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{lecture.title}</p>
                  <p className="text-xs text-zinc-400">{formatDate(lecture.createdAt)} · 문제 {lecture.questionCount}개</p>
                </div>
                <span className={[
                  'text-xs px-2 py-1 rounded-full font-medium',
                  lecture.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                ].join(' ')}>
                  {lecture.status === 'done' ? '완료' : '처리 중'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
