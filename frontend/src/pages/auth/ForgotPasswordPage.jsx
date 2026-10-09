import { useState }        from 'react'
import { Link }            from 'react-router-dom'
import { motion }          from 'framer-motion'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import authApi             from '@api/authApi'
import {
  FormField, SubmitButton, AuthErrorBanner, AuthSuccessBanner,
} from '@components/ui/AuthFormField'
import { validateForgotForm } from '@utils/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('')
  const [error, setError]         = useState('')
  const [apiError, setApiError]   = useState('')
  const [successMsg, setSuccess]  = useState('')
  const [isLoading, setLoading]   = useState(false)
  const [touched, setTouched]     = useState(false)

  const validate = (val) => {
    const errs = validateForgotForm({ email: val })
    setError(errs.email || '')
    return !errs.email
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!validate(email)) return

    setLoading(true)
    setApiError('')
    setSuccess('')

    try {
      const res = await authApi.forgotPassword({ email: email.trim() })
      setSuccess(res.data.message || 'Check your email for a reset link.')
    } catch (err) {
      setApiError(
        err.response?.data?.error?.message || 
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : '') || 
        err.response?.data?.message || 
        'Something went wrong. Please try again.'
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
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mb-5">
          <Mail className="w-7 h-7 text-primary-400" />
        </div>

        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Forgot password?
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          No worries! Enter your email and we'll send you a reset link.
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
        <AuthErrorBanner   message={apiError}    />
        <AuthSuccessBanner message={successMsg}  />

        {!successMsg && (
          <>
            <FormField
              id="forgot-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (touched) validate(e.target.value)
                if (apiError) setApiError('')
              }}
              onBlur={() => { setTouched(true); validate(email) }}
              error={touched ? error : ''}
              autoComplete="email"
              required
            />

            <SubmitButton
              id="forgot-submit-btn"
              isLoading={isLoading ? 'Sending reset link...' : false}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Reset Link
              </span>
            </SubmitButton>
          </>
        )}

        {/* After success, offer resend */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-500 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => { setSuccess(''); setTouched(false); setEmail('') }}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                try again
              </button>
              .
            </p>
          </motion.div>
        )}
      </motion.form>

      {/* Back to login */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
