import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Star, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { gamificationApi } from '../../api/gamificationApi'

export default function GamificationCard({ delay = 0 }) {
  const [profile, setProfile] = useState(null)
  
  useEffect(() => {
    gamificationApi.getProfile()
      .then(data => setProfile(data))
      .catch(err => console.error("Failed to fetch gamification profile", err))
  }, [])

  if (!profile) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 min-h-[160px] animate-pulse"
           style={{ background: 'rgba(9,14,26,0.55)', backdropFilter: 'blur(20px)' }}>
        <div className="h-4 w-24 bg-slate-700/50 rounded mb-2"></div>
        <div className="h-10 w-32 bg-slate-700/50 rounded"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3 group"
      style={{
        background: 'rgba(9,14,26,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.15)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-violet-400 uppercase tracking-wider mb-0.5 truncate">Level {profile.level}</p>
          <div className="flex items-end gap-1.5 mt-0.5 sm:mt-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none truncate">{profile.total_xp.toLocaleString()}</h3>
            <span className="text-xs sm:text-sm text-slate-400 font-medium mb-0.5">XP</span>
          </div>
        </div>
        
        <Link to="/progress" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 hover:bg-violet-500/20 active:scale-95 transition-all" aria-label="View Progress">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-1 relative z-10">
        <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1.5">
          <span>{profile.current_level_xp} XP</span>
          <span>{profile.next_level_xp - (profile.total_xp - profile.current_level_xp)} XP</span>
        </div>
        <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${profile.progress_percent}%` }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto pt-2 relative z-10 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400">
          <Flame className="w-4 h-4" />
          <span>{profile.current_streak} Day Streak</span>
        </div>
        {profile.recent_rewards?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium truncate max-w-[130px]" title={profile.recent_rewards[0].description}>
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+{profile.recent_rewards[0].xp_amount} XP</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
