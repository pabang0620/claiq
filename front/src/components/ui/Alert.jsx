import { useEffect } from 'react'
import { X, AlertCircle, AlertTriangle } from 'lucide-react'
import { useUIStore } from '../../store/uiStore.js'

const ICONS = {
  error: <AlertCircle size={24} className="text-red-600 flex-shrink-0" />,
  warning: <AlertTriangle size={24} className="text-amber-600 flex-shrink-0" />,
}

const STYLES = {
  error: 'bg-red-50 border border-red-300 text-red-800',
  warning: 'bg-amber-50 border border-amber-300 text-amber-800',
}

const CLOSE_STYLES = {
  error: 'text-red-400 hover:text-red-600',
  warning: 'text-amber-400 hover:text-amber-600',
}

function AlertItem({ id, message, type = 'error', duration = 3000 }) {
  const removeAlert = useUIStore((s) => s.removeAlert)

  useEffect(() => {
    const timer = setTimeout(() => removeAlert(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, removeAlert])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-4 px-6 py-4 rounded-2xl shadow-xl',
        'animate-in slide-in-from-top-4 fade-in duration-300',
        STYLES[type] || STYLES.error,
      ].join(' ')}
      style={{ minWidth: 320, maxWidth: 480 }}
    >
      {ICONS[type] || ICONS.error}
      <p className="text-base font-medium flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => removeAlert(id)}
        aria-label="알림 닫기"
        className={[
          'flex-shrink-0 transition-colors',
          CLOSE_STYLES[type] || CLOSE_STYLES.error,
        ].join(' ')}
      >
        <X size={18} />
      </button>
    </div>
  )
}

export function AlertContainer() {
  const alerts = useUIStore((s) => s.alerts)

  if (!alerts.length) return null

  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3"
      aria-label="오류 알림 영역"
    >
      {alerts.map((alert) => (
        <AlertItem key={alert.id} {...alert} />
      ))}
    </div>
  )
}
