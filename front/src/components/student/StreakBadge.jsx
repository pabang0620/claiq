import { Flame } from 'lucide-react'

export function StreakBadge({ current = 0, longest = 0, className = '' }) {
  const level = current >= 30 ? 'diamond' : current >= 14 ? 'gold' : current >= 7 ? 'silver' : 'bronze'
  const colors = {
    diamond: 'from-blue-400 to-cyan-500',
    gold: 'from-amber-400 to-yellow-500',
    silver: 'from-zinc-400 to-zinc-500',
    bronze: 'from-orange-400 to-red-500',
  }

  return (
    <div
      className={[
        'inline-flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 px-5 py-4 shadow-sm',
        className,
      ].join(' ')}
      aria-label={`연속 출석 ${current}일`}
    >
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[level]} flex items-center justify-center shadow-md`}
      >
        <Flame size={22} className="text-white" />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-zinc-900">{current}</span>
          <span className="text-sm text-zinc-500">일 연속</span>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">최고 기록: {longest}일</p>
      </div>
    </div>
  )
}
