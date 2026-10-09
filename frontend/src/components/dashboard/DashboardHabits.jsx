import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertCircle, Plus, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { habitsApi } from '../../api/habitsApi'
import { useNotification } from '../../context/NotificationContext'
import clsx from 'clsx'

const glassBase = {
  background: 'rgba(9,14,26,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
}

export default function DashboardHabits({ habits: initialHabits, isLoading, error, delay = 0 }) {
  const [habits, setHabits] = useState([])
  const [loadingIds, setLoadingIds] = useState(new Set())
  const { error: notifyError } = useNotification()

  useEffect(() => {
    if (initialHabits) {
      setHabits(initialHabits.filter(h => h.status !== 'archived').slice(0, 5))
    }
  }, [initialHabits])

  const handleToggle = async (habit) => {
    if (loadingIds.has(habit.id)) return

    const newCompletedState = !habit.completed_today

    // Optimistic update
    setHabits(current =>
      current.map(h => {
        if (h.id === habit.id) {
          return {
            ...h,
            completed_today: newCompletedState,
            current_streak: newCompletedState ? h.current_streak + 1 : Math.max(0, h.current_streak - 1)
          }
        }
        return h
      })
    )

    setLoadingIds(prev => new Set(prev).add(habit.id))

    try {
      const result = await habitsApi.recordCompletion(habit.id, { completed: newCompletedState })
      setHabits(current =>
        current.map(h => h.id === habit.id ? result : h)
      )
    } catch (err) {
      console.error('Failed to toggle habit', err)
      notifyError('Failed to update habit', 'Please try again.')
      // Rollback
      setHabits(current =>
        current.map(h => {
          if (h.id === habit.id) {
            return {
              ...h,
              completed_today: !newCompletedState,
              current_streak: !newCompletedState ? h.current_streak + 1 : Math.max(0, h.current_streak - 1)
            }
          }
          return h
        })
      )
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(habit.id)
        return next
      })
    }
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        className="rounded-2xl p-5 flex flex-col justify-center items-center min-h-[250px]"
        style={{ ...glassBase, border: '1px solid rgba(244,63,94,0.2)' }}
      >
        <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
        <p className="text-sm font-semibold text-slate-200">Failed to load habits</p>
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
        style={glassBase}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-100">Today's Habits</h3>
          <div className="w-10 h-4 skeleton rounded" />
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-full h-11 skeleton rounded-xl" />
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-2xl p-5 flex flex-col min-h-[250px]"
      style={glassBase}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-100">Today's Habits</h3>
        <Link to="/habits" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
          View all
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        {habits.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No habits scheduled</p>
              <p className="text-xs text-slate-500 mt-0.5">Build a routine to stay on track.</p>
            </div>
            <Link to="/habits" className="btn-primary py-1.5 px-4 text-xs mt-2">
              <Plus className="w-3.5 h-3.5" />
              Create Habit
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map(habit => {
              const isDone = habit.completed_today
              const isLoadingToggle = loadingIds.has(habit.id)

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between py-2 px-1 rounded-xl group transition-all duration-200 hover:bg-white/3"
                >
                  {/* Left: checkbox + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Circular checkbox — matches reference */}
                    <button
                      onClick={() => handleToggle(habit)}
                      disabled={isLoadingToggle}
                      className={clsx(
                        'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                        isLoadingToggle ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 cursor-pointer',
                        isDone
                          ? 'bg-violet-600 border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                          : 'bg-transparent border-slate-600 hover:border-slate-400',
                      )}
                    >
                      {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>

                    <p className={clsx(
                      'text-sm font-medium line-clamp-1 transition-colors',
                      isDone ? 'text-slate-500 line-through' : 'text-slate-200'
                    )}>
                      {habit.name}
                    </p>
                  </div>

                  {/* Right: streak */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Flame className={clsx('w-3.5 h-3.5', isDone ? 'text-orange-400' : 'text-slate-600')} />
                    <span className={clsx('text-xs font-semibold', isDone ? 'text-orange-400' : 'text-slate-500')}>
                      {habit.current_streak}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
