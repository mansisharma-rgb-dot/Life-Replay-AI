import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts'
import clsx from 'clsx'

// ─── Glass base style ─────────────────────────────────────────────────────────
const GLASS_STYLE = {
  background: 'rgba(9,14,26,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 shadow-modal" style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs font-semibold text-slate-100 mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// ─── Base Card Wrapper ────────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, children, delay = 0, className, headerRight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={clsx('rounded-2xl p-5 flex flex-col', className)}
      style={GLASS_STYLE}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className="flex-1 min-h-[200px] w-full">
        {children}
      </div>
    </motion.div>
  )
}

// ─── Growth Overview Chart (Area) — matches reference "+23% Overall improvement" ──
export function MonthlyGrowthChart({ data, delay, className }) {
  const isEmpty = !data || data.length === 0

  // Calculate simple improvement if data exists
  const improvement = (() => {
    if (!data || data.length < 2) return null
    const first = data[0]?.score || 0
    const last  = data[data.length - 1]?.score || 0
    if (first === 0) return null
    return Math.round(((last - first) / first) * 100)
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={clsx('rounded-2xl p-5 flex flex-col', className)}
      style={GLASS_STYLE}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-100">Growth Overview</h3>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 border border-white/8"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          This Month
          <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* Big metric */}
      {!isEmpty && improvement !== null && (
        <div className="mb-4">
          <span className="text-3xl font-bold text-emerald-400">
            {improvement >= 0 ? '+' : ''}{improvement}%
          </span>
          <p className="text-xs text-slate-500 mt-0.5">Overall improvement</p>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">No data yet</p>
            <p className="text-xs text-slate-500 mt-0.5">Life Score history will appear after your first check-in</p>
          </div>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              Productivity
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Well-being
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Focus
            </div>
          </div>

          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="score" name="Life Score"
                  stroke="#8b5cf6" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#colorScore)"
                  dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'rgba(139,92,246,0.4)', strokeWidth: 4 }}
                />
                <Area
                  type="monotone" dataKey="movingAverage" name="3-Day Avg"
                  stroke="#22d3ee" strokeWidth={2}
                  fillOpacity={1} fill="url(#colorAvg)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </motion.div>
  )
}

// ─── Weekly Productivity (Bar) — matches reference "88%" style ───────────────
export function WeeklyProductivityChart({ data, delay }) {
  const isEmpty = !data || data.length === 0

  // Calculate weekly avg tasks if data exists
  const avgTasks = (() => {
    if (!data || data.length === 0) return null
    const total = data.reduce((sum, d) => sum + (d.tasks || 0), 0)
    const max   = data.reduce((m, d) => Math.max(m, d.tasks || 0), 1)
    if (max === 0) return null
    return Math.round((total / (data.length * max)) * 100)
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-2xl p-5 flex flex-col"
      style={GLASS_STYLE}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-100">Weekly Productivity</h3>
        <Link 
          to="/time-analysis"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          title="View Time Analysis"
        >
          This Week
          <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </Link>
      </div>

      {/* Big percentage */}
      {!isEmpty && avgTasks !== null && (
        <div className="mb-3">
          <span className="text-3xl font-bold text-emerald-400">{avgTasks}%</span>
          <p className="text-xs text-slate-500 mt-0.5">Task completion rate</p>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
          <p className="text-sm font-medium text-slate-400">No data yet</p>
          <p className="text-xs text-slate-500">Complete check-ins to see productivity trends.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
              <Bar dataKey="tasks" name="Tasks" fill="#7c3aed" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(139,92,246,${0.5 + (entry.tasks / (Math.max(...data.map(d => d.tasks || 1)) || 1)) * 0.5})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

// ─── Mood Trend (Line) ────────────────────────────────────────────────────────
export function MoodTrendChart({ data, delay }) {
  return (
    <ChartCard title="Mood Trend" subtitle="7-day mood variations" delay={delay}>
      {(!data || data.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center min-h-[160px]">
          <p className="text-sm font-medium text-slate-400">No mood data yet</p>
          <p className="text-xs text-slate-500">Complete check-ins to track your mood.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="mood" name="Mood Level"
              stroke="#f43f5e" strokeWidth={2.5}
              dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f43f5e', stroke: 'rgba(244,63,94,0.4)', strokeWidth: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

// ─── Time Distribution (Pie) ──────────────────────────────────────────────────
export function TimeDistributionChart({ data, delay }) {
  const COLORS = ['#8b5cf6', '#22d3ee', '#34d399', '#f59e0b', '#f43f5e']

  return (
    <ChartCard title="Time Distribution" subtitle="Where your hours went" delay={delay}>
      {(!data || data.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center min-h-[160px]">
          <p className="text-sm font-medium text-slate-400">No data yet</p>
          <p className="text-xs text-slate-500">Activity breakdown appears after check-ins.</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  )
}

// ─── Skill Progress Chart ─────────────────────────────────────────────────────
export function SkillProgressChart({ data, delay }) {
  return (
    <ChartCard title="Skill Matrix" subtitle="Current skill distribution" delay={delay}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Skill Level" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Skill Coming Soon ────────────────────────────────────────────────────────
export function SkillComingSoon({ delay }) {
  return (
    <ChartCard title="Skill Matrix" subtitle="Skill-specific progress tracking" delay={delay}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center min-h-[180px]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700/60" />
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-slate-700/40" />
          <div className="absolute inset-8 rounded-full border border-dashed border-slate-700/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-7 h-7 text-violet-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">Coming Soon</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[160px] mx-auto leading-relaxed">
            Skill tracking will appear once skill logging is added to check-ins.
          </p>
        </div>
        <span className="text-2xs px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400">
          Planned Feature
        </span>
      </div>
    </ChartCard>
  )
}
