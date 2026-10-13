import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Moon,
  Heart,
  Play,
} from 'lucide-react'
import { checkinApi } from '../../api/checkinApi'
import { goalsApi } from '../../api/goalsApi'
import { habitsApi } from '../../api/habitsApi'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Dashboard sub-components
import DashboardGoals from '../../components/dashboard/DashboardGoals'
import DashboardHabits from '../../components/dashboard/DashboardHabits'
import AIInsightsCard from '../../components/dashboard/AIInsightsCard'

// Character & illustration assets
import moodHappy from '../../assets/characters/mood_happy.jpg'
import moodExcited from '../../assets/characters/mood_excited.jpg'
import moodSad from '../../assets/characters/mood_sad.jpg'
import moodBear from '../../assets/characters/mood_bear.jpg'
import moodStressed from '../../assets/characters/mood_stressed.jpg'
import moodContent from '../../assets/characters/mood_content.jpg'
import moodFocused from '../../assets/characters/mood_focused.jpg'
import moodRelaxed from '../../assets/characters/mood_relaxed.jpg'
import celestialMoon from '../../assets/characters/celestial_moon.jpg'
import sleepBetterImg from '../../assets/characters/sleep_better.jpg'
import gratitudeReadingImg from '../../assets/characters/gratitude_reading.jpg'
import aiHelperImg from '../../assets/characters/ai_helper.jpg'

