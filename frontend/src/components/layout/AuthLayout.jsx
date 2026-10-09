import { Outlet, Navigate } from 'react-router-dom'
import { motion }           from 'framer-motion'
import { useAuth }          from '@context/AuthContext'
import { Zap }              from 'lucide-react'
import GlobalBackground     from './GlobalBackground'

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  // If already authenticated, send to dashboard
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-surface-900 flex relative">
      <GlobalBackground />

      {/* ── Left Panel: Decorative / Branding ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-surface-900/40 backdrop-blur-md border-r border-slate-700/50 flex-col items-center justify-center p-12 z-10">
        {/* Background orbs */}
        <div className="glow-orb w-96 h-96 bg-primary-600 -top-20 -left-20" />
        <div className="glow-orb w-80 h-80 bg-violet-600 bottom-10 right-10" />
        <div className="glow-orb w-64 h-64 bg-emerald-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-lg text-center"
        >
          {/* Logo */}
          <div className="inline-flex items-center gap-3.5 mb-8 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-800/80 border border-violet-500/40 shadow-glow-primary flex items-center justify-center shrink-0">
              <img
                src="/logo-icon.png"
                alt="Life Replay AI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-white tracking-tight">Life Replay AI</p>
              <p className="text-2xs text-violet-300 font-semibold tracking-widest uppercase">Personal Growth Analyzer</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-4">
            Replay Your Journey,
            <span className="block gradient-text">Unlock Your Growth</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-10">
            AI-powered journaling that surfaces patterns in your mood, habits, and goals —
            giving you a cinematic view of how far you've come.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              '🧠 Gemini AI Insights',
              '📓 Smart Journaling',
              '📈 Growth Analytics',
              '🔥 Habit Tracking',
            ].map(feat => (
              <span key={feat}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-white/5 border border-white/10">
                {feat}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Floating cards decoration */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-10 w-48 glass-card p-4 border border-primary-500/20"
        >
          <p className="text-2xs text-slate-400 uppercase tracking-wide mb-1">Growth Score</p>
          <p className="text-2xl font-bold gradient-text">+47%</p>
          <p className="text-xs text-slate-500 mt-1">vs. last month</p>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-24 right-10 w-44 glass-card p-4 border border-emerald-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-2xs text-emerald-400 font-semibold">AI INSIGHT</p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            "You've shown remarkable resilience this quarter..."
          </p>
        </motion.div>
      </div>

      {/* ── Right Panel: Auth Form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3.5 mb-8">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface-800 border border-violet-500/40 shadow-glow-primary shrink-0">
              <img
                src="/logo-icon.png"
                alt="Life Replay AI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Life Replay AI</p>
              <p className="text-2xs text-violet-400 tracking-widest uppercase font-semibold">Personal Growth Analyzer</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
