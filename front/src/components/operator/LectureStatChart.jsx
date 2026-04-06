import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { CHART_COLORS, getScoreColor } from '../../constants/colors.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-zinc-800">{d.fullTitle || d.title}</p>
      <p className="text-primary-700">정답률: {d.correctRate}%</p>
      <p className="text-zinc-500">참여: {d.participantCount || 0}명</p>
    </div>
  )
}

export function LectureStatChart({ data = [], className = '' }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        통계 데이터가 없습니다.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    fullTitle: d.title,
    title: d.title?.length > 12 ? d.title.slice(0, 12) + '…' : d.title,
  }))

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 15, left: -5, bottom: 40 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis
            dataKey="title"
            tick={{ fontSize: 11, fill: '#71717a' }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#71717a' }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke={CHART_COLORS.success} strokeDasharray="4 4" label={{ value: '70%', fill: CHART_COLORS.success, fontSize: 11 }} />
          <Bar dataKey="correctRate" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={getScoreColor(entry.correctRate)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
