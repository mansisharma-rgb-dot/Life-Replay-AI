import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { habitsApi } from '../../../api/habitsApi';
import { Link } from 'react-router-dom';

const GoalsHabitsStep = React.memo(({ data, setData }) => {
    // State handling for real habits
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [loadingIds, setLoadingIds] = useState(new Set());

    // Fetch habits on mount
    useEffect(() => {
        const fetchHabits = async () => {
            try {
                const result = await habitsApi.getHabits();
                setHabits(result);
                setError(false);
            } catch (err) {
                console.error('Failed to load habits', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchHabits();
    }, []);

    const toggleHabit = async (habit) => {
        if (loadingIds.has(habit.id)) return;
        const newCompleted = !habit.completed_today;
        // Optimistic UI update
        setHabits(prev =>
            prev.map(h =>
                h.id === habit.id ? { ...h, completed_today: newCompleted, streak: newCompleted ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1) } : h
            )
        );
        setLoadingIds(prev => new Set(prev).add(habit.id));
        try {
            const updated = await habitsApi.recordCompletion(habit.id, { completed: newCompleted });
            // Replace with exact backend response
            setHabits(prev => prev.map(h => (h.id === habit.id ? updated : h)));
            if (newCompleted) {
                toast.success(`Completed: ${habit.name}!`, { icon: habit.icon });
            } else {
                toast('Habit unmarked.', { icon: '↩️' });
            }
        } catch (err) {
            console.error('Toggle habit failed', err);
            toast.error('Failed to update habit');
            // Rollback optimistic change
            setHabits(prev =>
                prev.map(h =>
                    h.id === habit.id ? { ...h, completed_today: !newCompleted, streak: !newCompleted ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1) } : h
                )
            );
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(habit.id);
                return next;
            });
        }
    };

    // No more mock progress array

    // Render states
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-center min-h-[200px]"
            >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </motion.div>
        );
    }
    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-rose-500/20 border border-rose-500/40 rounded-xl text-center"
            >
                <p className="text-rose-200 font-semibold">Unable to load habits</p>
                <button onClick={() => { setLoading(true); setError(false); setHabits([]); }} className="btn-secondary mt-2">
                    Retry
                </button>
            </motion.div>
        );
    }
    if (habits.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-surface-800/40 border border-surface-700 rounded-xl text-center"
            >
                <p className="text-slate-300 mb-2">No habits yet</p>
                <p className="text-slate-400 mb-4">Create a habit to start building your routine.</p>
                <Link to="/habits" className="btn-primary">
                    Create Habit
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Goals & Habits</h2>
                <p className="text-gray-400 mt-2">Track your daily commitments.</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-primary-400" /> Daily Habits
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {habits.map(habit => (
                        <div 
                            key={habit.id}
                            onClick={() => toggleHabit(habit)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                                habit.completed_today 
                                ? 'bg-primary-500/20 border-primary-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                                : 'bg-surface-800/40 border-white/5 hover:bg-surface-800/60 hover:border-white/20 backdrop-blur-sm'
                            } ${loadingIds.has(habit.id) ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{habit.icon}</span>
                                <div>
                                    <p className={`font-semibold ${habit.completed_today ? 'text-primary-300' : 'text-slate-200'}`}>
                                        {habit.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        🔥 {(habit.current_streak || habit.streak) || 0} Day Streak
                                    </p>
                                </div>
                            </div>
                            <div>
                                {habit.completed_today ? (
                                    <CheckCircle2 className="w-6 h-6 text-primary-400" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-600" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card p-6 mt-8 text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-white mb-2">
                    <Target className="w-5 h-5 text-indigo-400" /> Goal Progress
                </h3>
                <p className="text-sm text-slate-400">Real goal progress will appear here in future updates.</p>
            </div>

            <div className="glass-card p-6 mt-8 text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2 text-white mb-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> Achievements
                </h3>
                <p className="text-sm text-slate-400">Unlock achievements by completing habits and goals.</p>
            </div>
        </motion.div>
    );
});

export default GoalsHabitsStep;
