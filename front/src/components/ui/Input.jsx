export function Input({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  hint,
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border transition-all duration-150 outline-none',
          'placeholder:text-zinc-400',
          'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-zinc-200 bg-white hover:border-zinc-300',
          disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50' : '',
        ].join(' ')}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-zinc-400">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
