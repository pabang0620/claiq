export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const initials = name
    ? name.trim().charAt(0).toUpperCase()
    : '?'

  return (
    <div
      aria-label={name || '사용자'}
      className={[
        'rounded-full overflow-hidden bg-primary-100 text-primary-700',
        'flex items-center justify-center font-semibold flex-shrink-0',
        sizeMap[size] || sizeMap.md,
        className,
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={name || '아바타'} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
