import React from 'react'
import { motion } from 'framer-motion'

const STEP_LABELS = {
  1: 'Activities & Habits',
  2: 'Mood & Energy',
  3: 'Goals & Focus',
  4: 'Reflection & Notes',
  5: 'Review & Submit',
}

const ProgressIndicator = React.memo(({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100
  const stepName = STEP_LABELS[currentStep] || `Step ${currentStep}`

  return (
    <div className="z-10 mb-4 sm:mb-6 w-full">
      <div className="mobile-card p-3.5 sm:p-4 border-white/10">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] flex items-center justify-center font-bold">
              {currentStep}
            </span>
            <span className="text-white tracking-tight">{stepName}</span>
          </div>
          <span className="text-violet-400 font-bold">{Math.round(progress)}%</span>
        </div>

        <div className="h-2 w-full bg-surface-900 rounded-full overflow-hidden p-0.5 border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
})

export default ProgressIndicator
