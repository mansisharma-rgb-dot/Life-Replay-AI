import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Target,
  Flame,
  BrainCircuit,
  Sparkles,
  Calendar,
  History,
  Trophy,
  User,
  Clock,
  BookOpen,
  FolderHeart,
  TrendingUp,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const HUB_SECTIONS = [
  {
    title: 'Growth & Habits',
    items: [
      { to: '/goals',        icon: Target,      label: 'Goals',       desc: 'Track milestones & targets', color: 'text-amber-400 bg-amber-400/10' },
      { to: '/habits',       icon: Flame,       label: 'Habits',      desc: 'Daily routines & streaks',  color: 'text-rose-400 bg-rose-400/10' },
      { to: '/memories',     icon: FolderHeart, label: 'Memories',    desc: 'Important life moments',    color: 'text-pink-400 bg-pink-400/10' },
      { to: '/skills',       icon: TrendingUp,  label: 'Skills',      desc: 'Competency & learning',     color: 'text-emerald-400 bg-emerald-400/10' },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { to: '/insights',         icon: BrainCircuit, label: 'AI Analyzer',     desc: 'Behavioral intelligence',   color: 'text-indigo-400 bg-indigo-400/10', badge: 'AI' },
      { to: '/replay',           icon: Sparkles,     label: 'AI Replay',       desc: 'Ask & relive memories',     color: 'text-violet-400 bg-violet-400/10', badge: 'AI' },
      { to: '/goal-predictions', icon: Target,       label: 'AI Future Goals', desc: 'Predictive trajectory',     color: 'text-purple-400 bg-purple-400/10', badge: 'AI' },
      { to: '/reports/monthly',  icon: BookOpen,     label: 'Monthly Report',  desc: 'Comprehensive summary',     color: 'text-cyan-400 bg-cyan-400/10' },
    ],
  },
  {
    title: 'Tracking & Records',
    items: [
      { to: '/calendar',      icon: Calendar, label: 'Calendar',      desc: 'Activity calendar view',    color: 'text-sky-400 bg-sky-400/10' },
      { to: '/history',       icon: History,  label: 'History',       desc: 'Past check-ins & logs',     color: 'text-teal-400 bg-teal-400/10' },
      { to: '/time-analysis', icon: Clock,    label: 'Time Analysis', desc: 'Hours breakdown & focus',   color: 'text-blue-400 bg-blue-400/10' },
      { to: '/achievements',  icon: Trophy,   label: 'Achievements',  desc: 'Badges & unlocks',          color: 'text-amber-400 bg-amber-400/10' },
    ],
  },
  {
    title: 'Account & Settings',
    items: [
      { to: '/profile',       icon: User, label: 'Profile & Settings', desc: 'Account, avatar & security', color: 'text-slate-300 bg-white/10' },
      { to: '/notifications', icon: Bell, label: 'Notifications',      desc: 'System & smart alerts',     color: 'text-slate-300 bg-white/10' },
    ],
  },
]

export default function MobileNavHub({ isOpen, onClose }) {
  const { user, logout } = useAuth()

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
            className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={clsx(
              'md:hidden fixed inset-x-0 bottom-0 z-50',
              'max-h-[88vh] flex flex-col',
              'rounded-t-3xl border-t border-[#3b2d69]',
              'bg-[#141028] shadow-2xl overflow-hidden'
            )}
            style={{
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
            }}
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Features & Hub</h3>
                <p className="text-xs text-[#a398c7]">Everything in Life Replay AI</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/5 active:scale-95 transition-all touch-target"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {HUB_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="text-[11px] font-bold text-violet-400 uppercase tracking-wider px-1">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-150 touch-target tap-press',
                              isActive
                                ? 'bg-[#291f54] border-[#7c56ed]/50 text-white shadow-sm'
                                : 'bg-[#1a1535] border-[#2b224d] hover:bg-[#221c45] text-slate-100'
                            )
                          }
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* User Logout Option */}
              <div className="pt-2 border-t border-white/[0.08]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95 transition-all touch-target"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Life Replay</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
