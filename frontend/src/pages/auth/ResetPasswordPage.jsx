import { useState }             from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion }               from 'framer-motion'
import { KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react'
import authApi                  from '@api/authApi'
import {
  FormField, PasswordStrengthMeter,
  SubmitButton, AuthErrorBanner, AuthSuccessBanner,
} from '@components/ui/AuthFormField'
import {
  validateResetForm, getPasswordStrength,
} from '@utils/validators'

export default function ResetPasswordPage() {
  const { token: pathToken } = useParams()
  const [searchParams]       = useSearchParams()
  const token = pathToken || searchParams.get('token')
  const navigate             = useNavigate()

  const [form, setForm]         = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors]     = useState({})
  const [touched, setTouched]   = useState({})
  const [apiError, setApiError] = useState('')
  const [successMsg, setSuccess]= useState('')
  const [isLoading, setLoading] = useState(false)

  const passwordStrength = getPasswordStrength(form.password)

  if (!token) {
    return (
      <div className="w-full text-center py-10">
        <p className="text-rose-400 text-sm mb-4">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn-primary inline-flex">Request a new link</Link>
      </div>
    )
  }

  const set = (field) => (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, [field]: val }))
    if (touched[field]) validate({ ...form, [field]: val })
    if (apiError) setApiError('')
  }

  const touch = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    validate(form)
  }

  const validate = (values) => {
    const errs = validateResetForm(values)
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    if (!validate(form)) return

    setLoading(true)
    setApiError('')

    try {
      const res = await authApi.resetPassword({
        token,
        password:         form.password,
        confirm_password: form.confirmPassword,
      })
      setSuccess(res.data.message || 'Password updated successfully!')
      setTimeout(() => navigate('/login', { state: { message: 'Password reset! Please sign in.' } }), 2500)
    } catch (err) {
      const errData = err.response?.data?.error
      if (errData?.code === 'VALIDATION_ERROR') {
        setErrors(errData.details || {})
      }
      setApiError(
        errData?.message || 
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : '') || 
        err.response?.data?.message || 
        'Reset failed. The link may have expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-5">
          <KeyRound className="w-7 h-7 text-violet-400" />
        </div>

        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Set new password
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Choose a strong password for your account.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        noValidate
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-5"
      >
        <AuthErrorBanner   message={apiError}   />
        <AuthSuccessBanner message={successMsg} />

        {!successMsg && (
          <>
            {/* New Password */}
            <FormField
              id="reset-password"
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={set('password')}
              onBlur={touch('password')}
              error={touched.password ? errors.password : ''}
              autoComplete="new-password"
              required
            />
            <PasswordStrengthMeter strength={passwordStrength} />

            {/* Confirm Password */}
            <FormField
              id="reset-confirm"
              label="Confirm new password"
              type="password"
              placeholder="Repeat your new password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              onBlur={touch('confirmPassword')}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              success={
                form.confirmPassword.length > 0 &&
                form.password === form.confirmPassword &&
                !errors.confirmPassword
              }
              autoComplete="new-password"
              required
            />

            {/* Security note */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-400">
                All active sessions will be signed out after your password is changed.
              </p>
            </div>

            <SubmitButton
              id="reset-submit-btn"
              isLoading={isLoading ? 'Updating password...' : false}
            >
              Update Password
            </SubmitButton>
          </>
        )}

        {successMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-slate-400"
          >
            Redirecting to sign in...
          </motion.p>
        )}
      </motion.form>

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 flex justify-center"
      >
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  )
}
