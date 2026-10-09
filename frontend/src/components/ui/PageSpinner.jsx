import { motion } from 'framer-motion'
import { Zap }    from 'lucide-react'

export default function PageSpinner() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-2xl bg-violet-500/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-violet-500/40 shadow-glow-primary bg-surface-800 flex items-center justify-center">
            <img
              src="/logo-icon.png"
              alt="Loading Life Replay"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
