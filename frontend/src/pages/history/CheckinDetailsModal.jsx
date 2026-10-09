import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Activity, Sparkles, HeartPulse, Smile, 
  Target, BookOpen, CheckCircle2, Circle, Clock, Droplets,
  Zap, Heart, Battery, Flame, RefreshCw, AlertCircle
} from 'lucide-react';
import { checkinApi } from '../../api/checkinApi';

// Helper: Format Date string without UTC off-by-one shifting
export const formatHistoryDate = (dateStr, options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!dateStr) return '';
  const dateOnly = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', options);
  }
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

export default function CheckinDetailsModal({ dateStr, isOpen, onClose }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !dateStr) return;

    let isMounted = true;
    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cleanDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
        const res = await checkinApi.getByDate(cleanDate);
        const data = (res && res.data !== undefined) ? res.data : res;
        if (isMounted) {
          setDetails(data);
        }
      } catch (err) {
        console.error("Failed to load check-in details:", err);
        if (isMounted) {
          setError("Failed to load details for this date. Please try again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDetails();

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Escape key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dateStr, onClose]);

  if (!isOpen) return null;

  const acts = details?.activities || {};
  const mood = details?.mood || {};
  const wb = details?.wellbeing || {};
  const journal = details?.journal || {};
  const habitLogs = details?.habit_logs || [];
  const lifeScore = details?.life_score;

  const hasActivities = details?.has_activities || Object.values(acts).some(v => v > 0);
  const hasMood = details?.has_mood || mood.mood_score || mood.mood_label;
  const hasWellbeing = details?.has_wellbeing || Object.values(wb).some(v => v > 0);
  const hasJournal = details?.has_journal || journal.title || journal.content;
  const hasAnyData = details?.found || details?.is_completed || hasActivities || hasMood || hasWellbeing || hasJournal || habitLogs.length > 0;

  const formatActivityValue = (val, unit) => {
    if (val === undefined || val === null || val === 0) return '0 ' + unit;
    return `${val} ${unit}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl rounded-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(20, 29, 56, 0.96) 100%)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {formatHistoryDate(dateStr)}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    details?.is_completed 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {details?.is_completed ? 'Completed Check-in' : 'Saved Entry'}
                  </span>
                  {dateStr && (
                    <span className="text-xs text-slate-400">
                      ID: {typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-sm font-medium">Retrieving saved check-in data...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            ) : !hasAnyData ? (
              <div className="py-16 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-500 mb-3" />
                <h4 className="text-lg font-semibold text-slate-200 mb-1">No Details Recorded</h4>
                <p className="text-sm">There are no specific activity metrics or reflection saved for this date.</p>
              </div>
            ) : (
              <>
                {/* Life Score & Daily Rating Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-surface-900/60 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Life Score</span>
                      </div>
                      <span className="text-3xl font-black text-emerald-400">
                        {lifeScore?.total_score ?? '-'}
                      </span>
                    </div>
                    {lifeScore?.breakdown && (
                      <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Activities: <strong className="text-slate-200">{lifeScore.breakdown.activities ?? '-'}</strong></span>
                        <span>Mood: <strong className="text-slate-200">{lifeScore.breakdown.mood ?? '-'}</strong></span>
                        <span>Wellbeing: <strong className="text-slate-200">{lifeScore.breakdown.wellbeing ?? '-'}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-surface-900/60 rounded-2xl border border-violet-500/20 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span>Daily Rating</span>
                      </div>
                      <span className="text-3xl font-black text-violet-400">
                        {details?.daily_rating ? `${details.daily_rating} / 10` : 'Not rated'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-white/5">
                      Self-assessed satisfaction score for the day
                    </p>
                  </div>
                </div>

                {/* Mood & Wellbeing Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Smile className="w-4 h-4 text-amber-400" /> Mood & Mental State
                  </h4>
                  <div className="p-4 bg-surface-900/50 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">
                          {mood.mood_label || '😐'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            Mood Score: {mood.mood_score ? `${mood.mood_score} / 10` : 'Not logged'}
                          </p>
                          {mood.intensity && (
                            <p className="text-xs text-slate-400">Intensity: {mood.intensity} / 5</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {mood.note && (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Mood Note</p>
                        <p className="text-sm text-slate-200 italic">"{mood.note}"</p>
                      </div>
                    )}

                    {/* Wellbeing Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                      <div className="p-3 bg-surface-800/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-yellow-400 mb-1 font-medium">
                          <Zap className="w-3.5 h-3.5" /> Energy
                        </div>
                        <span className="text-lg font-bold text-slate-100">{wb.energy_level ?? '-'}/5</span>
                      </div>
                      <div className="p-3 bg-surface-800/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1 font-medium">
                          <Heart className="w-3.5 h-3.5" /> Stress
                        </div>
                        <span className="text-lg font-bold text-slate-100">{wb.stress_level ?? '-'}/5</span>
                      </div>
                      <div className="p-3 bg-surface-800/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-1 font-medium">
                          <Target className="w-3.5 h-3.5" /> Focus
                        </div>
                        <span className="text-lg font-bold text-slate-100">{wb.focus_level ?? '-'}/5</span>
                      </div>
                      <div className="p-3 bg-surface-800/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1 font-medium">
                          <Battery className="w-3.5 h-3.5" /> Motivation
                        </div>
                        <span className="text-lg font-bold text-slate-100">{wb.motivation_level ?? '-'}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Activities Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" /> Tracked Activities
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🛌 Sleep</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.sleep_hours, 'hrs')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">💧 Water</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.water_intake_ml, 'ml')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">📚 Study</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.study_hours, 'hrs')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">💼 Work</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.work_hours, 'hrs')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🏃 Exercise</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.exercise_minutes, 'mins')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">📖 Reading</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.reading_minutes, 'mins')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🧘 Meditation</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.meditation_minutes, 'mins')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">📱 Screen Time</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.screen_time_minutes, 'mins')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🎮 Leisure</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.leisure_hours, 'hrs')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🚶 Steps</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.walking_steps, 'steps')}</span>
                    </div>
                    <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block mb-1">🔥 Calories</span>
                      <span className="text-sm font-bold text-slate-200">{formatActivityValue(acts.calories_burned, 'kcal')}</span>
                    </div>
                  </div>
                </div>

                {/* Habits Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-400" /> Habits Completed
                  </h4>
                  {habitLogs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {habitLogs.map(h => (
                        <div key={h.id || h.habit_id} className="flex items-center justify-between p-3 bg-surface-900/50 rounded-xl border border-white/5 text-xs">
                          <div className="flex items-center gap-2">
                            <span>{h.icon || '✨'}</span>
                            <span className="font-semibold text-slate-200">{h.name}</span>
                            {h.streak > 0 && (
                              <span className="text-[10px] text-amber-400">🔥 {h.streak}d</span>
                            )}
                          </div>
                          {h.completed ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-4 h-4" /> Done
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Circle className="w-4 h-4" /> Skipped
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-surface-900/30 rounded-xl border border-white/5">
                      No habits logged for this date.
                    </p>
                  )}
                </div>

                {/* Goals Section */}
                {details?.goals && details.goals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" /> Active Goals
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {details.goals.map(g => (
                        <div key={g.id} className="p-3.5 bg-surface-900/50 rounded-xl border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-200">{g.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 text-primary-300 border border-white/5">
                              {g.category || 'General'}
                            </span>
                          </div>
                          <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-primary-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.round(((g.progress || 0) / (g.target || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Progress: {g.progress || 0} / {g.target || 1}</span>
                            <span className="text-primary-300 font-semibold">{Math.min(100, Math.round(((g.progress || 0) / (g.target || 1)) * 100))}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Journal & Reflection Section */}
                {(journal.title || journal.content) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" /> Reflection & Journal
                    </h4>
                    <div className="p-5 bg-surface-900/70 rounded-2xl border border-indigo-500/20 space-y-2 relative overflow-hidden">
                      {journal.title && (
                        <h5 className="font-bold text-white text-base">{journal.title}</h5>
                      )}
                      {journal.content && (
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {journal.content}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-white/10 bg-surface-900/40 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
