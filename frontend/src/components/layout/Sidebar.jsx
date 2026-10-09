import { useState } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Zap,
  Calendar,
  Trophy,
  TrendingUp,
  Brain,
  FolderHeart,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Navigation config matching the reference screenshot ─────────────────────
const NAV_ITEMS = [
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
      { to: '/insights',         icon: Brain,     label: 'AI Growth Analyzer', badge: 'NEW', badgeClass: 'badge-primary', highlight: true },
      { to: '/goal-predictions', icon: Target,    label: 'AI Future Goals',    badge: 'NEW', badgeClass: 'badge-primary' },
      { to: '/replay',           icon: Sparkles,  label: 'AI Replay',          badge: 'NEW', badgeClass: 'badge-violet' },
      { to: '/reports/monthly',  icon: BookOpen,  label: 'Monthly Report',     badge: 'NEW', badgeClass: 'badge-violet' },
    ],
  },
]

// ─── Logo ─────────────────────────────────────────────────────────────────────
function SidebarLogo({ collapsed }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
      <div className={clsx(
        'relative shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center',
        'bg-surface-800/80 border border-violet-500/30',
        'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
        'transition-all duration-300',
      )}>
        <img
          src="/logo-icon.png"
          alt="Life Replay AI Logo"
          className="w-full h-full object-cover"
        />
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900 animate-pulse" />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{    opacity: 0, width: 0      }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm font-bold text-white leading-none">Life Replay AI</p>
            <p className="text-2xs text-violet-300/80 mt-1 font-medium tracking-wide">Personal Growth Analyzer</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Single Nav Item ──────────────────────────────────────────────────────────
function SideNavItem({ item, collapsed }) {
  const { to, icon: Icon, label, badge, badgeClass, highlight, hidden } = item
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  // For "hidden" items that are navigation-only (no real route yet), keep them as nav links
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive: active }) =>
        clsx(
          'relative flex items-center gap-3 rounded-xl transition-all duration-200 group',
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-violet-600/25 text-white border border-violet-500/40'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent',
          highlight && !active && 'hover:bg-violet-900/20 hover:text-violet-300',
        )
      }
    >
      {({ isActive: active }) => (
        <>
          {/* Active glow indicator */}
          {active && (
            <motion.div
              layoutId="active-nav"
              className="absolute inset-0 rounded-xl bg-violet-600/20 border border-violet-500/40"
              style={{ boxShadow: '0 0 12px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}

          {/* Icon */}
          <Icon
            className={clsx(
              'relative z-10 shrink-0 w-4.5 h-4.5 transition-colors duration-200',
              active       ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300',
              highlight && !active ? 'group-hover:text-violet-400' : '',
            )}
            strokeWidth={active ? 2.5 : 2}
          />

          {/* Label + badge */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{    opacity: 0, width: 0      }}
                transition={{ duration: 0.22 }}
                className="relative z-10 flex items-center gap-2 overflow-hidden whitespace-nowrap flex-1"
              >
                <span className={clsx(
                  'text-sm font-medium flex-1',
                  active ? 'text-white' : '',
                )}>
                  {label}
                </span>
                {badge && (
                  <span className={clsx(
                    'text-2xs px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide',
                    badgeClass === 'badge-primary' ? 'bg-violet-500/30 text-violet-300 border border-violet-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
                  )}>
                    {badge}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed badge dot */}
          {collapsed && badge && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 350, damping: 35 }}
      className={clsx(
        'fixed left-0 top-0 bottom-0 z-40',
        'border-r border-white/[0.06]',
        'flex flex-col overflow-hidden select-none',
      )}
      style={{
        background: 'rgba(12, 10, 22, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo */}
      <SidebarLogo collapsed={collapsed} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scroll-area py-4 px-3 space-y-6">
        {NAV_ITEMS.map(({ group, items }) => (
          <div key={group}>
            {/* Group label */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{    opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2"
                >
                  {group}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {items.map(item => (
                <SideNavItem key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account section */}
      <div className="px-3 py-2 border-t border-white/5">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-2xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2"
            >
              ACCOUNT
            </motion.p>
          )}
        </AnimatePresence>
        <SideNavItem
          item={{ to: '/profile', icon: User, label: 'Profile & Settings' }}
          collapsed={collapsed}
        />
      </div>



      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={clsx(
          'absolute top-[72px] -right-3 z-50',
          'w-6 h-6 rounded-full flex items-center justify-center',
          'bg-surface-800 border border-slate-700 shadow-card',
          'text-slate-400 hover:text-slate-100 hover:border-violet-500/50',
          'transition-all duration-200',
        )}
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft  className="w-3.5 h-3.5" />
        }
      </button>
    </motion.aside>
  )
}
