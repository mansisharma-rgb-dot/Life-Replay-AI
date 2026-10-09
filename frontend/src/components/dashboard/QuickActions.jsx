import { motion } from 'framer-motion'
import { Plus, BookOpen, Flame, Zap, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QuickActions({ delay = 0 }) {
  const actions = [
    { icon: Plus,     label: 'Daily Check-in',   to: '/checkin', primary: true },
    { icon: BookOpen, label: 'Write Journal',    to: '/journal', primary: false },
    { icon: Target,   label: 'Goals',            to: '/goals',   primary: false },
    { icon: Flame,    label: 'Habits',           to: '/habits',  primary: false },
    { icon: Zap,      label: 'AI Report',        to: '/ai',      primary: false, badge: 'AI' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-card p-5 h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-slate-100 mb-4">Quick Actions</h3>
      
      <div className="flex flex-col gap-3 flex-1 justify-center">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            to={action.to}
            className={action.primary ? 'btn-primary w-full flex items-center gap-2' : 'btn-secondary w-full flex items-center gap-2'}
          >
            <action.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{action.label}</span>
            {action.badge && (
              <span className="badge-primary px-1.5 py-0.5 ml-auto">{action.badge}</span>
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
