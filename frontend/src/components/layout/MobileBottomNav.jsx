import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Target,
  Flame,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_TABS = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { to: '/checkin',   label: 'Check-in', icon: Target, isPrimary: true },
  { to: '/goals',     label: 'Goals',    icon: Flame },
  { to: '/journal',   label: 'Journal',  icon: BookOpen },
  { to: '/replay',    label: 'AI Replay', icon: Sparkles },
]

export default function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="Mobile Navigation"
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 z-40',
        'border-t border-white/[0.08]',
        'select-none'
      )}
      style={{
        background: 'rgba(9, 14, 26, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {NAV_TABS.map(({ to, label, icon: Icon, isPrimary }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 group min-h-[48px] touch-manipulation',
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {/* Highlight pill / glow for active tab */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className={clsx(
                    'absolute inset-x-2 -top-1 bottom-1 rounded-xl pointer-events-none',
                    isPrimary
                      ? 'bg-violet-500/20 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                      : 'bg-white/[0.06] border border-white/10'
                  )}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              {/* Icon container */}
              <div
                className={clsx(
                  'relative z-10 flex items-center justify-center w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110',
                  isPrimary && !isActive && 'text-violet-400'
                )}
              >
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-colors duration-200',
                    isActive
                      ? (isPrimary ? 'text-violet-300' : 'text-violet-400')
                      : 'text-slate-400 group-hover:text-slate-200'
                  )}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'relative z-10 text-[10px] tracking-tight mt-1 font-medium transition-colors duration-200 truncate max-w-[64px]',
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                )}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
