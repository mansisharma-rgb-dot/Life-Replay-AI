import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import clsx from 'clsx'

export default function CalendarWidget({ delay = 0 }) {
  const [currentDate] = useState(new Date())
  
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  const getCalendarDates = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const dates = []
    for (let i = 0; i < firstDay; i++) {
      dates.push({ date: '', isCurrentMonth: false, isToday: false, hasActivity: false })
    }
    
    const today = new Date()
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push({
        date: i,
        isCurrentMonth: true,
        isToday: i === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
        hasActivity: false // Removing fake activity dots
      })
    }
    return dates
  }

  const calendarDates = getCalendarDates(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-card p-5 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-100 font-semibold">
          <CalendarIcon className="w-5 h-5 text-primary-400" />
          <span>{monthName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-icon w-7 h-7"><ChevronLeft className="w-4 h-4" /></button>
          <button className="btn-icon w-7 h-7"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map(day => (
          <div key={day} className="text-xs font-medium text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDates.map((d, i) => (
          <button
            key={i}
            className={clsx(
              "relative flex items-center justify-center rounded-xl text-sm transition-all duration-200 aspect-square",
              !d.isCurrentMonth && "text-slate-600",
              d.isCurrentMonth && !d.isToday && "text-slate-300 hover:bg-slate-800",
              d.isToday && "bg-primary-600 text-white font-semibold shadow-glow-primary",
              d.hasActivity && !d.isToday && "after:absolute after:bottom-1.5 after:w-1 after:h-1 after:bg-primary-400 after:rounded-full"
            )}
          >
            {d.date}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
