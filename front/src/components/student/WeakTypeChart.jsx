import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { CHART_COLORS } from '../../constants/colors.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-zinc-800">{d.fullName || d.typeName}</p>
      <p className="text-primary-700">정답률: {Math.round(d.correctRate * 100)}%</p>
      <p className="text-zinc-500">총 {d.totalAttempts}문항</p>
    </div>
  )
}

export function WeakTypeChart({ data = [], subject }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        분석 데이터가 없습니다.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    fullName: d.typeName ?? '',
    typeName: (d.typeName?.length ?? 0) > 5 ? d.typeName.slice(0, 5) + '…' : (d.typeName ?? ''),
    value: Math.round((d.correctRate ?? 0) * 100),
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis
            dataKey="typeName"
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Radar
            name="정답률"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            fill={CHART_COLORS.primary}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 space-y-1">
        {[...data]
          .sort((a, b) => a.correctRate - b.correctRate)
          .slice(0, 3)
          .map((d) => (
            <div key={d.typeCode} className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">{d.typeName}</span>
              <span
                className={[
                  'font-medium',
                  d.correctRate < 0.5 ? 'text-red-600' : d.correctRate < 0.7 ? 'text-amber-600' : 'text-emerald-600',
                ].join(' ')}
              >
                {Math.round(d.correctRate * 100)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
