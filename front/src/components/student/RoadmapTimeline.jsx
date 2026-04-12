import { useState, useRef, useEffect, useCallback } from 'react'
import { CheckCircle, Circle, Clock } from 'lucide-react'

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100', label: '완료' },
  in_progress: { icon: Clock, color: 'text-primary-600', bg: 'bg-primary-100', label: '진행 중' },
  pending: { icon: Circle, color: 'text-zinc-300', bg: 'bg-zinc-100', label: '예정' },
}

const PAGE_SIZE = 8

export function RoadmapTimeline({ items = [], ddayCount }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))
  }, [items.length])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [items])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (!items.length) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>로드맵 데이터가 없습니다.</p>
      </div>
    )
  }

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-zinc-200" aria-hidden="true" />

      <ol className="space-y-4" aria-label="학습 로드맵">
        {visibleItems.map((item) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
          const Icon = cfg.icon

          return (
            <li key={item.id} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={[
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                  item.status === 'in_progress'
                    ? 'border-primary-500 bg-white shadow-md'
                    : 'border-transparent',
                  cfg.bg,
                ].join(' ')}
              >
                <Icon size={18} className={cfg.color} />
              </div>

              {/* Content */}
              <div
                className={[
                  'flex-1 p-4 rounded-xl border transition-all',
                  item.status === 'in_progress'
                    ? 'border-primary-200 bg-primary-50 shadow-sm'
                    : item.status === 'completed'
                    ? 'border-emerald-100 bg-emerald-50/50'
                    : 'border-zinc-100 bg-white',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-xs font-medium text-zinc-400">Week {item.week}</span>
                    <h3
                      className={[
                        'font-semibold text-sm mt-0.5',
                        item.status === 'in_progress' ? 'text-primary-800' : 'text-zinc-700',
                      ].join(' ')}
                    >
                      {item.typeName || item.typeCode}
                    </h3>
                    {item.lectureTitle && (
                      <p className="text-xs text-zinc-500 mt-0.5">{item.lectureTitle}</p>
                    )}
                  </div>
                  <span
                    className={[
                      'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.status === 'in_progress'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-zinc-100 text-zinc-500',
                    ].join(' ')}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden="true" />}
      {!hasMore && items.length > PAGE_SIZE && (
        <p className="text-center text-xs text-zinc-400 pt-4">모든 주차를 불러왔습니다.</p>
      )}
    </div>
  )
}
