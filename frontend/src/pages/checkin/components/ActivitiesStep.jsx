import React from 'react'
import { Activity, Moon, Droplets, BookOpen, Monitor, Brain, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

const ActivitiesStep = React.memo(({ data, updateActivity }) => {
  const act = data.activities || {}

  const ActivityControl = ({
    icon: Icon,
    label,
    value,
    unit,
    step,
    min = 0,
    max = 9999,
    color,
    presets,
    onChange,
  }) => {
    const numVal = Number(value) || 0

    const adjust = (delta) => {
      const next = Math.max(min, Math.min(max, +(numVal + delta).toFixed(1)))
      onChange(next)
    }

    return (
      <div className="mobile-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm text-slate-200 flex items-center gap-2 font-semibold">
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
            <span>{label}</span>
          </label>
          <span className="text-xs text-slate-400 font-medium">({unit})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Minus button */}
          <button
            type="button"
            onClick={() => adjust(-step)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 touch-target tap-press"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Number Input */}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            className="input-field text-center font-bold text-base sm:text-lg py-2"
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
          />

          {/* Plus button */}
          <button
            type="button"
            onClick={() => adjust(step)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 touch-target tap-press"
            aria-label={`Increase ${label}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        {presets && presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => adjust(preset.delta)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 bg-white/[0.04] border border-white/5 hover:bg-white/10 active:scale-95 transition-all"
              >
                +{preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="text-center px-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Daily Activities</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Log your key habits and hours to calculate your daily productivity & life score.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ActivityControl
          icon={Moon}
          label="Sleep"
          unit="hours"
          step={0.5}
          min={0}
          max={24}
          color="text-indigo-400"
          value={act.sleep_hours}
          presets={[
            { label: '0.5h', delta: 0.5 },
            { label: '1h', delta: 1 },
            { label: '7h', delta: 7 - (Number(act.sleep_hours) || 0) },
            { label: '8h', delta: 8 - (Number(act.sleep_hours) || 0) },
          ]}
          onChange={(val) => updateActivity('sleep_hours', val)}
        />

        <ActivityControl
          icon={BookOpen}
          label="Deep Work / Study"
          unit="hours"
          step={0.5}
          min={0}
          max={24}
          color="text-emerald-400"
          value={act.study_hours}
          presets={[
            { label: '1h', delta: 1 },
            { label: '2h', delta: 2 },
            { label: '3h', delta: 3 },
          ]}
          onChange={(val) => updateActivity('study_hours', val)}
        />

        <ActivityControl
          icon={Activity}
          label="Exercise / Workout"
          unit="mins"
          step={10}
          min={0}
          color="text-amber-400"
          value={act.exercise_minutes}
          presets={[
            { label: '15m', delta: 15 },
            { label: '30m', delta: 30 },
            { label: '45m', delta: 45 },
          ]}
          onChange={(val) => updateActivity('exercise_minutes', val)}
        />

        <ActivityControl
          icon={Droplets}
          label="Water Intake"
          unit="ml"
          step={250}
          min={0}
          color="text-cyan-400"
          value={act.water_intake_ml}
          presets={[
            { label: '250ml', delta: 250 },
            { label: '500ml', delta: 500 },
            { label: '1000ml', delta: 1000 },
          ]}
          onChange={(val) => updateActivity('water_intake_ml', val)}
        />

        <ActivityControl
          icon={Monitor}
          label="Screen Time"
          unit="mins"
          step={15}
          min={0}
          color="text-rose-400"
          value={act.screen_time_minutes}
          presets={[
            { label: '30m', delta: 30 },
            { label: '60m', delta: 60 },
          ]}
          onChange={(val) => updateActivity('screen_time_minutes', val)}
        />

        <ActivityControl
          icon={Brain}
          label="Meditation & Mindfulness"
          unit="mins"
          step={5}
          min={0}
          color="text-violet-400"
          value={act.meditation_minutes}
          presets={[
            { label: '5m', delta: 5 },
            { label: '10m', delta: 10 },
            { label: '20m', delta: 20 },
          ]}
          onChange={(val) => updateActivity('meditation_minutes', val)}
        />
      </div>
    </motion.div>
  )
})

export default ActivitiesStep
