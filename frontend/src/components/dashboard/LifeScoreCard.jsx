import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

export default function LifeScoreCard({ score, delay = 0 }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

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
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.15)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Life Score</p>
          <h3 className="text-3xl font-bold text-white tracking-tight leading-none mt-2">{score || 0}</h3>
        </div>

        {/* Circular progress ring in top-right */}
        <div className="relative w-9 h-9 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} className="stroke-slate-700/50 fill-none" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r={radius}
              className="fill-none"
              stroke="#8b5cf6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, delay: delay + 0.2, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.6))' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between mt-auto">
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
          <span>↑ </span>
          <span className="text-slate-500 font-normal">
            {score > 0 ? 'Based on today\'s check-in' : 'Complete a check-in to track'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
