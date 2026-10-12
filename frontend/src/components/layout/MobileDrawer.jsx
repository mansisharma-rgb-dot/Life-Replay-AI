import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Target,
  Flame,
  BarChart3,
  Sparkles,
  User,
  Calendar,
  Trophy,
  TrendingUp,
  Brain,
  FolderHeart,
  Clock,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const DRAWER_GROUPS = [
  {
    group: 'MAIN',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/checkin',   icon: Target,           label: 'Daily Check-in' },
      { to: '/history',   icon: BookOpen,         label: 'History' },
      { to: '/calendar',  icon: Calendar,         label: 'Calendar' },
    ],
  },
  {
    group: 'GROWTH',
    items: [
      { to: '/goals',        icon: Target,      label: 'Goals' },
      { to: '/habits',       icon: Flame,       label: 'Habits' },
      { to: '/journal',      icon: BookOpen,    label: 'Journal' },
      { to: '/progress',     icon: TrendingUp,  label: 'Progress' },
      { to: '/memories',     icon: FolderHeart, label: 'Memories' },
      { to: '/achievements', icon: Trophy,      label: 'Achievements' },
      { to: '/skills',       icon: TrendingUp,  label: 'Skill Growth' },
    ],
  },
  {
    group: 'ANALYTICS',
    items: [
      { to: '/analytics',     icon: BarChart3, label: 'Analytics' },
      { to: '/time-analysis', icon: Clock,     label: 'Time Analysis' },
    ],
  },
  {
    group: 'AI & INTELLIGENCE',
    items: [
      { to: '/insights',         icon: Brain,     label: 'AI Growth Analyzer', badge: 'NEW' },
      { to: '/goal-predictions', icon: Target,    label: 'AI Future Goals',    badge: 'NEW' },
      { to: '/replay',           icon: Sparkles,  label: 'AI Replay',          badge: 'NEW' },
      { to: '/reports/monthly',  icon: BookOpen,  label: 'Monthly Report',     badge: 'NEW' },
    ],
  },
]

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    onClose()
    await logout()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={clsx(
              'md:hidden fixed top-0 bottom-0 left-0 z-50',
              'w-[82vw] max-w-[320px]',
              'flex flex-col select-none',
              'border-r border-white/10'
            )}
            style={{
              background: 'rgba(12, 10, 22, 0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '8px 0 40px rgba(0,0,0,0.7)',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-800/80 border border-violet-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] overflow-hidden">
                  <img
                    src="/logo-icon.png"
                    alt="Life Replay AI"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">Life Replay AI</p>
                  <p className="text-[10px] text-violet-300/80 font-medium tracking-wide">Personal Growth</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto scroll-area py-3 px-3 space-y-5">
              {DRAWER_GROUPS.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(({ to, icon: Icon, label, badge }) => {
                      const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

                      return (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={onClose}
                          className={clsx(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150',
                            isActive
                              ? 'bg-violet-600/25 text-white border border-violet-500/40 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={clsx(
                                'w-4 h-4',
                                isActive ? 'text-violet-400' : 'text-slate-400'
                              )}
                              strokeWidth={isActive ? 2.3 : 1.9}
                            />
                            <span className="text-sm">{label}</span>
                          </div>
                          {badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {badge}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Footer */}
            <div className="p-3 border-t border-white/[0.08] bg-surface-950/40">
              <NavLink
                to="/profile"
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-1',
                  location.pathname === '/profile'
                    ? 'bg-violet-600/25 text-white border border-violet-500/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
              >
                <User className="w-4 h-4 text-violet-400" />
                <div className="flex-1 truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'My Profile'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Settings'}</p>
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
