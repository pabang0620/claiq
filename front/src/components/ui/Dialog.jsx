import { useEffect } from 'react'
import { useUIStore } from '../../store/uiStore.js'

export function Dialog() {
  const dialog = useUIStore((s) => s.dialog)
  const closeDialog = useUIStore((s) => s.closeDialog)

  useEffect(() => {
    if (!dialog) return
    function onKeyDown(e) {
      if (e.key === 'Escape') closeDialog(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialog, closeDialog])

  if (!dialog) return null

  const { type, title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false } = dialog

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => closeDialog(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-fade-scale">
        <div className="px-6 pt-6 pb-5">
          {/* 모바일 핸들 */}
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5 sm:hidden" />

          {title && (
            <h3 className="text-base font-bold text-zinc-900 mb-2">{title}</h3>
          )}
          <p className="text-sm text-zinc-600 leading-relaxed">{message}</p>
        </div>

        <div className={`px-6 pb-6 flex gap-3 ${type === 'alert' ? 'justify-center' : 'justify-end'}`}>
          {type === 'confirm' && (
            <button
              onClick={() => closeDialog(false)}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => closeDialog(type === 'confirm' ? true : undefined)}
            className={[
              'flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors',
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary-700 hover:bg-primary-800 text-white',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
