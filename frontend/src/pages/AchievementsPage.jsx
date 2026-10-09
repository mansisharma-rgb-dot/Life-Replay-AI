import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Flame, Award, BookOpen, Sun, Moon, TrendingUp, Lock } from 'lucide-react';
import { achievementsApi } from '../api/achievementsApi';

const iconMap = {
    Trophy: Trophy,
    Star: Star,
    Target: Target,
    Flame: Flame,
    Award: Award,
    BookOpen: BookOpen,
    Sun: Sun,
    Moon: Moon,
    TrendingUp: TrendingUp
};

export default function AchievementsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['achievements'],
        queryFn: achievementsApi.getAchievements
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[70vh] text-red-400">
                Failed to load achievements.
            </div>
        );
    }

    const achievements = data?.achievements || [];
    const unlockedCount = achievements.filter(a => a.is_unlocked).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative z-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-400" />
                        Achievements
                    </h1>
                    <p className="text-slate-300 mt-2">Track your milestones and personal growth victories.</p>
                </div>
                <div className="glass-card px-6 py-3 border border-amber-500/20 shadow-glow-primary">
                    <p className="text-sm text-amber-200/70 uppercase tracking-wider font-semibold">Unlocked</p>
                    <p className="text-2xl font-bold text-amber-400">{unlockedCount} <span className="text-slate-500 text-lg">/ {achievements.length}</span></p>
                </div>
            </header>

            {achievements.length === 0 ? (
                <div className="glass-card p-12 text-center border-white/5">
                    <p className="text-slate-400">Your achievements will appear here as you progress.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((ach) => {
                        const Icon = iconMap[ach.icon] || Trophy;
                        return (
                            <motion.div 
                                key={ach.id_str}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                                    ach.is_unlocked 
                                    ? 'bg-gradient-to-br from-surface-800 to-surface-900 border-amber-500/30 shadow-glow-primary' 
                                    : 'bg-surface-900/50 border-white/5 opacity-70 grayscale hover:grayscale-0'
                                }`}
                            >
                                {/* Background glow for unlocked */}
                                {ach.is_unlocked && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                                )}

                                <div className="flex gap-4 items-start relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                                        ach.is_unlocked 
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-600 border border-amber-300/30' 
                                        : 'bg-surface-800 border border-white/10'
                                    }`}>
                                        <Icon className={`w-7 h-7 ${ach.is_unlocked ? 'text-white' : 'text-slate-500'}`} />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold mb-1 ${ach.is_unlocked ? 'text-amber-50' : 'text-slate-300'}`}>
                                            {ach.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-3">
                                            {ach.description}
                                        </p>
                                        
                                        {ach.is_unlocked ? (
                                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                                <Star className="w-3.5 h-3.5" />
                                                Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                <Lock className="w-3.5 h-3.5" /> Locked
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
