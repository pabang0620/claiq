import { Loader2 } from 'lucide-react'

const VARIANT_CLASSES = {
  primary: 'bg-primary-700 hover:bg-primary-800 text-white disabled:bg-primary-300',
  secondary: 'bg-primary-100 hover:bg-primary-200 text-primary-700 disabled:opacity-50',
  danger: 'bg-red-400 hover:bg-red-500 text-white disabled:bg-red-200',
  ghost: 'bg-transparent hover:bg-primary-50 text-primary-700 disabled:opacity-50',
  outline:
    'bg-white hover:bg-primary-50 text-primary-700 border border-primary-300 disabled:opacity-50',
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  form,
  children,
  className = '',
}) {
  return (
    <button
      type={type}
      form={form}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer',
        'active:scale-[0.97] disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className,
      ].join(' ')}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
