export function Textarea({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border transition-colors outline-none resize-vertical',
          'placeholder:text-zinc-400',
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-zinc-200 bg-white hover:border-zinc-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50' : '',
        ].join(' ')}
      />
      {error && (
        <p role="alert" className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
