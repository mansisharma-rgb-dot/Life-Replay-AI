import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  BookOpen,
  Compass,
} from 'lucide-react'
import clsx from 'clsx'

const SECONDARY_ROUTES = [
  '/goals',
  '/habits',
  '/insights',
  '/replay',
  '/goal-predictions',
  '/reports',
  '/calendar',
  '/history',
  '/time-analysis',
  '/achievements',
  '/profile',
  '/notifications',
  '/skills',
  '/memories',
  '/analytics',
]

export default function MobileBottomNav({ onOpenHub }) {
  const location = useLocation()

  const isMoreActive = SECONDARY_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  )

  return (
    <nav
      aria-label="Mobile Navigation"
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 z-40',
        'border-t border-white/[0.08]',
        'select-none'
      )}
      style={{
        background: 'rgba(22, 18, 44, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 -6px 28px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0.4rem))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {/* 1. Home */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            clsx(
              'relative flex items-center justify-center py-1 px-2.5 transition-all min-h-[46px] touch-target tap-press rounded-2xl',
              isActive
                ? 'bg-[#6c52d4] text-white shadow-[0_4px_16px_rgba(108,82,212,0.45)]'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          {({ isActive }) => (
            <div className="flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4 text-white" />
              <span className={clsx('text-xs font-semibold', isActive ? 'inline' : 'hidden')}>
                Home
              </span>
            </div>
          )}
        </NavLink>

        {/* 2. Progress */}
        <NavLink
          to="/progress"
          className={({ isActive }) =>
            clsx(
              'relative flex items-center justify-center py-1 px-2.5 transition-all min-h-[46px] touch-target tap-press rounded-2xl',
              isActive
                ? 'bg-[#6c52d4] text-white shadow-[0_4px_16px_rgba(108,82,212,0.45)]'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          {({ isActive }) => (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className={clsx('text-xs font-semibold', isActive ? 'inline' : 'hidden')}>
                Progress
              </span>
            </div>
          )}
        </NavLink>

        {/* 3. Check-in (Prominent Center Button) */}
        <NavLink
          to="/checkin"
          className={({ isActive }) =>
            clsx(
              'relative flex flex-col items-center justify-center flex-1 -mt-4 py-1 px-1 group touch-target tap-press'
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg',
                  isActive
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white ring-2 ring-violet-400/50 shadow-violet-500/40 scale-105'
                    : 'bg-gradient-to-tr from-violet-700 to-purple-600 text-white shadow-purple-900/50 hover:brightness-110'
                )}
              >
                <Target className="w-6 h-6" strokeWidth={2.4} />
              </div>
              <span
                className={clsx(
                  'text-[10px] mt-1 font-semibold truncate',
                  isActive ? 'text-violet-300' : 'text-slate-300'
                )}
              >
                Check-in
              </span>
            </>
          )}
        </NavLink>

        {/* 4. Journal */}
        <NavLink
          to="/journal"
          className={({ isActive }) =>
            clsx(
              'relative flex items-center justify-center py-1 px-2.5 transition-all min-h-[46px] touch-target tap-press rounded-2xl',
              isActive
                ? 'bg-[#6c52d4] text-white shadow-[0_4px_16px_rgba(108,82,212,0.45)]'
                : 'text-slate-400 hover:text-slate-200'
            )
          }
        >
          {({ isActive }) => (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-white" />
              <span className={clsx('text-xs font-semibold', isActive ? 'inline' : 'hidden')}>
                Journal
              </span>
            </div>
          )}
        </NavLink>

        {/* 5. More / Hub */}
        <button
          onClick={onOpenHub}
          className={clsx(
            'relative flex items-center justify-center py-1 px-2.5 transition-all min-h-[46px] touch-target tap-press rounded-2xl',
            isMoreActive
              ? 'bg-[#6c52d4] text-white shadow-[0_4px_16px_rgba(108,82,212,0.45)]'
              : 'text-slate-400 hover:text-slate-200'
          )}
          aria-label="Open More features menu"
        >
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-white" />
            <span className={clsx('text-xs font-semibold', isMoreActive ? 'inline' : 'hidden')}>
              More
            </span>
          </div>
        </button>
      </div>
    </nav>
  )
}
