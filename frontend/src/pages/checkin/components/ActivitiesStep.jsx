import React from 'react';
import { Activity, Moon, Droplets, BookOpen, Monitor, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivitiesStep = React.memo(({ data, updateActivity }) => {
    const act = data.activities || {};
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Daily Activities</h2>
                <p className="text-gray-400 mt-2">Log your core metrics for today to see your productivity score.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <Moon className="w-5 h-5 text-indigo-400"/> Sleep (Hours)
                    </label>
                    <input type="number" min="0" max="24" step="0.5" 
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-indigo-500 transition-colors"
                        value={act.sleep_hours || 0}
                        onChange={(e) => updateActivity('sleep_hours', e.target.value)}
                    />
                </div>
                
                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <BookOpen className="w-5 h-5 text-emerald-400"/> Deep Work / Study (Hours)
                    </label>
                    <input type="number" min="0" max="24" step="0.5"
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-emerald-500 transition-colors"
                        value={act.study_hours || 0}
                        onChange={(e) => updateActivity('study_hours', e.target.value)}
                    />
                </div>

                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <Activity className="w-5 h-5 text-amber-400"/> Exercise (Mins)
                    </label>
                    <input type="number" min="0" step="10"
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-amber-500 transition-colors"
                        value={act.exercise_minutes || 0}
                        onChange={(e) => updateActivity('exercise_minutes', e.target.value)}
                    />
                </div>

                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <Droplets className="w-5 h-5 text-blue-400"/> Water Intake (ml)
                    </label>
                    <input type="number" min="0" step="100"
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-blue-500 transition-colors"
                        value={act.water_intake_ml || 0}
                        onChange={(e) => updateActivity('water_intake_ml', e.target.value)}
                    />
                </div>

                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <Monitor className="w-5 h-5 text-rose-400"/> Screen Time (Mins)
                    </label>
                    <input type="number" min="0" step="15"
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-rose-500 transition-colors"
                        value={act.screen_time_minutes || 0}
                        onChange={(e) => updateActivity('screen_time_minutes', e.target.value)}
                    />
                </div>

                <div className="space-y-2 glass-card p-4">
                    <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                        <Brain className="w-5 h-5 text-violet-400"/> Meditation (Mins)
                    </label>
                    <input type="number" min="0" step="5"
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:ring-1 shadow-inner transition-all focus:border-violet-500 transition-colors"
                        value={act.meditation_minutes || 0}
                        onChange={(e) => updateActivity('meditation_minutes', e.target.value)}
                    />
                </div>
            </div>
        </motion.div>
    );
});

export default ActivitiesStep;
