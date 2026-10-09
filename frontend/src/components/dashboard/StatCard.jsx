import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import clsx from 'clsx'

// Tiny sparkline chart matching the reference screenshot style
function Sparkline({ color = '#8b5cf6' }) {
  // Generic wave shape — purely decorative, no fake data
  const data = [
    { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }, { v: 40 }, { v: 60 }, { v: 50 },
  ]
  return (
    <div className="w-20 h-10 opacity-70">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace('#','')})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const colorConfig = {
  primary: { icon: 'bg-violet-500/20 text-violet-400 border-violet-500/30', spark: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  emerald: { icon: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', spark: '#34d399', glow: 'rgba(52,211,153,0.15)' },
  rose:    { icon: 'bg-rose-500/20 text-rose-400 border-rose-500/30',    spark: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
  amber:   { icon: 'bg-amber-500/20 text-amber-400 border-amber-500/30', spark: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  violet:  { icon: 'bg-violet-500/20 text-violet-400 border-violet-500/30', spark: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  cyan:    { icon: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',    spark: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,         // { value: 12, label: "from yesterday", direction: 'up' | 'down' | 'neutral' }
  color = 'primary',
  delay = 0,
  showSparkline = true,
}) {
  const cfg = colorConfig[color] || colorConfig.primary

  const trendColor = trend?.direction === 'up'   ? 'text-emerald-400'
                   : trend?.direction === 'down' ? 'text-rose-400'
                   : 'text-slate-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 cursor-default"
      style={{
        background: 'rgba(9,14,26,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${cfg.glow}`,
      }}
    >
      {/* Top row: title + icon */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight leading-none mt-2">{value}</h3>
        </div>

        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center border shrink-0',
          cfg.icon,
        )}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Bottom row: trend + sparkline */}
      <div className="flex items-end justify-between mt-auto">
        {trend ? (
          <div className={clsx('flex items-center gap-1 text-xs font-medium', trendColor)}>
            {trend.direction === 'up'   && <TrendingUp   className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <TrendingDown  className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus      className="w-3.5 h-3.5" />}
            <span>{trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{Math.abs(trend.value)}% </span>
            <span className="text-slate-500 font-normal">{trend.label}</span>
          </div>
        ) : (
          <div /> /* spacer */
        )}

        {showSparkline && <Sparkline color={cfg.spark} />}
      </div>
    </motion.div>
  )
}