// ─── 8 Tactile Plush Emotion Characters matching Reference Image 1 ──────────
const EMOTIONS = [
  { id: 'happy', label: 'Happy', image: moodHappy, score: 9 },
  { id: 'excited', label: 'Excited', image: moodExcited, score: 10 },
  { id: 'low', label: 'Low', image: moodSad, score: 3 },
  { id: 'peaceful', label: 'Peaceful', image: moodBear, score: 8 },
  { id: 'stressed', label: 'Stressed', image: moodStressed, score: 4 },
  { id: 'content', label: 'Content', image: moodContent, score: 7 },
  { id: 'focused', label: 'Focused', image: moodFocused, score: 5 },
  { id: 'relaxed', label: 'Relaxed', image: moodRelaxed, score: 6 },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.full_name?.split(' ')[0] || 'Friend'
  const greeting = getGreeting()

  const [todayData, setTodayData] = useState(null)
  const [selectedMood, setSelectedMood] = useState(null)
  const [aiQuery, setAiQuery] = useState('')

  const [goals, setGoals] = useState([])
  const [habits, setHabits] = useState([])
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [habitsLoading, setHabitsLoading] = useState(true)
  const [goalsError, setGoalsError] = useState(false)
  const [habitsError, setHabitsError] = useState(false)

  useEffect(() => {
    // 1. Fetch Today's check-in
    checkinApi
      .getToday()
      .then((res) => {
        const data = res && res.data !== undefined ? res.data : res
        if (data) {
          setTodayData(data)
          if (data.mood_rating) {
            const matched = EMOTIONS.find(e => Math.abs(e.score - data.mood_rating) <= 1)
            if (matched) setSelectedMood(matched.id)
          }
        }
      })
      .catch((err) => console.error('Failed to fetch today checkin', err))

    // 2. Fetch Goals & Habits
    Promise.allSettled([goalsApi.getGoals(), habitsApi.getHabits()]).then(
      ([goalsRes, habitsRes]) => {
        if (goalsRes.status === 'fulfilled') {
          setGoals(goalsRes.value || [])
          setGoalsError(false)
        } else {
          setGoalsError(true)
        }
        setGoalsLoading(false)

        if (habitsRes.status === 'fulfilled') {
          setHabits(habitsRes.value || [])
          setHabitsError(false)
        } else {
          setHabitsError(true)
        }
        setHabitsLoading(false)
      }
    )
  }, [])

  // Mood selection handler
  const handleMoodSelect = async (emotion) => {
    setSelectedMood(emotion.id)
    try {
      await checkinApi.upsertCheckin({
        mood_rating: emotion.score,
        notes: `Feeling ${emotion.label} today`
      })
      toast.success(`Logged mood: ${emotion.label} ✨`, { id: 'mood-toast' })
    } catch {
      // Still show in local state
    }
  }

  // AI helper query submit
  const handleAiSubmit = () => {
    if (aiQuery.trim()) {
      navigate('/insights', { state: { query: aiQuery.trim() } })
    } else {
      navigate('/insights')
    }
  }

  // Derived metrics
  const isCheckinCompleted = Boolean(todayData?.is_completed)
  const checkinProgressPercent = isCheckinCompleted ? 100 : (todayData?.mood_rating ? 40 : 0)
  const currentStreak = Number(todayData?.streak || user?.current_streak || 1)
  const totalXp = Number(user?.total_xp || 950)
  const studyHours = Number(todayData?.activities?.study_hours) || 0
  const workHours = Number(todayData?.activities?.work_hours) || 0
  const totalFocusHours = studyHours + workHours

  return (
    <div className="space-y-5 sm:space-y-6 pb-6 max-w-xl mx-auto">
      
      {/* ── 1. Top Header: User Greeting + Glowing Celestial Mascot ────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#7c56ed] to-[#c7b8f5] shadow-[0_0_16px_rgba(124,86,237,0.4)]">
            <div className="w-full h-full rounded-full bg-[#181335] flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <p className="text-xs text-[#a398c7] font-medium leading-none">{greeting}</p>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              {firstName}
            </h1>
          </div>
        </div>

        {/* Cute celestial orb moon mascot matching Reference Image 1 */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-[0_0_24px_rgba(167,139,250,0.7)] ring-2 ring-[#a78bfa]/60">
          <img src={celestialMoon} alt="Celestial Mascot" className="w-full h-full object-cover" />
          <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-60" />
        </div>
      </motion.div>

      {/* ── 2. "How are you feeling today?" 2x4 Clay Emotion Grid ──────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-4.5 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-3"
      >
        <h2 className="text-center text-sm sm:text-base font-semibold text-white tracking-tight">
          How are you feeling today?
        </h2>

        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 justify-items-center pt-1">
          {EMOTIONS.map((emotion) => {
            const isSelected = selectedMood === emotion.id
            return (
              <button
                key={emotion.id}
                onClick={() => handleMoodSelect(emotion)}
                className={`w-15 h-17 sm:w-16 sm:h-18 rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all duration-200 active:scale-95 relative ${
                  isSelected
                    ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_0_22px_rgba(250,204,21,0.7)] bg-[#251e47]'
                    : 'hover:scale-102 bg-[#1b1539] hover:bg-[#221b47] border border-white/5'
                }`}
                title={emotion.label}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <img src={emotion.image} alt={emotion.label} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[9px] font-medium tracking-tight ${isSelected ? 'text-yellow-300 font-bold' : 'text-slate-300'}`}>
                  {emotion.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* ── 3. "ask AI helper....." Prompt Search Bar ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative flex items-center bg-[#17132e] border border-[#2e2652] focus-within:border-[#7c56ed] rounded-full px-3.5 py-2 shadow-inner transition-colors"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden mr-2.5 shrink-0 border border-purple-400/40 shadow-sm">
          <img src={aiHelperImg} alt="AI helper" className="w-full h-full object-cover" />
        </div>
        <input
          type="text"
          placeholder="ask AI helper....."
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
          className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none flex-1 pr-2"
        />
        <button
          onClick={handleAiSubmit}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6c52d4] to-[#8c62f5] flex items-center justify-center text-white shadow-[0_0_12px_rgba(108,82,212,0.5)] hover:scale-105 active:scale-95 transition-transform shrink-0"
          aria-label="Ask AI"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </motion.div>

      {/* ── 4. Daily Quest / Check-In Card (Matching Image 1 & 2) ─────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Daily Quest
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7c56ed]/20 text-[#c7b8f5] border border-[#7c56ed]/30">
            {totalXp} XP Available
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 bg-[#1e183d] rounded-2xl p-4 border border-white/5">
          {/* Banner Graphic matching Image 1 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6c52d4] to-[#f472b6] flex items-center justify-center text-white shadow-md">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Daily Check-In!
              </h3>
              <p className="text-xs text-[#a398c7] mt-0.5">
                Log mood, deep work & habits
              </p>
            </div>
          </div>

          {/* Circular Progress Indicator matching Image 1 */}
          <div className="relative w-14 h-14 rounded-full bg-[#120f26] border-4 border-[#2f2659] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {checkinProgressPercent}%
            </span>
          </div>
        </div>

        <Link
          to="/checkin"
          className="w-full py-3 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(108,82,212,0.4)]"
          style={{
            background: 'linear-gradient(135deg, #6c52d4 0%, #7c56ed 50%, #9065f4 100%)',
            border: '1px solid rgba(52, 211, 153, 0.45)',
          }}
        >
          <span>{isCheckinCompleted ? 'Review Check-in' : 'Start'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.section>

      {/* ── 5. 3-Stat Strip: Streak, Focus Time, Achievements ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <Link
          to="/progress"
          className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md hover:border-[#7c56ed]/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#0284c7]/20 flex items-center justify-center mb-1.5">
            <Flame className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <span className="text-lg font-black text-white">{currentStreak}</span>
          <span className="text-[10px] text-[#a398c7] font-medium">Day Streak</span>
        </Link>

        <Link
          to="/time-analysis"
          className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md hover:border-[#7c56ed]/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#7c56ed]/20 flex items-center justify-center mb-1.5">
            <Clock className="w-4 h-4 text-[#c084fc]" />
          </div>
          <span className="text-lg font-black text-white">{totalFocusHours}h</span>
          <span className="text-[10px] text-[#a398c7] font-medium">Focus Time</span>
        </Link>

        <Link
          to="/achievements"
          className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md hover:border-[#7c56ed]/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#ea580c]/20 flex items-center justify-center mb-1.5">
            <Trophy className="w-4 h-4 text-[#fb923c]" />
          </div>
          <span className="text-lg font-black text-white">{goals.filter(g => g.progress >= 100).length || 1}</span>
          <span className="text-[10px] text-[#a398c7] font-medium">Achievement</span>
        </Link>
      </motion.div>

      {/* ── 6. "Recommended for You" Carousel matching Reference Image 2 ──── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Recommended for You
          </h2>
          <span className="text-xs text-[#a398c7]">Curated</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Sleep Better */}
          <Link
            to="/checkin"
            className="bg-[#17132e] border border-[#2e2652] rounded-3xl overflow-hidden shadow-md hover:border-[#7c56ed]/50 transition-colors group flex flex-col"
          >
            <div className="h-28 w-full overflow-hidden relative">
              <img src={sleepBetterImg} alt="Sleep Better" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                Zzz
              </span>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-white group-hover:text-[#a78bfa] transition-colors leading-snug">
                Sleep Better
              </h3>
              <p className="text-[11px] text-[#a398c7] mt-0.5">
                Guided Sleep Logs
              </p>
            </div>
          </Link>

          {/* Card 2: Gratitude Practice */}
          <Link
            to="/journal"
            className="bg-[#17132e] border border-[#2e2652] rounded-3xl overflow-hidden shadow-md hover:border-[#7c56ed]/50 transition-colors group flex flex-col"
          >
            <div className="h-28 w-full overflow-hidden relative">
              <img src={gratitudeReadingImg} alt="Gratitude Practice" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-bold text-amber-300">
                Affirmations
              </span>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-white group-hover:text-[#a78bfa] transition-colors leading-snug">
                Gratitude Practice
              </h3>
              <p className="text-[11px] text-[#a398c7] mt-0.5">
                Positive Affirmations
              </p>
            </div>
          </Link>
        </div>
      </motion.section>

      {/* ── 7. Active Habits & Real Goals ───────────────────────────────────── */}
      <div className="space-y-4">
        <DashboardHabits
          habits={habits}
          isLoading={habitsLoading}
          error={habitsError}
          delay={0.3}
        />
        <DashboardGoals
          goals={goals}
          isLoading={goalsLoading}
          error={goalsError}
          delay={0.35}
        />
      </div>

      {/* ── 8. AI Insights Coach ────────────────────────────────────────────── */}
      <AIInsightsCard delay={0.4} />

    </div>
  )
}
