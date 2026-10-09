import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import GlobalBackground from './GlobalBackground'
import clsx    from 'clsx'

const SIDEBAR_COLLAPSED_KEY = 'lr-sidebar-collapsed'

const PAGE_VARIANTS = {
  initial:   { opacity: 0, y: 10 },
  animate:   { opacity: 1, y: 0  },
  exit:      { opacity: 0, y: -6 },
}

export default function AppLayout() {
  const location = useLocation()

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

  return (
    <div className="min-h-screen relative">
      <GlobalBackground />
      
      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main wrapper */}
      <div
        className={clsx(
          'relative z-10 flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'ml-[72px]' : 'ml-[260px]',
        )}
      >
        {/* Topbar */}
        <Topbar sidebarCollapsed={collapsed} />

        {/* Page content */}
        <main className="flex-1 pt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="p-5 lg:p-6 min-h-[calc(100vh-3.5rem)]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
