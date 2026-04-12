import { useEffect, useState } from 'react'
import { LectureStatChart } from '../../components/operator/LectureStatChart.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { dashboardApi } from '../../api/dashboard.api.js'
import { ACTIVE_SUBJECTS } from '../../constants/subjects.js'
import { useUIStore } from '../../store/uiStore.js'

const SUBJECT_OPTIONS = [
  { value: '', label: '전체 과목' },
  ...ACTIVE_SUBJECTS.map((s) => ({ value: s.code, label: s.label })),
]

const PERIOD_OPTIONS = [
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 3개월' },
]

export default function LectureStatsPage() {
  const addToast = useUIStore((s) => s.addToast)
  const [stats, setStats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    dashboardApi
      .getLectureStats({ subject, period })
      .then((res) => { if (!cancelled) setStats(res.data || []) })
      .catch((err) => {
        if (!cancelled) {
          setStats([])
          addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [subject, period])

  const normalizedStats = stats.map((s) => ({
    ...s,
    correctRate: s.correctRate ?? s.avg_correct_rate ?? 0,
    participantCount: s.participantCount ?? s.attendance_count ?? 0,
    questionCount: s.questionCount ?? s.question_count ?? 0,
  }))

  const avgRate = normalizedStats.length
    ? Math.round(normalizedStats.reduce((s, d) => s + (d.correctRate || 0), 0) / normalizedStats.length)
    : 0

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">강의 통계</h1>
          <p className="text-zinc-500 text-sm mt-1">강의별 수강생 이해도 및 정답률을 분석합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SUBJECT_OPTIONS}
          />
          <Select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIOD_OPTIONS}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '분석 강의 수', value: normalizedStats.length },
          { label: '평균 정답률', value: `${avgRate}%` },
          { label: '70% 이상 강의', value: normalizedStats.filter((s) => (s.correctRate || 0) >= 70).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <Card title="강의별 정답률">
          <LectureStatChart data={normalizedStats} />
        </Card>
      )}

      {/* Detailed table */}
      {!isLoading && normalizedStats.length > 0 && (
        <Card title="상세 목록">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="py-2 text-left font-medium text-zinc-500">강의명</th>
                  <th className="py-2 text-center font-medium text-zinc-500">정답률</th>
                  <th className="py-2 text-center font-medium text-zinc-500">참여</th>
                  <th className="py-2 text-center font-medium text-zinc-500">문항수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {normalizedStats.map((s) => (
                  <tr key={s.id || s.title} className="hover:bg-zinc-50/50">
                    <td className="py-2.5 text-zinc-800 truncate max-w-[200px]">{s.title}</td>
                    <td className="py-2.5 text-center">
                      <span className={[
                        'font-semibold',
                        s.correctRate >= 80 ? 'text-emerald-600' : s.correctRate >= 60 ? 'text-amber-600' : 'text-red-600',
                      ].join(' ')}>
                        {s.correctRate || 0}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-zinc-600">{s.participantCount || 0}명</td>
                    <td className="py-2.5 text-center text-zinc-600">{s.questionCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
