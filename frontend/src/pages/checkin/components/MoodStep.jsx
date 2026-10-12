import React from 'react';
import { motion } from 'framer-motion';
import { Star, Battery, Target, Heart, Zap } from 'lucide-react';

const MOOD_EMOJIS = [
    { label: 'Ecstatic', emoji: '😀', score: 10, glow: 'ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] bg-yellow-400/20' },
    { label: 'Happy', emoji: '😄', score: 8, glow: 'ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-amber-400/20' },
    { label: 'Good', emoji: '😊', score: 7, glow: 'ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)] bg-emerald-400/20' },
    { label: 'Neutral', emoji: '😐', score: 5, glow: 'ring-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)] bg-blue-400/20' },
    { label: 'Sad', emoji: '😔', score: 3, glow: 'ring-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.5)] bg-indigo-400/20' },
    { label: 'Crying', emoji: '😭', score: 1, glow: 'ring-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.5)] bg-purple-400/20' },
    { label: 'Tired', emoji: '😴', score: 4, glow: 'ring-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.5)] bg-slate-400/20' },
    { label: 'Frustrated', emoji: '😤', score: 2, glow: 'ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] bg-orange-500/20' },
    { label: 'Angry', emoji: '😡', score: 1, glow: 'ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] bg-red-500/20' },
];

const MoodStep = React.memo(({ data, updateMood, updateWellbeing }) => {
    const mood = data.mood || {};
    const wellbeing = data.wellbeing || {};

    const SliderField = ({ icon: Icon, label, value, onChange, colorClass }) => (
        <div className="space-y-3 glass-card p-4">
            <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300 flex items-center gap-2 font-semibold">
                    <Icon className={`w-5 h-5 ${colorClass}`}/> {label}
                </label>
                <span className={`text-sm font-bold ${colorClass}`}>{value || 3} / 5</span>
            </div>
            <input 
                type="range" min="1" max="5" step="1"
                className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                value={value || 3}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Mood & Wellbeing</h2>
                <p className="text-gray-400 mt-2">How are you feeling mentally and physically today?</p>
            </div>

            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Star className="w-6 h-6 text-amber-400" />
                    <h3 className="text-xl font-semibold text-white">Overall Mood</h3>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {MOOD_EMOJIS.map(m => {
                        const isActive = mood.mood_label === m.emoji;
                        return (
                            <button
                                key={m.label}
                                onClick={() => {
                                    updateMood('mood_label', m.emoji);
                                    updateMood('mood_score', m.score);
                                }}
                                className={`text-4xl p-3 rounded-2xl transition-all duration-300 relative flex flex-col items-center gap-2 ${
                                    isActive 
                                    ? `scale-110 ring-2 ${m.glow}` 
                                    : 'hover:bg-white/5 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 border border-transparent hover:border-white/10'
                                }`}
                            >
                                {m.emoji}
                                {isActive && <span className="text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 text-white">{m.label}</span>}
                            </button>
                        );
                    })}
                </div>
                
                <div className="space-y-2 max-w-xl mx-auto">
                    <label className="text-sm text-gray-400 pl-1">Briefly, why do you feel this way?</label>
                    <input 
                        type="text" 
                        placeholder="E.g., had a great meeting, didn't sleep well..."
                        className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
                        value={mood.note || ''}
                        onChange={(e) => updateMood('note', e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderField 
                    icon={Zap} label="Energy Level" colorClass="text-yellow-400"
                    value={wellbeing.energy_level} onChange={(val) => updateWellbeing('energy_level', val)}
                />
                <SliderField 
                    icon={Heart} label="Stress Level" colorClass="text-rose-400"
                    value={wellbeing.stress_level} onChange={(val) => updateWellbeing('stress_level', val)}
                />
                <SliderField 
                    icon={Target} label="Focus Level" colorClass="text-blue-400"
                    value={wellbeing.focus_level} onChange={(val) => updateWellbeing('focus_level', val)}
                />
                <SliderField 
                    icon={Battery} label="Motivation Level" colorClass="text-emerald-400"
                    value={wellbeing.motivation_level} onChange={(val) => updateWellbeing('motivation_level', val)}
                />
            </div>
        </motion.div>
    );
});

export default MoodStep;
