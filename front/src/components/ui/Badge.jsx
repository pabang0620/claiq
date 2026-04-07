const VARIANT_CLASSES = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  primary: 'bg-primary-100 text-primary-700',
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium rounded-full',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className,
      ].join(' ')}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </span>
  )
}
