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
    <div className="fixed inset-0 z-[-5] pointer-events-none overflow-hidden bg-[#0a0a0f]">
      {/* 
        CRITICAL: The cinematic background image requested by the user. 
        It covers the entire viewport and remains fixed.
        We use AnimatePresence for smooth crossfades between pages.
      */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentBackground}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url('${currentBackground}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />
      </AnimatePresence>

      {/* 
        Dark translucent overlay to ensure text and cards remain readable.
        This creates the premium, slightly dimmed atmosphere without hiding the image.
      */}
      <div className="absolute inset-0 bg-surface-950/40" />
      
      {/* 
        Subtle gradient to help with sidebar and topbar contrast, 
        but very gentle so the image stays visible.
      */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-950/70 via-surface-950/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950/60 via-transparent to-surface-950/40" />

      {/* Very subtle ambient lighting to enhance the premium feel, but not overpower the image */}
      <div className="absolute top-0 right-[10%] w-[40%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(251, 146, 60, 0.05)' }} />

      <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(139, 92, 246, 0.08)' }} />
    </div>
  )
}
