import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChurnRiskTable } from '../../components/operator/ChurnRiskTable.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [riskFilter, setRiskFilter] = useState('all')
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    dashboardApi
      .getChurnRisk({})
      .then((res) => { if (!cancelled) setStudents(res.data || []) })
      .catch((err) => { if (!cancelled) { setStudents([]); addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' }) } })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  function handleContact(studentId) {
    addToast({ type: 'info', message: '연락처 기능은 준비 중입니다.' })
  }

  async function handleGenerateComments() {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const res = await dashboardApi.generateRiskComments({})
      setStudents(res.data || [])
      addToast({ type: 'success', message: 'AI 코멘트가 생성되었습니다.' })
    } catch (err) {
      addToast({ type: 'error', message: err?.message || 'AI 코멘트 생성에 실패했습니다.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const sorted = [...students].sort((a, b) => b.churnScore - a.churnScore)
  const filtered = sorted.filter((s) => {
    if (riskFilter === 'high') return s.churnScore > 0.7
    if (riskFilter === 'medium') return s.churnScore > 0.4 && s.churnScore <= 0.7
    if (riskFilter === 'low') return s.churnScore <= 0.4
    return true
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">이탈 위험 대시보드</h1>
          <p className="text-zinc-500 text-sm mt-1">학습 참여도가 낮은 수강생을 파악하고 조기에 개입하세요.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateComments}
            disabled={isGenerating || students.length === 0}
          >
            <Sparkles size={14} />
            {isGenerating ? 'AI 분석 중...' : 'AI 코멘트 생성'}
          </Button>
          <Select
            id="risk-filter"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            options={RISK_OPTIONS}
          />
        </div>
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
        <ChurnRiskTable students={filtered} onContact={handleContact} />
      )}
    </div>
  )
}
