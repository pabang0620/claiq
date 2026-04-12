import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '../../store/uiStore.js'

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <AlertCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
}

const BG_CLASSES = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
}

function ToastItem({ id, message, type = 'info', duration = 3000 }) {
  const removeToast = useUIStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, removeToast])

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-md',
        'animate-in slide-in-from-right-5 fade-in duration-200',
        BG_CLASSES[type] || BG_CLASSES.info,
      ].join(' ')}
      style={{ minWidth: 280, maxWidth: 400 }}
    >
      <span className="flex-shrink-0 mt-0.5">{ICONS[type]}</span>
      <p className="text-sm text-zinc-800 flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => removeToast(id)}
        aria-label="알림 닫기"
        className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  )
}
