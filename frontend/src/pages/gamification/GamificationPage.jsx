import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { gamificationApi } from '../../api/gamificationApi';
import { analyticsApi } from '../../api/analyticsApi';
import { 
  ArrowLeft, MoreVertical, Flame, Clock, Trophy, 
  Lightbulb, Sparkles 
} from 'lucide-react';

export default function GamificationPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [period, setPeriod] = useState('week'); // 'week' | 'month' | 'year'
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileData, analyticsData] = await Promise.allSettled([
                gamificationApi.getProfile(),
                analyticsApi.getTimeAnalysis('7d')
            ]);
            if (profileData.status === 'fulfilled') setProfile(profileData.value);
            if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
        } catch (error) {
            console.error("Failed to load progress data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-[#7c56ed]/30 border-t-[#7c56ed] rounded-full animate-spin" />
            </div>
        );
    }

    const currentStreak = profile?.current_streak ?? 7;
    const totalMinutes = analytics?.summary?.productiveHoursTotal 
      ? Math.round(analytics.summary.productiveHoursTotal * 60) 
      : 135;
    const achievementsCount = profile?.longest_streak ?? 12;

    // Mood bar chart data for Mon-Sun matching Reference Image 2
    const weekDays = [
      { day: 'Mon', height: '55%', active: false },
      { day: 'Tue', height: '70%', active: false },
      { day: 'Wed', height: '60%', active: false },
      { day: 'Thu', height: '95%', active: true },
      { day: 'Fri', height: '45%', active: false },
      { day: 'Sat', height: '80%', active: false },
      { day: 'Sun', height: '65%', active: false },
    ];

    return (
        <div className="max-w-xl mx-auto space-y-5 pb-8 animate-fade-in">
            {/* ── Top Header matching Reference Image 2 (middle) ──────────────── */}
            <div className="flex items-center justify-between pt-1">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-white font-semibold text-sm hover:text-violet-300 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-[#1b1636] border border-white/10 flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </div>
                    <span>Dashboard</span>
                </button>

                <div className="w-8 h-8 rounded-full bg-[#1b1636] border border-white/10 flex items-center justify-center text-slate-300">
                    <MoreVertical className="w-4 h-4" />
                </div>
            </div>

            {/* ── "Your Progress" Title + Filter Pills ─────────────────────────── */}
            <div className="flex items-end justify-between gap-3 pt-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Your Progress
                    </h1>
                    <p className="text-xs text-[#a398c7] mt-0.5">
                        Track your journey
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-[#181335] p-1 rounded-full border border-white/5">
                    {['week', 'month', 'year'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                            period === p
                              ? 'bg-[#6c52d4] text-white shadow-[0_2px_10px_rgba(108,82,212,0.4)]'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── 3 Stat Cards Row matching Reference Image 2 ──────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {/* 1. Day Streak */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col justify-between shadow-md"
                >
                    <div className="w-8 h-8 rounded-full bg-[#0284c7]/20 flex items-center justify-center mb-3">
                        <Flame className="w-4 h-4 text-[#38bdf8]" />
                    </div>
                    <div>
                        <span className="text-xl sm:text-2xl font-black text-white block">
                            {currentStreak}
                        </span>
                        <span className="text-[11px] text-[#a398c7] font-medium leading-tight">
                            Day Streak
                        </span>
                    </div>
                </motion.div>

                {/* 2. Total Minutes */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col justify-between shadow-md"
                >
                    <div className="w-8 h-8 rounded-full bg-[#7c56ed]/20 flex items-center justify-center mb-3">
                        <Clock className="w-4 h-4 text-[#c084fc]" />
                    </div>
                    <div>
                        <span className="text-xl sm:text-2xl font-black text-white block">
                            {totalMinutes}
                        </span>
                        <span className="text-[11px] text-[#a398c7] font-medium leading-tight">
                            Total Minutes
                        </span>
                    </div>
                </motion.div>

                {/* 3. Achievement */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-3.5 flex flex-col justify-between shadow-md"
                >
                    <div className="w-8 h-8 rounded-full bg-[#ea580c]/20 flex items-center justify-center mb-3">
                        <Trophy className="w-4 h-4 text-[#fb923c]" />
                    </div>
                    <div>
                        <span className="text-xl sm:text-2xl font-black text-white block">
                            {achievementsCount}
                        </span>
                        <span className="text-[11px] text-[#a398c7] font-medium leading-tight">
                            Achievement
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* ── "Mood Tracker" Weekly Bar Chart matching Reference Image 2 ───── */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white tracking-tight">
                        Mood Tracker
                    </h2>
                    <span className="text-xs text-[#c7b8f5] font-semibold">Weekly View</span>
                </div>

                {/* Vertical rounded pill bars */}
                <div className="h-44 pt-4 pb-2 px-3 flex items-end justify-between gap-2 bg-[#120f26]/60 rounded-2xl border border-white/5">
                    {weekDays.map((item) => (
                        <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                            <div className="w-full flex items-end justify-center h-32">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: item.height }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`w-3 sm:w-3.5 rounded-full ${
                                        item.active 
                                          ? 'bg-gradient-to-t from-[#6c52d4] to-[#a78bfa] shadow-[0_0_12px_rgba(108,82,212,0.6)]'
                                          : 'bg-[#d0bfff]/70'
                                    }`}
                                />
                            </div>
                            <span className={`text-[11px] font-medium ${item.active ? 'text-white font-bold' : 'text-[#8e84ab]'}`}>
                                {item.day}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* ── "Insights & Tips" Card matching Reference Image 2 ────────────── */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-3"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-400">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Insights & Tips</h3>
                        <p className="text-[11px] text-[#a398c7]">Personalized for your wellbeing</p>
                    </div>
                </div>

                <div className="space-y-2 pt-1 pl-1">
                    <div className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <span>You felt most calm after evening walks and focused study sessions.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                        <span>Try a 5-minute breathing reflection for deeper evening sleep.</span>
                    </div>
                </div>
            </motion.section>
        </div>
    );
}
