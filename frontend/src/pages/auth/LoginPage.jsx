import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Brain,
  BookOpen,
  TrendingUp,
  Compass,
} from 'lucide-react'
import useAuthStore from '@store/authStore'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import { validateLoginForm } from '@utils/validators'

// Dedicated visual asset for the login experience
import loginVisualImg from '@assets/login-journey.jpg'

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isAuthChecking } = useAuth()
  const login = useAuthStore(s => s.login)
  const { success } = useNotification()

  const message = location.state?.message
  const from = location.state?.from?.pathname || '/dashboard'

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Restore remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('life_replay_remembered_email')
      if (savedEmail) {
        setForm(prev => ({
          ...prev,
          email: savedEmail,
          rememberMe: true,
        }))
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, [])

  // If already authenticated, redirect to target or dashboard
  if (!isAuthChecking && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  // Field change handler - PRESERVES exact password characters & case sensitivity
  const handleChange = (field) => (e) => {
    const val = field === 'rememberMe' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [field]: val }))

    // Clear API error as user types
    if (apiError) setApiError('')

    // Live validation if field was touched
    if (touched[field]) {
      const nextForm = { ...form, [field]: val }
      const validationErrors = validateLoginForm({
        email: nextForm.email,
        password: nextForm.password,
      })
      setErrors(prev => ({
        ...prev,
        [field]: validationErrors[field] || '',
      }))
    }
  }

  // Blur handler for touch validation
  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const validationErrors = validateLoginForm({
      email: form.email,
      password: form.password,
    })
    setErrors(prev => ({
      ...prev,
      [field]: validationErrors[field] || '',
    }))
  }

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })

    const validationErrors = validateLoginForm({
      email: form.email,
      password: form.password,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setApiError('')

    try {
      // Remember me handling
      try {
        if (form.rememberMe && form.email.trim()) {
          localStorage.setItem('life_replay_remembered_email', form.email.trim())
        } else {
          localStorage.removeItem('life_replay_remembered_email')
        }
      } catch {
        // Ignore storage errors
      }

      // Exact password preservation (no trim, no lowercase, strictly case-sensitive)
      const result = await login({
        email: form.email.trim(),
        password: form.password,
      })

      if (result.success) {
        success('Welcome back! 👋', 'Signed in successfully')
        navigate(from, { replace: true })
      } else {
        if (result.details && Object.keys(result.details).length) {
          setErrors(result.details)
        }
        setApiError(result.error || 'Invalid email or password.')
      }
    } catch {
      setApiError('An unexpected network error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080c14] text-slate-100 overflow-x-hidden relative selection:bg-violet-500/30 selection:text-violet-100">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-purple-900/5 blur-[160px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* LEFT SECTION: Visual, Branding & Reflection Story (Desktop & Tablet)      */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex lg:w-[48%] xl:w-[52%] 2xl:w-[55%] flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-white/[0.07] z-10">
        {/* Background Image with Dark Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={loginVisualImg}
            alt="Life Replay Journey & Reflection"
            className="w-full h-full object-cover object-center transform scale-105 filter brightness-[0.72] contrast-[1.08]"
          />
          {/* Subtle multi-layer cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/60 to-[#080c14]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080c14]/40 via-transparent to-[#080c14]/80" />
          <div className="absolute inset-0 bg-violet-950/20 mix-blend-color" />
        </div>

        {/* Top Header Branding */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex items-center justify-between"
        >
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.12] backdrop-blur-md shadow-inner-glow">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-primary-500 to-indigo-600 flex items-center justify-center shadow-glow-primary">
              <Compass className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                Life Replay AI
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-violet-300/90 uppercase block leading-none mt-0.5">
                Personal Growth Analyzer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm text-xs text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Encrypted & Private</span>
          </div>
        </motion.div>

        {/* Center Headline & Emotional Storytelling */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="relative z-10 my-auto max-w-xl pr-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/25 text-violet-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>Your Journey, Replayed</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
            Your memories. <br />
            Your progress. <br />
            <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
              Your story.
            </span>
          </h2>

          <p className="text-slate-300/90 text-base xl:text-lg leading-relaxed mb-8 font-normal">
            Reflect on your daily habits, mood patterns, and milestone achievements with continuous AI-synthesized intelligence designed to bring clarity to your growth.
          </p>

          {/* Calming Reflection Glass Card */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l" />
            <p className="text-xs xl:text-sm text-slate-200 italic leading-relaxed pl-2 font-serif">
              “Every habit formed, every thought recorded, every milestone reached — captured and reflected back to guide your future.”
            </p>
          </div>
        </motion.div>

        {/* Bottom Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400"
        >
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              Grounded AI Synthesis
            </span>
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Deep Reflection
            </span>
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Progress Tracking
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>v2.0</span>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Centered Login Card & Form (Responsive for all screens)   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-16 min-h-screen relative z-10">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-primary">
              <Compass className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-sm font-bold text-white leading-none block">
                Life Replay AI
              </span>
              <span className="text-[9px] font-semibold text-violet-300 uppercase tracking-wider block mt-0.5">
                Growth Analyzer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-2xs text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Secure</span>
          </div>
        </div>

        {/* Centered Login Card Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-3xl bg-[#0e1424]/75 border border-white/[0.09] backdrop-blur-2xl p-7 sm:p-9 shadow-[0_16px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Top delicate subtle glow inside card */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            {/* Card Header */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Continue your personal growth journey.
              </p>
            </div>

            {/* Notification messages (e.g. from password reset) */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generic Authentication Error Alert */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{apiError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Address Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-email"
                  className="text-xs sm:text-sm font-medium text-slate-300 flex items-center justify-between"
                >
                  <span>
                    Email Address <span className="text-rose-400">*</span>
                  </span>
                </label>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange('email')}
                    onBlur={handleBlur('email')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface-950/60 border text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.email && touched.email
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/25 bg-rose-500/[0.03]'
                        : 'border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/25'
                    }`}
                  />
                </div>

                {errors.email && touched.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field (Strictly Case-Sensitive, Exact Characters Preserved) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-xs sm:text-sm font-medium text-slate-300"
                  >
                    Password <span className="text-rose-400">*</span>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange('password')}
                    onBlur={handleBlur('password')}
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-surface-950/60 border text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.password && touched.password
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/25 bg-rose-500/[0.03]'
                        : 'border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/25'
                    }`}
                  />

                  {/* Password Show/Hide Toggle Button */}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {errors.password && touched.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    id="login-remember-me"
                    name="rememberMe"
                    checked={form.rememberMe}
                    onChange={handleChange('rememberMe')}
                    className="w-4 h-4 rounded border-slate-700 bg-surface-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 transition-colors cursor-pointer accent-violet-600"
                  />
                  <span className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    Remember me
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors hover:underline focus:outline-none focus-visible:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting || isAuthChecking}
                className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white relative overflow-hidden transition-all duration-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-glow-primary hover:shadow-lg mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-primary-500 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-white/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 text-white">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>
            </form>

            {/* Bottom Register Navigation */}
            <div className="mt-7 pt-6 border-t border-white/[0.07] text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline focus:outline-none focus-visible:underline ml-1"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Minimal Footer for Right Column */}
        <div className="text-center py-2 text-2xs text-slate-500">
          <p>© {new Date().getFullYear()} Life Replay AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

