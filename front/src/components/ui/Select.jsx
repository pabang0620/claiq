import { ChevronDown } from 'lucide-react'

export function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = '선택하세요',
  disabled = false,
  required = false,
  error,
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
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          className={[
            'w-full px-3 py-2 pr-9 text-sm rounded-lg border transition-colors outline-none appearance-none',
            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-zinc-200 bg-white hover:border-zinc-300',
            disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50' : 'cursor-pointer',
          ].join(' ')}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
