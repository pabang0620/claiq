import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DdayCounter } from '../../components/student/DdayCounter.jsx'
import { StreakBadge } from '../../components/student/StreakBadge.jsx'
import { PointSummary } from '../../components/student/PointSummary.jsx'
import { RecommendCard } from '../../components/student/RecommendCard.jsx'
import { RoadmapTimeline } from '../../components/student/RoadmapTimeline.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { dashboardApi } from '../../api/dashboard.api.js'
import { useAuthStore } from '../../store/authStore.js'

export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    dashboardApi
      .getStudent()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">안녕하세요, {user?.name}님! 👋</h1>
        <p className="text-zinc-500 text-sm mt-1">오늘도 수능 준비 화이팅!</p>
      </div>

      {/* Top section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DdayCounter />
        <StreakBadge
          current={summary?.streak?.current || 0}
          longest={summary?.streak?.longest || 0}
          className="md:col-span-1 w-full"
        />
        <PointSummary
          balance={summary?.pointBalance || 0}
          todayEarned={summary?.todayPoints || 0}
          totalEarned={summary?.totalPoints || 0}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Roadmap */}
        <div className="lg:col-span-2">
          <Card title="학습 로드맵" subtitle="이번 주 학습 계획">
            <RoadmapTimeline
              items={summary?.roadmapItems?.slice(0, 5) || []}
              ddayCount={summary?.ddayCount || 0}
            />
          </Card>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-600">추천 학습</h2>
          {summary?.recommendations?.length > 0 ? (
            summary.recommendations.slice(0, 4).map((rec, i) => (
              <RecommendCard
                key={i}
                title={rec.title}
                description={rec.description}
                type={rec.type}
                badge={rec.badge}
                onClick={() => navigate(rec.path || '/student/quiz')}
              />
            ))
          ) : (
            <>
              <RecommendCard
                title="오늘의 문제 풀기"
                description="AI가 추천한 오늘의 문제"
                onClick={() => navigate('/student/quiz')}
              />
              <RecommendCard
                title="약점 유형 집중 연습"
                description="최근 오답률이 높은 유형"
                type="weak"
                onClick={() => navigate('/student/weak')}
              />
              <RecommendCard
                title="AI Q&A 질문하기"
                description="모르는 내용을 AI에게 물어보세요"
                onClick={() => navigate('/student/qa')}
              />
            </>
          )}
        </div>
      </div>

      {/* Today stats */}
      {summary?.todayStats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '오늘 푼 문제', value: summary.todayStats.quizCount ?? 0, unit: '문제' },
            { label: '오늘 정답률', value: `${summary.todayStats.correctRate ?? 0}%`, unit: '' },
            { label: '학습 시간', value: summary.todayStats.studyMinutes ?? 0, unit: '분' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
              <p className="text-2xl font-bold text-zinc-900">{value}<span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span></p>
              <p className="text-xs text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
