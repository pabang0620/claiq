import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Calendar, CheckCircle, AlertTriangle, Award } from 'lucide-react'
import { reportApi } from '../../api/report.api.js'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { useUIStore } from '../../store/uiStore.js'

function StatCard({ label, value, icon: Icon, color = 'text-zinc-700' }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
        <Icon size={20} className="text-zinc-500" />
      </div>
      <div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function PublicReportPage() {
  const { token } = useParams()
  const addToast = useUIStore((s) => s.addToast)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    reportApi
      .getPublic(token)
      .then((res) => setReport(res.data))
      .catch((err) => {
        addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
        setError('리포트를 불러올 수 없습니다. 링크가 유효하지 않거나 만료되었을 수 있습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertTriangle size={40} className="mx-auto text-amber-400" />
          <p className="text-zinc-700 font-medium">{error}</p>
          <p className="text-zinc-400 text-sm">학원에 문의하여 새 링크를 요청하세요.</p>
        </div>
      </div>
    )
  }

  if (!report) return null

  const { student_name, academy_name, report_period, content_json: c } = report

  const weakTypes = c?.weakTypes ?? []
  const attendanceRate = c?.attendance?.rate ?? 0
  const quizRate = c?.quiz?.rate ?? 0
  const pointsEarned = c?.pointsEarned ?? 0

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
            <BookOpen size={24} className="text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{student_name} 학생 성취 리포트</h1>
          <p className="text-sm text-zinc-500">{academy_name}</p>
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-white border border-zinc-200 rounded-full px-3 py-1">
            <Calendar size={12} />
            {report_period} 기준
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="이번 달 출석률"
            value={`${attendanceRate}%`}
            icon={Calendar}
            color={attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'}
          />
          <StatCard
            label="문제풀이 정답률"
            value={`${quizRate}%`}
            icon={CheckCircle}
            color={quizRate >= 70 ? 'text-emerald-600' : quizRate >= 50 ? 'text-amber-600' : 'text-red-600'}
          />
          <StatCard
            label="출석 횟수"
            value={`${c?.attendance?.present ?? 0} / ${c?.attendance?.total ?? 0}회`}
            icon={BookOpen}
          />
          <StatCard
            label="획득 포인트"
            value={`${pointsEarned}P`}
            icon={Award}
            color="text-amber-600"
          />
        </div>

        {/* 취약 유형 */}
        {weakTypes.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              보완이 필요한 유형
            </h2>
            <ul className="space-y-2">
              {weakTypes.map((t, idx) => (
                <li
                  key={t.type_code ?? idx}
                  className="flex items-center gap-2 text-sm text-zinc-600"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {t.type_name || t.type_code}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 푸터 */}
        <p className="text-center text-xs text-zinc-400">
          본 리포트는 CLAIQ AI 학습 플랫폼에서 자동 생성되었습니다.
        </p>
      </div>
    </div>
  )
}
