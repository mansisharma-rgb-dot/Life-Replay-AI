import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    Circle, 
    Flame, 
    BookOpen, 
    Target, 
    Activity,
    Moon,
    Droplets,
    GraduationCap,
    Briefcase,
    HeartPulse,
    Eye,
    Zap,
    Smile,
    Sparkles,
    Clock,
    Footprints
} from 'lucide-react';
import { checkinApi } from '../api/checkinApi';

// Helper: Format Date object to local YYYY-MM-DD string without UTC shift
function formatDateKey(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Helper: Parse YYYY-MM-DD string to local Date object
function parseDateKey(str) {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Helper: Get days in a month
function getDaysInMonth(year, month) {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

export default function CalendarPage() {
    const today = new Date();
    const todayStr = formatDateKey(today);
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(today);

    const selectedDateStr = selectedDate ? formatDateKey(selectedDate) : todayStr;

    // Fetch monthly history overview for dot indicators
    const { data: historyData } = useQuery({
        queryKey: ['checkinHistory'],
        queryFn: () => checkinApi.getHistory(1, 100)
    });

    const checkins = historyData?.items || historyData?.history || [];
    
    // Create a map of date string (YYYY-MM-DD) to checkin summary
    const checkinMap = {};
    checkins.forEach(c => {
        if (!c.date) return;
        const dateStr = typeof c.date === 'string' ? c.date.split('T')[0] : formatDateKey(new Date(c.date));
        checkinMap[dateStr] = c;
    });

    // Fetch exact check-in data for the selected date
    const { data: dateDetails, isLoading: isDetailsLoading } = useQuery({
        queryKey: ['checkinByDate', selectedDateStr],
        queryFn: () => checkinApi.getByDate(selectedDateStr),
        enabled: !!selectedDateStr
    });

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToday = () => {
        const t = new Date();
        setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1));
        setSelectedDate(t);
    };

    const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDayOfWeek = days[0].getDay();
    const paddingDays = Array.from({ length: firstDayOfWeek }).map((_, i) => i);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const hasSavedCheckin = dateDetails && (dateDetails.found || dateDetails.is_completed || dateDetails.has_activities || dateDetails.has_mood || dateDetails.has_wellbeing || dateDetails.has_journal);

    const formatActivityValue = (val, unit) => {
        if (val === undefined || val === null) return 'Not recorded';
        if (val === 0 && !dateDetails?.has_activities) return 'Not recorded';
        return `${val} ${unit}`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 pb-20 px-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-rose-400" />
                        Calendar
                    </h1>
                    <p className="text-slate-300 mt-2">Your historical timeline of daily check-ins, wellbeing, and growth.</p>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Calendar Grid */}
                <div className="flex-1 w-full bg-[#17132e] rounded-3xl p-3 sm:p-6 border border-[#2e2652] shadow-xl">
                    <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">{monthName}</h2>
                        <div className="flex gap-1.5 sm:gap-2">
                            <button onClick={prevMonth} className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button onClick={goToday} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                                Today
                            </button>
                            <button onClick={nextMonth} className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs sm:text-sm font-semibold text-[#a398c7] py-1 sm:py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {paddingDays.map(i => (
                            <div key={`pad-${i}`} className="aspect-square rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5 opacity-40" />
                        ))}
                        
                        {days.map(date => {
                            const dateStr = formatDateKey(date);
                            const hasData = !!checkinMap[dateStr];
                            const isToday = dateStr === todayStr;
                            const isSelected = selectedDate && formatDateKey(selectedDate) === dateStr;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border ${
                                        isSelected ? 'bg-[#7c56ed]/30 border-[#a78bfa] shadow-[0_0_15px_rgba(124,86,237,0.5)] scale-105 z-10' :
                                        hasData ? 'bg-[#221a42] border-[#7c56ed]/40 hover:border-[#7c56ed] hover:bg-[#281f4f]' :
                                        'bg-white/[0.03] border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-[#a78bfa] font-bold' : isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>
                                        {date.getDate()}
                                    </span>
                                    {hasData && (
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#7c56ed] shadow-[0_0_8px_rgba(124,86,237,0.9)]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="w-full lg:w-[460px] flex flex-col gap-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDateStr}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="glass-card p-6 border border-white/10 shadow-2xl space-y-6"
                        >
                            {/* Selected Date Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-rose-400" />
                                    {selectedDate ? selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Selected Date'}
                                </h3>
                                {hasSavedCheckin && (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${dateDetails?.is_completed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                        {dateDetails?.is_completed ? 'Completed' : 'Draft Saved'}
                                    </span>
                                )}
                            </div>

                            {isDetailsLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400" />
                                    <p className="text-sm">Loading historical data...</p>
                                </div>
                            ) : hasSavedCheckin ? (
                                <div className="space-y-6">
                                    {/* Life Score & Rating */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-surface-900/60 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                                                <Activity className="w-4 h-4 text-emerald-400" />
                                                <span>Life Score</span>
                                            </div>
                                            <span className="text-2xl font-bold text-emerald-400 mt-2">
                                                {dateDetails?.life_score?.total_score ?? '-'}
                                            </span>
                                            {dateDetails?.life_score?.breakdown && (
                                                <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1">
                                                    <span>Act: {dateDetails.life_score.breakdown.activities ?? '-'}</span>
                                                    <span>• Mood: {dateDetails.life_score.breakdown.mood ?? '-'}</span>
                                                    <span>• Well: {dateDetails.life_score.breakdown.wellbeing ?? '-'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-surface-900/60 rounded-xl border border-violet-500/20 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                                                <Sparkles className="w-4 h-4 text-violet-400" />
                                                <span>Daily Rating</span>
                                            </div>
                                            <span className="text-2xl font-bold text-violet-400 mt-2">
                                                {dateDetails?.daily_rating ? `${dateDetails.daily_rating} / 10` : 'Not rated'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-1">Self-assessed rating</span>
                                        </div>
                                    </div>

                                    {/* Activities Section */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <HeartPulse className="w-4 h-4 text-rose-400" /> Daily Activities
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🛌 Sleep</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.sleep_hours, 'hrs')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">💧 Water</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.water_intake_ml, 'ml')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">📚 Study</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.study_hours, 'hrs')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">💼 Work</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.work_hours, 'hrs')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🏃 Exercise</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.exercise_minutes, 'mins')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">📖 Reading</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.reading_minutes, 'mins')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🧘 Meditation</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.meditation_minutes, 'mins')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">📱 Screen Time</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.screen_time_minutes, 'mins')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🎮 Leisure</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.leisure_hours, 'hrs')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🚶 Walking Steps</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.walking_steps, 'steps')}</span>
                                            </div>
                                            <div className="p-2.5 bg-surface-900/50 rounded-lg border border-white/5">
                                                <span className="text-slate-400 block mb-1">🔥 Calories</span>
                                                <span className="font-semibold text-slate-200">{formatActivityValue(dateDetails?.activities?.calories_burned, 'kcal')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wellbeing & Mood */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Smile className="w-4 h-4 text-amber-400" /> Wellbeing & Mood
                                        </h4>
                                        <div className="p-3 bg-surface-900/50 rounded-xl border border-white/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-300">Mood</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{dateDetails?.mood?.mood_label || '😐'}</span>
                                                    <span className="text-xs text-slate-400">Score: {dateDetails?.mood?.mood_score ?? 'Not recorded'}/10</span>
                                                </div>
                                            </div>
                                            {dateDetails?.mood?.note && (
                                                <p className="text-xs italic text-slate-300 bg-white/5 p-2 rounded-lg">
                                                    "{dateDetails.mood.note}"
                                                </p>
                                            )}
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="flex justify-between text-xs text-slate-400 bg-surface-800/40 p-2 rounded-lg">
                                                    <span>Energy</span>
                                                    <span className="font-semibold text-slate-200">{dateDetails?.wellbeing?.energy_level ?? 'Not recorded'}/5</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400 bg-surface-800/40 p-2 rounded-lg">
                                                    <span>Stress</span>
                                                    <span className="font-semibold text-slate-200">{dateDetails?.wellbeing?.stress_level ?? 'Not recorded'}/5</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400 bg-surface-800/40 p-2 rounded-lg">
                                                    <span>Focus</span>
                                                    <span className="font-semibold text-slate-200">{dateDetails?.wellbeing?.focus_level ?? 'Not recorded'}/5</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400 bg-surface-800/40 p-2 rounded-lg">
                                                    <span>Motivation</span>
                                                    <span className="font-semibold text-slate-200">{dateDetails?.wellbeing?.motivation_level ?? 'Not recorded'}/5</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Habits & Goals */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Target className="w-4 h-4 text-violet-400" /> Habits & Commitments
                                        </h4>
                                        {dateDetails?.habit_logs && dateDetails.habit_logs.length > 0 ? (
                                            <div className="space-y-2">
                                                {dateDetails.habit_logs.map(h => (
                                                    <div key={h.id || h.habit_id} className="flex items-center justify-between p-2.5 bg-surface-900/50 rounded-lg border border-white/5 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span>{h.icon || '✨'}</span>
                                                            <span className="font-medium text-slate-200">{h.name}</span>
                                                            {h.streak > 0 && (
                                                                <span className="text-[10px] text-amber-400">🔥 {h.streak}d</span>
                                                            )}
                                                        </div>
                                                        {h.completed ? (
                                                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-slate-500">
                                                                <Circle className="w-3.5 h-3.5" /> Not completed
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic bg-surface-900/30 p-3 rounded-lg border border-white/5">
                                                No habits recorded for this check-in.
                                            </p>
                                        )}
                                    </div>

                                    {/* Reflection / Journal */}
                                    {dateDetails?.journal && (dateDetails.journal.title || dateDetails.journal.content) && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-indigo-400" /> Daily Reflection
                                            </h4>
                                            <div className="p-3.5 bg-surface-900/60 rounded-xl border border-white/10 space-y-2">
                                                {dateDetails.journal.title && (
                                                    <h5 className="font-semibold text-slate-200 text-sm">{dateDetails.journal.title}</h5>
                                                )}
                                                {dateDetails.journal.content && (
                                                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                        {dateDetails.journal.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-16 flex flex-col items-center justify-center text-center">
                                    <Circle className="w-10 h-10 text-slate-600 mb-3" />
                                    <p className="text-slate-300 font-medium">No check-in recorded for this date.</p>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                        Select any highlighted date on the calendar to view its logged activities, mood, and reflection.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
