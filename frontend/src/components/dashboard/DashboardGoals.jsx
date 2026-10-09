import { motion } from 'framer-motion'
import { Target, ChevronRight, AlertCircle, Plus, Rocket, BookOpen, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

// Pick a decorative icon based on goal title keywords
function GoalIcon({ title }) {
  const t = (title || '').toLowerCase()
  const iconClass = 'w-4 h-4'
  if (t.includes('read') || t.includes('book') || t.includes('learn')) {
    return <BookOpen className={iconClass} />
  }
  if (t.includes('exercise') || t.includes('gym') || t.includes('workout') || t.includes('fit')) {
    return <Dumbbell className={iconClass} />
  }
  return <Rocket className={iconClass} />
}

export default function DashboardGoals({ goals, isLoading, error, delay = 0 }) {

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        className="rounded-2xl p-5 flex flex-col justify-center items-center min-h-[250px]"
        style={{
          background: 'rgba(9,14,26,0.55)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(244,63,94,0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
        <p className="text-sm font-semibold text-slate-200">Failed to load goals</p>
        <p className="text-xs text-slate-500 mt-1 mb-4 text-center">There was an issue reaching the server.</p>
        <button onClick={() => window.location.reload()} className="btn-secondary py-1.5 px-4 text-xs">Retry</button>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        className="rounded-2xl p-5 flex flex-col min-h-[250px]"
        style={{
          background: 'rgba(9,14,26,0.55)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-100">Active Goals</h3>
          <div className="w-14 h-4 skeleton rounded" />
        </div>
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-14 skeleton rounded-xl" />
          ))}
        </div>
      </motion.div>
    )
  }

  const activeGoals = (goals || []).filter(g => g.status === 'active').slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-2xl p-5 flex flex-col min-h-[250px]"
      style={{
        background: 'rgba(9,14,26,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-100">Active Goals</h3>
        <Link to="/goals" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
          View all
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        {activeGoals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No active goals</p>
              <p className="text-xs text-slate-500 mt-0.5">Set a target to focus your energy.</p>
            </div>
            <Link to="/goals" className="btn-primary py-1.5 px-4 text-xs mt-2">
              <Plus className="w-3.5 h-3.5" />
              Create Goal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map(goal => {
              const progressPct = Math.min(Math.max((goal.progress / goal.target) * 100, 0), 100)

              return (
                <div
                  key={goal.id}
                  className="group rounded-xl p-3.5 hover:border-white/10 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Title row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 text-violet-400">
                      <GoalIcon title={goal.title} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 flex-1 line-clamp-1">{goal.title}</p>
                    <span className="text-sm font-bold text-violet-400 shrink-0">
                      {Math.round(progressPct)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-surface-900/80 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
                        boxShadow: '0 0 8px rgba(139,92,246,0.4)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Meta */}
                  {goal.deadline && (
                    <p className="text-2xs text-slate-600 mt-2">
                      Due {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
