import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  X,
  Loader2,
  Menu,
} from 'lucide-react'
import { useAuth }         from '@context/AuthContext'
import { useTheme }        from '@context/ThemeContext'
import { useNotification } from '@context/NotificationContext'
import { searchApi }       from '../../api/searchApi'
import { notificationsApi } from '../../api/notificationsApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx                from 'clsx'

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Handle clicking outside search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchApi.search(searchQuery)
          setSearchResults(results)
          setShowSearchResults(true)
        } catch (error) {
          console.error("Search failed:", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults(null)
        setShowSearchResults(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Handle keyboard shortcut (Cmd+K / Ctrl+K) on desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = searchRef.current?.querySelector('input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 focus-within:border-violet-500/50 transition-colors" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)' }}>
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchQuery.length >= 2) setShowSearchResults(true) }}
          placeholder="Search..."
          className="w-24 sm:w-40 md:w-48 lg:w-56 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:w-36 sm:focus:w-52 md:focus:w-64"
        />
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        ) : (
          <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono font-medium text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shadow-sm">
            ⌘K
          </kbd>
        )}
      </div>

      {showSearchResults && (
        <div className="absolute top-full mt-2 w-72 lg:w-80 right-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {searchResults ? (
            <div className="max-h-96 overflow-y-auto py-2">
              {Object.entries(searchResults).map(([category, items]) => {
                if (!items || items.length === 0) return null
                return (
                  <div key={category} className="mb-2">
                    <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider px-4 py-1.5 bg-white/5">
                      {category}
                    </h4>
                    {items.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => {
                          navigate(item.link)
                          setShowSearchResults(false)
                          setSearchQuery('')
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex flex-col"
                      >
                        <span className="text-sm font-semibold text-white">{item.title}</span>
                        {item.description && <span className="text-xs text-slate-400 truncate">{item.description}</span>}
                      </button>
                    ))}
                  </div>
                )
              })}
              {Object.values(searchResults).every(arr => arr.length === 0) && (
                <div className="p-4 text-center text-slate-400 text-sm">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  
  const { data, isLoading } = useQuery({
    queryKey: ['smart-notifications'],
    queryFn: () => notificationsApi.getSmartNotifications(),
    refetchInterval: 60000, // Poll every minute
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: (_, id) => {
      // Optimistically we can invalidate or rely on next poll. We'll just invalidate.
    }
  })

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'WARNING': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'IMPORTANT': return 'text-rose-400 bg-rose-400/10 border-rose-400/20'
      case 'SUCCESS': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      default: return 'text-violet-400 bg-violet-400/10 border-violet-400/20'
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-200" 
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 shadow-modal overflow-hidden z-50"
            style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)' }}
          >
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Smart Alerts</h3>
              <button 
                onClick={() => {
                  setOpen(false)
                  navigate('/notifications')
                }}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                View all
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No new notifications
                </div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                    onClick={() => {
                      if (!n.is_read) markAsReadMutation.mutate(n.id)
                      if (n.link) {
                        navigate(n.link)
                        setOpen(false)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getSeverityColor(n.severity)}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-2xs text-slate-500 mt-2 font-medium uppercase tracking-wider">
                          {n.severity}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── User Avatar Dropdown ─────────────────────────────────────────────────────
function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const menuRef         = useRef(null)
  const navigate        = useNavigate()
  const { logout, avatarBlobUrl } = useAuth()
  const { success }     = useNotification()

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    success('You have been signed out.', 'Goodbye!')
    navigate('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/8 hover:border-white/15 transition-all duration-200"
        style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)' }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarBlobUrl ? (
          <img src={avatarBlobUrl} alt={user.full_name}
               className="w-7 h-7 rounded-full object-cover ring-2 ring-violet-500/30" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-primary-500 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        )}

        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-100 leading-none">{user?.full_name || 'User'}</p>
        </div>

        <ChevronDown className={clsx(
          'hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.96  }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 shadow-modal overflow-hidden z-50"
            style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)' }}
          >
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-semibold text-slate-100">{user?.full_name}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
            </div>

            <div className="py-1.5">
              {[
                { icon: User,     label: 'Profile',  to: '/profile' },
                { icon: Settings, label: 'Settings', to: '/profile' },
              ].map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-colors duration-150"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="border-t border-white/5 py-1.5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Topbar ──────────────────────────────────────────────────────────────
export default function Topbar({ sidebarCollapsed, onOpenMobileDrawer }) {
  const { user }               = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-30 h-14',
        'border-b border-white/[0.06]',
        'flex items-center justify-between px-3 sm:px-5',
        'transition-all duration-300',
        'left-0',
        sidebarCollapsed ? 'md:left-[72px]' : 'md:left-[260px]',
      )}
      style={{
        background: 'rgba(9,14,26,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMobileDrawer}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white active:scale-95 transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-800 border border-violet-500/30 flex items-center justify-center overflow-hidden">
            <img
              src="/logo-icon.png"
              alt="Life Replay AI"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <span className="text-xs font-bold text-white tracking-tight truncate max-w-[120px] sm:max-w-none">
            Life Replay AI
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <SearchBar />
        <NotificationBell />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun  className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-white/10 mx-1.5" />

        {/* User menu */}
        <UserMenu user={user} />
      </div>
    </header>
  )
}
