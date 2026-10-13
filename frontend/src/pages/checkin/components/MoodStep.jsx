import React from 'react'
import { motion } from 'framer-motion'
import { Star, Battery, Target, Heart, Zap } from 'lucide-react'

import moodHappy from '../../../assets/characters/mood_happy.jpg'
import moodExcited from '../../../assets/characters/mood_excited.jpg'
import moodSad from '../../../assets/characters/mood_sad.jpg'
import moodBear from '../../../assets/characters/mood_bear.jpg'
import moodStressed from '../../../assets/characters/mood_stressed.jpg'
import moodContent from '../../../assets/characters/mood_content.jpg'
import moodFocused from '../../../assets/characters/mood_focused.jpg'
import moodRelaxed from '../../../assets/characters/mood_relaxed.jpg'

const MOOD_CHARACTERS = [
  { label: 'Ecstatic', image: moodExcited, score: 10, glow: 'ring-amber-400' },
  { label: 'Happy', image: moodHappy, score: 9, glow: 'ring-yellow-400' },
  { label: 'Content', image: moodContent, score: 8, glow: 'ring-emerald-400' },
  { label: 'Peaceful', image: moodBear, score: 7, glow: 'ring-blue-400' },
  { label: 'Relaxed', image: moodRelaxed, score: 6, glow: 'ring-pink-400' },
  { label: 'Focused', image: moodFocused, score: 5, glow: 'ring-indigo-400' },
  { label: 'Stressed', image: moodStressed, score: 4, glow: 'ring-purple-400' },
  { label: 'Low', image: moodSad, score: 3, glow: 'ring-red-400' },
]

const MoodStep = React.memo(({ data, updateMood, updateWellbeing }) => {
  const mood = data.mood || {}
  const wellbeing = data.wellbeing || {}

  const SliderField = ({ icon: Icon, label, value, onChange, colorClass }) => (
    <div className="mobile-card p-4 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs sm:text-sm text-slate-200 flex items-center gap-2 font-semibold">
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass}`} /> {label}
        </label>
        <span className={`text-xs sm:text-sm font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${colorClass}`}>
          {value || 3} / 5
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        className="w-full h-2.5 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-violet-500 touch-target"
        value={value || 3}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-[11px] text-slate-400 font-medium px-0.5">
        <span>Low (1)</span>
        <span>Average (3)</span>
        <span>High (5)</span>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="text-center px-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Mood & Wellbeing</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          How are you feeling mentally and physically today?
        </p>
      </div>

      {/* Mood Selector Card */}
      <div className="mobile-card p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Star className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm sm:text-base font-semibold text-white">Select Your Mood</h3>
        </div>

        {/* Tactile Plush Mood Grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {MOOD_CHARACTERS.map((m) => {
            const isActive = mood.mood_label === m.label
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => {
                  updateMood('mood_label', m.label)
                  updateMood('mood_score', m.score)
                }}
                className={`p-2 rounded-2xl flex flex-col items-center justify-between gap-1.5 transition-all touch-target tap-press border ${
                  isActive
                    ? `scale-105 ring-2 shadow-[0_0_15px_rgba(250,204,21,0.5)] ${m.glow} border-white/20 bg-[#251e47]`
                    : 'bg-white/[0.04] border-white/5 hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <img src={m.image} alt={m.label} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[10px] font-semibold truncate max-w-full ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mood Note Input */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs text-slate-300 font-medium">Briefly, why do you feel this way? (Optional)</label>
          <input
            type="text"
            placeholder="E.g., had a productive day, energetic morning..."
            className="input-field text-xs sm:text-sm py-2.5"
            value={mood.note || ''}
            onChange={(e) => updateMood('note', e.target.value)}
          />
        </div>
      </div>

      {/* Wellbeing Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <SliderField
          icon={Zap}
          label="Energy Level"
          colorClass="text-yellow-400"
          value={wellbeing.energy_level}
          onChange={(val) => updateWellbeing('energy_level', val)}
        />
        <SliderField
          icon={Heart}
          label="Stress Level"
          colorClass="text-rose-400"
          value={wellbeing.stress_level}
          onChange={(val) => updateWellbeing('stress_level', val)}
        />
        <SliderField
          icon={Target}
          label="Focus Level"
          colorClass="text-sky-400"
          value={wellbeing.focus_level}
          onChange={(val) => updateWellbeing('focus_level', val)}
        />
        <SliderField
          icon={Battery}
          label="Motivation Level"
          colorClass="text-emerald-400"
          value={wellbeing.motivation_level}
          onChange={(val) => updateWellbeing('motivation_level', val)}
        />
      </div>
    </motion.div>
  )
})

export default MoodStep
