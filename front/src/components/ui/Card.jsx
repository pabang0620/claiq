export function Card({
  title,
  subtitle,
  children,
  footer,
  className = '',
  onClick,
}) {
  const isClickable = !!onClick
  return (
    <div
      className={[
        'bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden transition-all duration-150',
        isClickable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary-200 active:scale-[0.99]'
          : 'hover:border-zinc-300',
        className,
      ].join(' ')}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-zinc-100">
          {title && <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>}
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50">{footer}</div>
      )}
    </div>
  )
}
