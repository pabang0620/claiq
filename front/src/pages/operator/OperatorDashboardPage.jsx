import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, TrendingDown, BarChart2, FileBarChart, Settings } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { dashboardApi } from '../../api/dashboard.api.js'
import { useAuthStore } from '../../store/authStore.js'

export default function OperatorDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    dashboardApi
      .getOperator()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <PageSpinner />

  const stats = [
    { label: '전체 수강생', value: summary?.totalStudents ?? 0, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: '이탈 위험', value: summary?.churnRiskCount ?? 0, icon: TrendingDown, color: 'text-red-600 bg-red-100' },
    { label: '이번 달 출석률', value: `${summary?.attendanceRate ?? 0}%`, icon: BarChart2, color: 'text-emerald-600 bg-emerald-100' },
    { label: '미발송 리포트', value: summary?.pendingReports ?? 0, icon: FileBarChart, color: 'text-amber-600 bg-amber-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">운영자 대시보드</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {user?.academyName || '학원'} 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="이탈 위험 수강생" subtitle={`${summary?.churnRiskCount ?? 0}명이 이탈 위험 상태`}>
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500">최근 7일간 접속하지 않은 수강생을 확인하세요.</p>
            <Link to="/operator/churn">
              <Button size="sm" variant={summary?.churnRiskCount > 0 ? 'danger' : 'outline'}>
                확인
              </Button>
            </Link>
          </div>
        </Card>
        <Card title="강의 통계" subtitle="강의별 이해도 분석">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500">강의별 정답률 차트를 확인하세요.</p>
            <Link to="/operator/stats">
              <Button size="sm" variant="outline">
                <BarChart2 size={14} />
                통계 보기
              </Button>
            </Link>
          </div>
        </Card>
        <Card title="성취 리포트" subtitle={`${summary?.pendingReports ?? 0}개 미발송 리포트`}>
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500">수강생 성취 리포트를 생성하고 SMS로 발송하세요.</p>
            <Link to="/operator/report">
              <Button size="sm" variant="outline">
                <FileBarChart size={14} />
                리포트
              </Button>
            </Link>
          </div>
        </Card>
        <Card title="학원 설정">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500">쿠폰 조건, 포인트 정책을 관리하세요.</p>
            <Link to="/operator/settings">
              <Button size="sm" variant="outline">
                <Settings size={14} />
                설정
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
