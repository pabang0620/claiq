import { useEffect, useRef } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { useExamStore } from '../../store/examStore.js'

export function QuizTimer({ onTimeUp, className = '' }) {
  const { remainingTime, tick, isSubmitted } = useExamStore()
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    if (isSubmitted) return

    const interval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [isSubmitted, tick])

  useEffect(() => {
    if (remainingTime === 0 && !isSubmitted) {
      onTimeUpRef.current?.()
    }
  }, [remainingTime, isSubmitted])

  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const isWarning = remainingTime <= 300 && remainingTime > 60 // 5분 이하
  const isDanger = remainingTime <= 60 // 1분 이하

  return (
    <div
      role="timer"
      aria-label={`남은 시간: ${minutes}분 ${seconds}초`}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg',
        isDanger
          ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-white border-zinc-200 text-zinc-800',
        className,
      ].join(' ')}
    >
      {isDanger ? (
        <AlertTriangle size={18} className="flex-shrink-0" />
      ) : (
        <Clock size={18} className="flex-shrink-0" />
      )}
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
