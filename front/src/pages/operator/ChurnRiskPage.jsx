import { useEffect, useState } from 'react'
import { ChurnRiskTable } from '../../components/operator/ChurnRiskTable.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { dashboardApi } from '../../api/dashboard.api.js'
import { useUIStore } from '../../store/uiStore.js'

const RISK_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'high', label: '위험 (70% 이상)' },
  { value: 'medium', label: '주의 (40~70%)' },
  { value: 'low', label: '양호 (40% 미만)' },
]

export default function ChurnRiskPage() {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [riskFilter, setRiskFilter] = useState('all')
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    setIsLoading(true)
    dashboardApi
      .getChurnRisk({ filter: riskFilter })
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setIsLoading(false))
  }, [riskFilter])

  function handleContact(studentId) {
    addToast({ type: 'info', message: '연락처 기능은 준비 중입니다.' })
  }

  const sorted = [...students].sort((a, b) => b.churnScore - a.churnScore)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">이탈 위험 대시보드</h1>
          <p className="text-zinc-500 text-sm mt-1">학습 참여도가 낮은 수강생을 파악하고 조기에 개입하세요.</p>
        </div>
        <Select
          id="risk-filter"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          options={RISK_OPTIONS}
        />
      </div>

      {/* Summary badges */}
      {!isLoading && students.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: '전체', count: students.length, color: 'bg-zinc-100 text-zinc-700' },
            { label: '위험', count: students.filter((s) => s.churnScore > 0.7).length, color: 'bg-red-100 text-red-700' },
            { label: '주의', count: students.filter((s) => s.churnScore > 0.4 && s.churnScore <= 0.7).length, color: 'bg-amber-100 text-amber-700' },
            { label: '양호', count: students.filter((s) => s.churnScore <= 0.4).length, color: 'bg-emerald-100 text-emerald-700' },
          ].map(({ label, count, color }) => (
            <span key={label} className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
              {label}: {count}명
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <PageSpinner />
      ) : (
        <ChurnRiskTable students={sorted} onContact={handleContact} />
      )}
    </div>
  )
}
