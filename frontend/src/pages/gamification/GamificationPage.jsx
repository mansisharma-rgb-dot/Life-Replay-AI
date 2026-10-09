import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gamificationApi } from '../../api/gamificationApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GamificationPage() {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileData, historyData] = await Promise.all([
                gamificationApi.getProfile(),
                gamificationApi.getXpHistory(1, 30) // Get last 30 events for the chart
            ]);
            setProfile(profileData);
            setHistory(historyData);
        } catch (error) {
            console.error("Failed to load gamification data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-slate-400 animate-pulse">Loading Progress...</div>
            </div>
        );
    }

    if (!profile) return null;

    // Process history data for chart
    const chartData = [...(history?.items || [])]
        .reverse()
        .map(item => ({
            date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            xp: item.xp_amount,
            fullDate: item.created_at
        }));

    // Calculate cumulative XP for the chart
    let cumulative = profile.total_xp - chartData.reduce((acc, curr) => acc + curr.xp, 0);
    const cumulativeChartData = chartData.map(item => {
        cumulative += item.xp;
        return {
            ...item,
            totalXP: cumulative
        };
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-white mb-2">Personal Progress</h1>
                <p className="text-slate-400">Track your growth and level up your life.</p>
            </header>

            {/* Level Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-8"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left flex-1">
                        <div className="text-sm font-medium text-blue-400 mb-1">CURRENT LEVEL</div>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            Level {profile.level}
                        </div>
                        <div className="mt-2 text-slate-300">
                            {profile.total_xp.toLocaleString()} Total XP
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-md">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Level {profile.level}</span>
                            <span className="text-blue-400">{profile.current_level_xp} / {profile.next_level_xp - (profile.total_xp - profile.current_level_xp)} XP</span>
                            <span className="text-slate-400">Level {profile.level + 1}</span>
                        </div>
                        <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden border border-slate-700/50">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${profile.progress_percent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 relative"
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                        </div>
                        <div className="text-center mt-2 text-xs text-slate-500">
                            {profile.progress_percent}% to next level
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 flex flex-col justify-center items-center text-center"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4 text-2xl">
                        🔥
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.current_streak}</div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 flex flex-col justify-center items-center text-center"
                >
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 text-2xl">
                        🏆
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.longest_streak}</div>
                    <div className="text-sm text-slate-400">Longest Streak</div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 flex flex-col justify-center items-center text-center"
                >
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-4 text-2xl">
                        ✨
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{profile.recent_rewards.length > 0 ? `+${profile.recent_rewards[0].xp_amount}` : '-'}</div>
                    <div className="text-sm text-slate-400">Recent XP Gain</div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-6">XP Growth (Recent)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cumulativeChartData}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="#64748b" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(val) => val.toLocaleString()}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                                    itemStyle={{ color: '#a78bfa' }}
                                    formatter={(value) => [`${value} XP`, 'Total']}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="totalXP" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorXp)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-slate-700/50 p-6"
                >
                    <h2 className="text-lg font-semibold text-white mb-6">Recent Rewards</h2>
                    {profile.recent_rewards.length > 0 ? (
                        <div className="space-y-4">
                            {profile.recent_rewards.map((reward, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                    <div className="flex-1">
                                        <div className="text-sm text-slate-200 font-medium">{reward.description}</div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(reward.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                        +{reward.xp_amount} XP
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            No recent rewards. Start completing habits and check-ins to earn XP!
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
