import { Coins, TrendingUp, TrendingDown } from 'lucide-react'
import { formatPointWithUnit } from '../../utils/formatPoint.js'

export function PointSummary({ balance = 0, todayEarned = 0, totalEarned = 0, className = '' }) {
  return (
    <div
      className={[
        'bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-xl',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 mb-3">
        <Coins size={20} />
        <span className="text-sm font-medium text-white/80">포인트 잔액</span>
      </div>
      <p className="text-4xl font-black">{formatPointWithUnit(balance)}</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-emerald-300" />
            <span className="text-xs text-white/70">오늘 적립</span>
          </div>
          <p className="font-bold text-emerald-300">+{formatPointWithUnit(todayEarned)}</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-white/70" />
            <span className="text-xs text-white/70">누적 적립</span>
          </div>
          <p className="font-bold">{formatPointWithUnit(totalEarned)}</p>
        </div>
      </div>
    </div>
  )
}
