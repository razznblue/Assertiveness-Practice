import type { SessionFieldProps, SessionInputProps } from '@/types'

export const SessionField = ({ label, children, helperText, onHelperClick }: SessionFieldProps) => (
  <div className="input flex w-full flex-col items-center p-2">
    <div className="flex w-full items-center justify-end">
      <p className="px-2 text-xl font-bold">{label}</p>
      {children}
    </div>
    {helperText && (
      <button type="button" onClick={onHelperClick} className="cursor-pointer pt-1 text-sm text-white/80">
        {helperText}
      </button>
    )}
  </div>
)

export const SessionInput = ({
  value,
  onChange,
  onKeyDown,
  type = 'text',
  max,
  className = 'w-1/2 rounded-md bg-gray p-1 px-2 text-black',
  disabled = false,
}: SessionInputProps) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    max={max}
    disabled={disabled}
    className={className}
  />
)
