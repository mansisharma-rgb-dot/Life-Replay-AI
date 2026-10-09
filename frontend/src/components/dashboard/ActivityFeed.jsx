import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Trophy, Loader2, Target, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { checkinApi } from '../../api/checkinApi'
import { analyticsApi } from '../../api/analyticsApi'
import { goalsApi } from '../../api/goalsApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const date   = new Date(dateStr)
  const now    = new Date()
  const diffMs = now - date
  const diffH  = Math.floor(diffMs / (1000 * 60 * 60))
  const diffD  = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffH < 1)  return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  if (diffD === 1) return 'Yesterday'
  if (diffD < 7)  return `${diffD} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildCheckinEvents(items) {
  const events = []
  for (const item of items) {
    if (!item.is_completed) continue
    events.push({
      id:          `checkin-${item.id}`,
      title:       'Daily Check-in',
      description: 'Completed your daily check-in',
      time:        item.date,
      icon:        CheckCircle2,
      color:       'blue',
      emoji:       '✅',
    })
    if (item.summary?.journal_title) {
      events.push({
        id:          `journal-${item.id}`,
        title:       'New Journal Entry',
        description: `"${item.summary.journal_title}"`,
        time:        item.date,
        icon:        BookOpen,
        color:       'violet',
        emoji:       '📓',
      })
    }
  }
  return events
}

function buildAchievementEvents(recent) {
  return (recent || []).map(a => ({
    id:          `achievement-${a.id}`,
    title:       `Achievement Unlocked 🏆`,
    description: a.name,
    time:        a.date,
    icon:        Trophy,
    color:       'amber',
    emoji:       '🏆',
  }))
}

function buildGoalEvents(goals) {
  return (goals || []).map(g => ({
    id:          `goal-${g.id}`,
    title:       'Goal Created! 🎉',
    description: g.title,
    time:        g.created_at,
    icon:        Target,
    color:       'emerald',
    emoji:       '🎯',
  })).filter(e => e.time)
}

const colorMap = {
  blue:    { bg: 'bg-blue-500/20',    text: 'text-blue-400',    border: 'border-blue-500/30'    },
  violet:  { bg: 'bg-violet-500/20',  text: 'text-violet-400',  border: 'border-violet-500/30'  },
  amber:   { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30'   },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rose:    { bg: 'bg-rose-500/20',    text: 'text-rose-400',    border: 'border-rose-500/30'    },
}

// ─── Main ActivityFeed ────────────────────────────────────────────────────────
export default function ActivityFeed({ delay = 0 }) {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchActivities = async () => {
      setLoading(true)
      setError(null)
      try {
        const [historyRes, achievementsRes, goalsRes] = await Promise.allSettled([
          checkinApi.getHistory(1, 10),
          analyticsApi.getAchievements(),
          goalsApi.getGoals(),
        ])

        if (cancelled) return

        let events = []

        if (historyRes.status === 'fulfilled' && historyRes.value?.items) {
          events = events.concat(buildCheckinEvents(historyRes.value.items))
        }
        if (achievementsRes.status === 'fulfilled' && achievementsRes.value?.recent) {
          events = events.concat(buildAchievementEvents(achievementsRes.value.recent))
        }
        if (goalsRes.status === 'fulfilled' && goalsRes.value) {
          events = events.concat(buildGoalEvents(goalsRes.value))
        }

        events.sort((a, b) => new Date(b.time) - new Date(a.time))
        setActivities(events.slice(0, 6))
      } catch {
        if (!cancelled) setError('Could not load activity.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchActivities()
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-2xl p-5 h-full flex flex-col"
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
        <h3 className="text-sm font-semibold text-slate-100">Activity Feed</h3>
        <Link to="/history" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
          View all
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full min-h-[160px]">
            <p className="text-xs text-slate-500 text-center">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-slate-700" />
            <div>
              <p className="text-sm font-medium text-slate-400">No recent activity yet</p>
              <p className="text-xs text-slate-600 mt-0.5">Complete your first daily check-in to start tracking.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const c = colorMap[activity.color] || colorMap.violet
              return (
                <div key={activity.id} className="flex items-start gap-3 group">
                  {/* Icon */}
                  <div className={clsx(
                    'w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200',
                    c.bg, c.border,
                    'group-hover:scale-110',
                  )}
                    style={{ boxShadow: '0 0 8px rgba(139,92,246,0.2)' }}
                  >
                    <activity.icon className={clsx('w-3.5 h-3.5', c.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-2xs text-slate-600 shrink-0 mt-0.5">{relativeTime(activity.time)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
