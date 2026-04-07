export function Spinner({ size = 'md', className = '' }) {
  const sizeMap = { sm: 16, md: 24, lg: 40 }
  const px = sizeMap[size] || 24

  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={`inline-block ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-primary-600"
        style={{ width: px, height: px }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <Spinner size="lg" />
    </div>
  )
}
