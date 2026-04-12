export function WeakTypeChart({ data = [], subject }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        분석 데이터가 없습니다.
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => (a.correctRate ?? 0) - (b.correctRate ?? 0))

  return (
    <div className="space-y-3">
      {/* 상단 범례 */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 pb-1 border-b border-zinc-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
          50% 미만
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
          50~70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
          70% 이상
        </span>
      </div>

      {/* 각 유형별 가로 막대 */}
      {sorted.map((d) => {
        const pct = Math.round((d.correctRate ?? 0) * 100)
        const barColor = pct < 50 ? 'bg-red-400' : pct < 70 ? 'bg-amber-400' : 'bg-emerald-400'
        const textColor = pct < 50 ? 'text-red-600' : pct < 70 ? 'text-amber-600' : 'text-emerald-600'
        return (
          <div key={d.typeCode} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-700">{d.typeName}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{d.totalAttempts}문항</span>
                <span className={`text-sm font-bold w-12 text-right ${textColor}`}>{pct}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
