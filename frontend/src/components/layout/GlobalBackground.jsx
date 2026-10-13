import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

export default function GlobalBackground() {
  const location = useLocation()
  
  const currentBackground = useMemo(() => {
    const path = location.pathname
    
    // Auth
    if (path.includes('login')) return '/assets/backgrounds/login-bg.jpg'
    
    // Core Modules
    if (path.includes('dashboard')) return '/assets/backgrounds/dashboard-bg.jpg'
    if (path.includes('checkin')) return '/assets/backgrounds/checkin-bg.jpg'
    if (path.includes('profile')) return '/assets/backgrounds/profile-bg.jpg'
    
    // Trackers
    if (path.includes('goals')) return '/assets/backgrounds/goals-bg.jpg'
    if (path.includes('habits')) return '/assets/backgrounds/habits-bg.jpg'
    if (path.includes('journal')) return '/assets/backgrounds/journal-bg.jpg'
    if (path.includes('calendar')) return '/assets/backgrounds/calendar-bg.jpg'
    if (path.includes('skills')) return '/assets/backgrounds/skills-bg.jpg'
    
    // Analytics & Data
    if (path.includes('analytics')) return '/assets/backgrounds/analytics-bg.jpg'
    if (path.includes('correlations')) return '/assets/backgrounds/correlations-bg.jpg'
    if (path.includes('time-analysis')) return '/assets/backgrounds/time-analysis-bg.jpg'
    
    // Memories & Intelligence
    if (path.includes('memories')) return '/assets/backgrounds/memories-bg.jpg'
    if (path.includes('replay')) return '/assets/backgrounds/replay-bg.jpg'
    if (path.includes('history')) return '/assets/backgrounds/history-bg.jpg'
    if (path.includes('achievements')) return '/assets/backgrounds/achievements-bg.jpg'
    if (path.includes('predictions') || path.includes('goal-predictions')) return '/assets/backgrounds/predictions-bg.jpg'
    
    // Gamification & Communication
    if (path.includes('notifications')) return '/assets/backgrounds/notifications-bg.jpg'
    if (path.includes('progress') || path.includes('gamification')) return '/assets/backgrounds/progress-bg.jpg'
    if (path.includes('reports') || path.includes('monthly-report')) return '/assets/backgrounds/reports-bg.jpg'
    
    // AI
    if (path.includes('insights') || path.includes('ai-analyzer')) return '/assets/backgrounds/ai-bg.jpg'
    
    return '/assets/backgrounds/dashboard-bg.jpg' // Default fallback
  }, [location.pathname])

  return (
    <div className="fixed inset-0 z-[-5] pointer-events-none overflow-hidden bg-[#0c0a1a]">
      {/* 
        Reference Ambiance: Deep midnight purple/indigo canvas with soft celestial glow at top-right
      */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(circle at 85% 10%, rgba(139, 92, 246, 0.22) 0%, rgba(20, 16, 45, 0.4) 45%, transparent 70%), radial-gradient(circle at 10% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), #0c0a1a',
        }}
      />

      {/* Subtle dynamic background crossfade */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentBackground}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full mix-blend-overlay"
          style={{
            backgroundImage: `url('${currentBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      </AnimatePresence>

      {/* Subtle ambient lighting matching Image 1 & 2 */}
      <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(167, 139, 250, 0.15)' }} />

      <div className="absolute bottom-10 left-0 w-72 h-72 rounded-full blur-[110px] pointer-events-none"
        style={{ background: 'rgba(108, 82, 212, 0.12)' }} />
    </div>
  )
}
