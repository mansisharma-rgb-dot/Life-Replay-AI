import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import MobileBottomNav from './MobileBottomNav'
import MobileNavHub from './MobileNavHub'
import GlobalBackground from './GlobalBackground'
import { useCapacitorApp } from '../../hooks/useCapacitorApp'
import clsx    from 'clsx'

const SIDEBAR_COLLAPSED_KEY = 'lr-sidebar-collapsed'

const PAGE_VARIANTS = {
  initial:   { opacity: 0, y: 8 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -6 },
}

export default function AppLayout() {
  const location = useLocation()
  const [mobileHubOpen, setMobileHubOpen] = useState(false)

  // Configure native Capacitor back button and system status bar
  useCapacitorApp({
    isModalOpen: mobileHubOpen,
    closeModal: () => setMobileHubOpen(false),
  })

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) || 'false')
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next))
      return next
    })
  }

  // Auto-collapse on small screens
  useEffect(() => {
    const mql     = window.matchMedia('(max-width: 768px)')
    const handler = (e) => { if (e.matches) setCollapsed(true) }
    mql.addEventListener('change', handler)
    if (mql.matches) setCollapsed(true)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Auto-close mobile hub on route change
  useEffect(() => {
    setMobileHubOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <GlobalBackground />
      
      {/* Sidebar (Desktop only) */}
      <div className="relative z-10">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Nav Hub (Secondary destinations sheet) */}
      <MobileNavHub
        isOpen={mobileHubOpen}
        onClose={() => setMobileHubOpen(false)}
      />

      {/* Main wrapper: 0 margin on phone (< md), 72/260px on desktop (>= md) */}
      <div
        className={clsx(
          'relative z-10 flex flex-col min-h-screen transition-all duration-300',
          collapsed
            ? 'w-full ml-0 md:ml-[72px] md:w-[calc(100%-72px)]'
            : 'w-full ml-0 md:ml-[260px] md:w-[calc(100%-260px)]',
        )}
      >
        {/* Topbar */}
        <Topbar
          sidebarCollapsed={collapsed}
          onOpenMobileDrawer={() => setMobileHubOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 pt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full px-3.5 sm:px-6 lg:px-6 py-3.5 sm:py-6 pb-28 md:pb-8 min-h-[calc(100vh-3.5rem)] max-w-7xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation (Mobile only) */}
      <MobileBottomNav onOpenHub={() => setMobileHubOpen(true)} />
    </div>
  )
}
