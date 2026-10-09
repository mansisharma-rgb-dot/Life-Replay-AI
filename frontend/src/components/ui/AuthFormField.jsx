import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

/**
 * Reusable FormField component — label + input + error + optional right icon.
 */
export const FormField = forwardRef(function FormField(
  {
    label,
    id,
    type = 'text',
    error,
    success,
    hint,
    className,
    containerClassName,
    required,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={clsx(
            'input-field',
            error   && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30 bg-rose-500/5',
            success && 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/30',
            isPassword && 'pr-11',
            className,
          )}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(s => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye    className="w-4 h-4" />
            }
          </button>
        )}

        {/* Status icon for non-password fields */}
        {!isPassword && (error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error   && <AlertCircle  className="w-4 h-4 text-rose-400" />}
            {success && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
})

/**
 * Password Strength Meter.
 */
export function PasswordStrengthMeter({ strength }) {
  if (!strength || !strength.label) return null

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-all duration-300',
              (strength.percentage / 100) * 5 >= i
                ? strength.color
                : 'bg-slate-700',
            )}
          />
        ))}
      </div>
      <p className={clsx(
        'text-xs font-medium transition-colors duration-300',
        strength.score <= 2 ? 'text-rose-400'  :
        strength.score === 3 ? 'text-amber-400' : 'text-emerald-400',
      )}>
        Password strength: {strength.label}
      </p>
    </div>
  )
}

/**
 * Auth form error banner.
 */
export function AuthErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
    >
      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Auth form success banner.
 */
export function AuthSuccessBanner({ message }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Submit button with loading spinner.
 */
export function SubmitButton({ isLoading, children, className, disabled, ...props }) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={clsx('btn-primary w-full py-3 text-base relative', className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {typeof isLoading === 'string' ? isLoading : 'Please wait...'}
        </span>
      ) : children}
    </button>
  )
}

/**
 * Divider with text.
 */
export function AuthDivider({ text = 'or' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs text-slate-500 font-medium">{text}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}
