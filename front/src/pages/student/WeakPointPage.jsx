import { useEffect } from 'react'
import { WeakTypeChart } from '../../components/student/WeakTypeChart.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { useWeakPoint } from '../../hooks/useWeakPoint.js'
import { useUIStore } from '../../store/uiStore.js'

export default function WeakPointPage() {
  const addToast = useUIStore((s) => s.addToast)
  const { weakTypes, isLoading, error, subjects, isSubjectLoading, selectedSubject, setSelectedSubject, refresh } = useWeakPoint()

  const subjectOptions = subjects.map((s) => ({ value: s.code, label: s.name }))

  useEffect(() => {
    if (error) {
      addToast({ type: 'error', message: error || '데이터를 불러오는 데 실패했습니다.' })
    }
  }, [error])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">약점 분석</h1>
          <p className="text-zinc-500 text-sm mt-1">수능 유형별 정답률을 분석해 약점을 파악하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            id="subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={subjectOptions}
            disabled={isSubjectLoading}
          />
          <Button variant="outline" size="sm" onClick={refresh}>
            새로고침
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">{error}</div>
      ) : (
        <>
          {/* Radar chart */}
          <Card title="유형별 정답률 분포">
            <WeakTypeChart data={weakTypes} subject={selectedSubject} />
          </Card>

          {(weakTypes ?? []).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 text-zinc-400">
              <p>아직 분석할 데이터가 없습니다.</p>
              <p className="text-sm mt-2">문제를 풀면 유형별 분석이 생성됩니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
