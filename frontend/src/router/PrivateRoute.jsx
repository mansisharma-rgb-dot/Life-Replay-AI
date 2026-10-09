import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { motion } from 'framer-motion'

// Full-screen loading spinner shown while auth is being initialized
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1  }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated logo mark */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-brand animate-pulse-glow opacity-75" />
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-violet-500/40 shadow-xl bg-surface-800 flex items-center justify-center">
            <img
              src="/logo-icon.png"
              alt="Life Replay AI"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <p className="text-slate-400 text-sm font-medium">Initializing...</p>
      </motion.div>
    </div>
  )
}

/**
 * Wraps protected routes.
 * - Shows loading screen while auth is being initialized
 * - Redirects to /login (with `from` state) if not authenticated
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
