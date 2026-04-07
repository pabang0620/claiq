import { useEffect, useState } from 'react'
import { getNextCSATDday, formatDday } from '../../utils/calcDday.js'
import { formatDate } from '../../utils/formatDate.js'

export function DdayCounter({ className = '' }) {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    setInfo(getNextCSATDday())
  }, [])

  if (!info) return null

  const dday = info.dday
  const isToday = dday === 0
  const isPast = dday < 0

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6 text-center',
        'bg-gradient-to-br from-primary-700 to-primary-900 text-white shadow-xl',
        className,
      ].join(' ')}
      aria-label={`수능까지 ${formatDday(dday)}`}
    >
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <p className="text-white/70 text-sm font-medium mb-2">
          {info.year}학년도 수능
        </p>
        <div
          className={[
            'font-black tabular-nums leading-none',
            dday > 999 ? 'text-6xl' : 'text-8xl',
          ].join(' ')}
        >
          {formatDday(dday)}
        </div>
        <p className="text-white/60 text-xs mt-3">
          {formatDate(info.date.toISOString(), 'YYYY년 MM월 DD일')}
        </p>
        {isToday && (
          <p className="mt-2 text-amber-300 font-semibold text-sm">오늘이 수능입니다!</p>
        )}
        {isPast && (
          <p className="mt-2 text-white/60 text-xs">수능이 지났습니다. 내년을 준비하세요.</p>
        )}
      </div>
    </div>
  )
}
