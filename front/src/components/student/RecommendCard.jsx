import { ArrowRight, BookOpen, TrendingDown } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'

export function RecommendCard({ title, description, type = 'lecture', badge, onClick, className = '' }) {
  const icons = { lecture: BookOpen, weak: TrendingDown }
  const Icon = icons[type] || BookOpen

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-4 p-4 bg-white rounded-lg border border-zinc-200',
        'hover:border-primary-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 text-left group',
        className,
      ].join(' ')}
    >
      <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
        <Icon size={20} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-zinc-800 truncate">{title}</p>
          {badge && <Badge label={badge} variant="primary" size="sm" />}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 truncate">{description}</p>
        )}
      </div>
      <ArrowRight size={16} className="text-zinc-300 group-hover:text-primary-600 transition-colors flex-shrink-0" />
    </button>
  )
}
