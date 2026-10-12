import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
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
import {
  validateRegisterForm,
  getPasswordStrength,
} from '@utils/validators'

// Dedicated visual asset for the register/onboarding experience
import registerVisualImg from '@assets/auth-register.jpg'

const PERKS = [
  'AI-powered personal growth insights',
  'Smart journal with mood tracking',
  'Goal & habit analytics dashboard',
  'Life Replay: see your journey unfold',
]

const FEATURE_PILLS = [
  { icon: Brain,      label: 'Gemini AI Insights' },
  { icon: BookOpen,   label: 'Smart Journaling'   },
  { icon: TrendingUp, label: 'Growth Analytics'   },
  { icon: Sparkles,   label: 'Habit Tracking'     },
]

export default function RegisterPage() {
  const register       = useAuthStore(s => s.register)
  const { success }    = useNotification()
  const { isAuthenticated, isLoading: isAuthChecking } = useAuth()

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword]           = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError]   = useState('')
  const [isLoading, setLoading]   = useState(false)
  const [agreed, setAgreed]       = useState(false)

  const passwordStrength = getPasswordStrength(form.password)

  // If already authenticated, redirect to dashboard
  if (!isAuthChecking && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Field change handler — PRESERVES exact password characters & case sensitivity
  const set = (field) => (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, [field]: val }))
    if (touched[field]) validate({ ...form, [field]: val })
    if (apiError) setApiError('')
  }

  // Blur handler
  const touch = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }))
    validate(form)
  }

  const validate = (values) => {
    const errs = validateRegisterForm({
      fullName:        values.fullName,
      email:           values.email,
      password:        values.password,
      confirmPassword: values.confirmPassword,
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true })
    if (!validate(form)) return
    if (!agreed) { setApiError('Please agree to the terms to continue.'); return }

    setLoading(true)
    setApiError('')

    // Exact password preservation — no trim, no lowercase, strictly case-sensitive
    const result = await register({
      full_name:        form.fullName.trim(),
      email:            form.email.trim(),
      password:         form.password,
      confirm_password: form.confirmPassword,
    })

    if (result.success) {
      success(`Welcome, ${result.user?.full_name || 'aboard'}! 🎉`, 'Account created')
    } else {
      if (result.details && Object.keys(result.details).length) {
        setErrors(result.details)
      }
      setApiError(result.error || 'Registration failed. Please try again.')
    }

    setLoading(false)
  }

  // Shared input class builder
  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-surface-950/60 border text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 ${
      errors[field] && touched[field]
        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/25 bg-rose-500/[0.03]'
        : 'border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/25'
    }`

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080c14] text-slate-100 overflow-x-hidden relative selection:bg-violet-500/30 selection:text-violet-100">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-purple-900/5 blur-[160px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* LEFT SECTION: Visual, Branding & New Journey Story (Desktop & Tablet)    */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex lg:w-[48%] xl:w-[52%] 2xl:w-[55%] flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-white/[0.07] z-10">
        {/* Background Image — Sunrise/New Beginning with Dark Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={registerVisualImg}
            alt="Life Replay AI — Begin Your Growth Journey"
            className="w-full h-full object-cover object-center transform scale-105 filter brightness-[0.68] contrast-[1.1]"
          />
          {/* Identical multi-layer cinematic overlays as Login */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/55 to-[#080c14]/35" />
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
            <span>Free to Start</span>
          </div>
        </motion.div>

        {/* Center Headline & Growth Journey Story */}
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
            Replay Your Journey. <br />
            <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent">
              Unlock Your Growth
            </span>
          </h2>

          <p className="text-slate-300/90 text-base xl:text-lg leading-relaxed mb-8 font-normal">
            AI-powered journaling that surfaces patterns in your mood, habits, and goals — giving you a cinematic view of how far you've come.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-white/[0.06] border border-white/[0.12] backdrop-blur-sm hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-3 h-3 text-violet-400" />
                {label}
              </span>
            ))}
          </div>

          {/* AI Insight Glass Card — Registration-oriented */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l" />
            <div className="flex items-center gap-2 mb-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">AI Insight</span>
            </div>
            <p className="text-xs xl:text-sm text-slate-200 italic leading-relaxed pl-2 font-serif">
              "Every new beginning is another chapter worth remembering."
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
              Smart Journaling
            </span>
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Growth Analytics
            </span>
          </div>

          {/* Floating Growth Score Card */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-end"
          >
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Growth Score</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent leading-tight">+47%</span>
            <span className="text-[10px] text-slate-500">vs. last month</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Centered Register Card & Form (Responsive for all screens) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16 min-h-screen relative z-10">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex lg:hidden items-center justify-between mb-6 sm:mb-8">
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
            <span>Free</span>
          </div>
        </div>

        {/* Centered Register Card Container */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-2 sm:py-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-3xl bg-[#0e1424]/75 border border-white/[0.09] backdrop-blur-2xl p-5 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Top subtle glow line inside card */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            {/* Card Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Free to get started
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Create your account
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Start your personal growth journey today.
              </p>
            </motion.div>

            {/* Registration Benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-2 mb-6"
            >
              {PERKS.map(perk => (
                <div key={perk} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {perk}
                </div>
              ))}
            </motion.div>

            {/* API Error Banner */}
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Full Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="reg-fullname"
                  className="text-xs sm:text-sm font-medium text-slate-300"
                >
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    autoFocus
                    required
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'reg-fullname-error' : undefined}
                    placeholder="Jane Smith"
                    value={form.fullName}
                    onChange={set('fullName')}
                    onBlur={touch('fullName')}
                    className={inputClass('fullName')}
                  />
                </div>
                {errors.fullName && touched.fullName && (
                  <p
                    id="reg-fullname-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </motion.div>

              {/* Email Address Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="reg-email"
                  className="text-xs sm:text-sm font-medium text-slate-300"
                >
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'reg-email-error' : undefined}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    onBlur={touch('email')}
                    className={inputClass('email')}
                  />
                </div>
                {errors.email && touched.email && (
                  <p
                    id="reg-email-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </motion.div>

              {/* Password Field (Strictly Case-Sensitive, Exact Characters Preserved) */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="reg-password"
                  className="text-xs sm:text-sm font-medium text-slate-300"
                >
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'reg-password-error' : undefined}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set('password')}
                    onBlur={touch('password')}
                    className={`${inputClass('password')} pr-11`}
                  />
                  {/* Password Show/Hide Toggle */}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p
                    id="reg-password-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}

                {/* Password Strength Meter */}
                {form.password.length > 0 && passwordStrength?.label && (
                  <div className="mt-1.5 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            (passwordStrength.percentage / 100) * 5 >= i
                              ? passwordStrength.color
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium transition-colors duration-300 ${
                      passwordStrength.score <= 2 ? 'text-rose-400' :
                      passwordStrength.score === 3 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col gap-1.5"
              >
                <label
                  htmlFor="reg-confirm"
                  className="text-xs sm:text-sm font-medium text-slate-300"
                >
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'reg-confirm-error' : undefined}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    onBlur={touch('confirmPassword')}
                    className={`${
                      form.confirmPassword.length > 0 &&
                      form.password === form.confirmPassword &&
                      !errors.confirmPassword
                        ? `w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-surface-950/60 border text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/25`
                        : `${inputClass('confirmPassword')} pr-11`
                    }`}
                  />
                  {/* Confirm Password Show/Hide Toggle */}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p
                    id="reg-confirm-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
                {form.confirmPassword.length > 0 &&
                  form.password === form.confirmPassword &&
                  !errors.confirmPassword && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Passwords match</span>
                  </p>
                )}
              </motion.div>

              {/* Terms & Conditions Checkbox */}
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-3 cursor-pointer group pt-0.5"
                htmlFor="reg-terms"
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id="reg-terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    agreed
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {agreed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5"
                              strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-violet-400 hover:text-violet-300 transition-colors">
                    Privacy Policy
                  </a>
                </span>
              </motion.label>

              {/* Submit Button — identical style to Login's Sign In button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isLoading || !agreed}
                  className="w-full py-3 px-5 rounded-xl font-semibold text-sm text-white relative overflow-hidden transition-all duration-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-glow-primary hover:shadow-lg mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-primary-500 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-white/20"
                >
                  {isLoading ? (
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
                      <span>Creating account...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Bottom Login Navigation */}
            <div className="mt-7 pt-6 border-t border-white/[0.07] text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors hover:underline focus:outline-none focus-visible:underline ml-1"
                >
                  Sign In
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
