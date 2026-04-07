const COLOR_CLASSES = {
  primary: 'bg-primary-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function ProgressBar({
  value = 0,
  label,
  color = 'primary',
  showPercent = false,
  animated = false,
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-zinc-600">{label}</span>}
          {showPercent && <span className="text-xs text-zinc-500 font-medium">{clamped}%</span>}
        </div>
      )}
      <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          className={[
            'h-full rounded-full transition-all duration-500',
            COLOR_CLASSES[color] || COLOR_CLASSES.primary,
            animated ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
