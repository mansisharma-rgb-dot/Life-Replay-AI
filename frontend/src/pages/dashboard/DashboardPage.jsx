import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckCircle2, Target, Droplets, Clock, Quote } from 'lucide-react'
import { checkinApi } from '../../api/checkinApi'
import { analyticsApi } from '../../api/analyticsApi'
import { goalsApi } from '../../api/goalsApi'
import { habitsApi } from '../../api/habitsApi'
import { useAuth } from '../../context/AuthContext'

// Dashboard Components
import StatCard from '../../components/dashboard/StatCard'
import GamificationCard from '../../components/dashboard/GamificationCard'
import {
  WeeklyProductivityChart,
  MonthlyGrowthChart,
} from '../../components/dashboard/ChartCard'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import DashboardGoals from '../../components/dashboard/DashboardGoals'
import DashboardHabits from '../../components/dashboard/DashboardHabits'
import AIInsightsCard from '../../components/dashboard/AIInsightsCard'

// ─── Time-based greeting ──────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// ─── Inspirational Quote Card ─────────────────────────────────────────────────
function QuoteCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      className="hidden lg:flex flex-col justify-center p-5 rounded-2xl max-w-[240px] shrink-0"
      style={{
        background: 'rgba(9,14,26,0.60)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <Quote className="w-6 h-6 text-violet-500 mb-3 opacity-80" />
      <p className="text-sm font-medium text-slate-200 leading-relaxed mb-3">
        The best way to predict your future is to create it.
      </p>
      <p className="text-xs text-slate-500 font-medium">— Peter Drucker</p>
    </motion.div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const greeting  = getGreeting()

  const [todayData, setTodayData] = useState(null)

  // Real Analytics States
  const [productivity,  setProductivity]  = useState([])
  const [monthlyGrowth, setMonthlyGrowth] = useState([])

  // Real Goals & Habits
  const [goals,         setGoals]         = useState([])
  const [habits,        setHabits]        = useState([])
  const [goalsLoading,  setGoalsLoading]  = useState(true)
  const [habitsLoading, setHabitsLoading] = useState(true)
  const [goalsError,    setGoalsError]    = useState(false)
  const [habitsError,   setHabitsError]   = useState(false)

  useEffect(() => {
    // Today's check-in
    checkinApi.getToday().then(res => {
      const data = (res && res.data !== undefined) ? res.data : res
      if (data) setTodayData(data)
    }).catch(err => console.error('Failed to fetch today checkin', err))

    // Goals and Habits
    Promise.allSettled([
      goalsApi.getGoals(),
      habitsApi.getHabits()
    ]).then(([goalsRes, habitsRes]) => {
      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value || [])
        setGoalsError(false)
      } else {
        setGoalsError(true)
      }
      setGoalsLoading(false)

      if (habitsRes.status === 'fulfilled') {
        setHabits(habitsRes.value || [])
        setHabitsError(false)
      } else {
        setHabitsError(true)
      }
      setHabitsLoading(false)
    })

    // Analytics
    const fetchAnalytics = async () => {
      try {
        const [prodData7d, lifeScoreData] = await Promise.allSettled([
          analyticsApi.getProductivityAnalytics('7d'),
          analyticsApi.getLifeScoreAnalytics('30d'),
        ])

        if (prodData7d.status === 'fulfilled' && prodData7d.value?.history) {
          setProductivity(prodData7d.value.history.map(d => {
            let dayName = d.day;
            if (!dayName && d.date) {
              const parts = d.date.split('T')[0].split('-');
              if (parts.length === 3) {
                const [y, m, day] = parts.map(Number);
                dayName = new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
              }
            }
            return {
              day:   dayName || 'Day',
              tasks: d.tasks || 0,
              focus: d.focus || 0,
            };
          }))
        }

        if (lifeScoreData.status === 'fulfilled' && lifeScoreData.value?.history?.length > 0) {
          setMonthlyGrowth(lifeScoreData.value.history.map(d => {
            let monthLabel = '';
            if (d.date) {
              const parts = d.date.split('T')[0].split('-');
              if (parts.length === 3) {
                const [y, m, day] = parts.map(Number);
                monthLabel = new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
            }
            return {
              month:         monthLabel || d.date,
              score:         d.score,
              movingAverage: d.movingAverage,
            };
          }))
        }
      } catch (err) {
        console.error('Failed to fetch dashboard analytics', err)
      }
    }

    fetchAnalytics()
  }, [])

  // Real metrics
  const lifeScore      = todayData?.life_score?.total_score || 0
  const studyHours     = Number(todayData?.activities?.study_hours) || 0
  const workHours      = Number(todayData?.activities?.work_hours) || 0
  const deepWork       = studyHours + workHours
  const deepWorkDisplay = deepWork > 0 ? (Number.isInteger(deepWork) ? String(deepWork) : deepWork.toFixed(1)) : '0'

  const completedHabitLogsCount = Array.isArray(todayData?.habit_logs)
    ? todayData.habit_logs.filter(log => log.completed).length
    : 0
  const completedHabitsListCount = Array.isArray(habits)
    ? habits.filter(h => h.completed_today).length
    : 0
  const tasksCompleted = Math.max(completedHabitLogsCount, completedHabitsListCount)

  const waterMl        = Number(todayData?.activities?.water_intake_ml) || 0
  const waterL         = waterMl > 0 ? (waterMl % 1000 === 0 ? String(waterMl / 1000) : (waterMl / 1000).toFixed(1)) : '0'

  return (
    <div className="space-y-5 pb-8">

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(12, 10, 22, 0.40)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Subtle purple glow top-right */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/15 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 sm:p-6 lg:p-8">
          {/* Left: Greeting */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-1">
              {greeting}, {firstName}{' '}
              <span className="inline-block animate-bounce-subtle">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Here's your journey overview for today
            </p>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 mt-4 sm:mt-5">
              <Link to="/checkin" className="btn-primary py-2.5 px-4 text-xs sm:text-sm justify-center">
                <Target className="w-4 h-4 shrink-0" />
                <span className="truncate">Start Check-in</span>
              </Link>
              <Link
                to="/replay"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 active:scale-95 transition-all duration-200"
              >
                <span className="text-sm">✨</span>
                <span className="truncate">AI Replay</span>
              </Link>
            </div>
          </div>

          {/* Right: Quote card */}
          <QuoteCard />
        </div>
      </motion.div>

      {/* ── Row 1: 4 Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <GamificationCard delay={0.05} />
        <StatCard
          title="Tasks Completed"
          value={String(tasksCompleted)}
          icon={CheckCircle2}
          color="emerald"
          trend={tasksCompleted > 0 ? { value: 20, label: 'from yesterday', direction: 'up' } : undefined}
          delay={0.10}
        />
        <StatCard
          title="Water Intake"
          value={`${waterL} L`}
          icon={Droplets}
          color="cyan"
          trend={waterMl > 0 ? { value: 10, label: 'from yesterday', direction: 'up' } : undefined}
          delay={0.15}
        />
        <StatCard
          title="Deep Work"
          value={`${deepWorkDisplay} h`}
          icon={Clock}
          color="primary"
          trend={deepWork > 0 ? { value: 15, label: 'from yesterday', direction: 'up' } : undefined}
          delay={0.20}
        />
      </div>

      {/* ── Row 2: Growth Overview (large) + Active Goals + Today's Habits ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <MonthlyGrowthChart data={monthlyGrowth} delay={0.25} className="h-full min-h-[320px]" />
        </div>

        {/* Active Goals */}
        <div className="lg:col-span-1">
          <DashboardGoals goals={goals} isLoading={goalsLoading} error={goalsError} delay={0.30} />
        </div>

        {/* Today's Habits */}
        <div className="lg:col-span-1">
          <DashboardHabits habits={habits} isLoading={habitsLoading} error={habitsError} delay={0.35} />
        </div>
      </div>

      {/* ── Row 3: Activity Feed + Weekly Productivity + AI Insights ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 min-h-[320px]">
          <ActivityFeed delay={0.40} />
        </div>
        <div className="lg:col-span-1 min-h-[320px]">
          <WeeklyProductivityChart data={productivity} delay={0.45} />
        </div>
        <div className="lg:col-span-1 min-h-[320px]">
          <AIInsightsCard delay={0.50} />
        </div>
      </div>

    </div>
  )
}
