import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const NotificationContext = createContext(null)

let toastId = 0

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error:   <XCircle    className="w-4 h-4 text-rose-400"    />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info:    <Info       className="w-4 h-4 text-primary-400"  />,
}

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error:   'border-rose-500/30    bg-rose-500/10',
  warning: 'border-amber-500/30   bg-amber-500/10',
  info:    'border-primary-500/30 bg-primary-500/10',
}

function Toast({ toast, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95  }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-card backdrop-blur-sm
        ${STYLES[toast.type]} max-w-sm w-full cursor-pointer`}
      onClick={() => onDismiss(toast.id)}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-100 mb-0.5">{toast.title}</p>
        )}
        <p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(toast.id) }}
        className="btn-icon w-6 h-6 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, type, title, message }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const success = useCallback((message, title) => toast({ type: 'success', title, message }), [toast])
  const error   = useCallback((message, title) => toast({ type: 'error',   title, message }), [toast])
  const warning = useCallback((message, title) => toast({ type: 'warning', title, message }), [toast])
  const info    = useCallback((message, title) => toast({ type: 'info',    title, message }), [toast])

  return (
    <NotificationContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}

      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>')
  return ctx
}

export default NotificationContext
