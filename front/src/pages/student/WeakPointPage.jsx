import { WeakTypeChart } from '../../components/student/WeakTypeChart.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { PageSpinner } from '../../components/ui/Spinner.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { useWeakPoint } from '../../hooks/useWeakPoint.js'
import { ACTIVE_SUBJECTS } from '../../constants/subjects.js'

const SUBJECT_OPTIONS = ACTIVE_SUBJECTS.map((s) => ({ value: s.code, label: s.label }))

export default function WeakPointPage() {
  const { weakTypes, isLoading, error, selectedSubject, setSelectedSubject, refresh } = useWeakPoint()

  const sorted = [...weakTypes].sort((a, b) => a.correctRate - b.correctRate)

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
            options={SUBJECT_OPTIONS}
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

          {/* Ranking */}
          {sorted.length > 0 && (
            <Card title="취약 유형 순위" subtitle="정답률 낮은 순">
              <div className="space-y-3">
                {sorted.map((item, i) => {
                  const pct = Math.round(item.correctRate * 100)
                  return (
                    <div key={item.typeCode} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-zinc-400 font-medium">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-700">{item.typeName}</span>
                          <span
                            className={[
                              'text-sm font-bold',
                              pct < 50 ? 'text-red-600' : pct < 70 ? 'text-amber-600' : 'text-emerald-600',
                            ].join(' ')}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                          <div
                            className={[
                              'h-1.5 rounded-full transition-all',
                              pct < 50 ? 'bg-red-400' : pct < 70 ? 'bg-amber-400' : 'bg-emerald-400',
                            ].join(' ')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.totalAttempts}문제 풀이</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {sorted.length === 0 && (
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
