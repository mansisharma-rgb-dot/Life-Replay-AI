import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2 } from 'lucide-react';

const ReviewStep = React.memo(({ data, setCurrentStep }) => {
    // Calculate a mock Life Score preview based on the data provided
    const activities = data.activities || {};
    const mood = data.mood || {};
    
    let previewScore = 50; // Base score
    if (activities.sleep_hours >= 7 && activities.sleep_hours <= 9) previewScore += 15;
    if (activities.water_intake_ml >= 2000) previewScore += 10;
    if (activities.exercise_minutes >= 30) previewScore += 10;
    if (activities.study_hours >= 4) previewScore += 10;
    if (mood.mood_score >= 7) previewScore += 10;
    if (activities.screen_time_minutes > 240) previewScore -= 5;
    
    previewScore = Math.min(100, Math.max(0, previewScore));

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-rose-400';
    };

    // Intelligent Validation Warnings
    const warnings = [];
    if (activities.sleep_hours > 16) warnings.push("You logged over 16 hours of sleep. Please verify this is correct.");
    if (activities.sleep_hours > 0 && activities.sleep_hours < 3) warnings.push("Extremely low sleep logged. Double check your entry.");
    if (activities.water_intake_ml > 8000) warnings.push("Over 8 Liters of water logged. Please verify.");
    if (activities.study_hours > 16) warnings.push("Over 16 hours of deep work logged. Avoid burnout!");

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Review & Complete</h2>
                <p className="text-gray-400 mt-2">Almost done! Review your day before submitting.</p>
            </div>

            <div className="glass-card p-8 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative">
                    <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-surface-700" strokeWidth="10" fill="none" />
                        <motion.circle 
                            cx="80" cy="80" r="70" 
                            className={`stroke-current ${getScoreColor(previewScore)} shadow-glow-primary`}
                            strokeWidth="10" fill="none"
                            strokeDasharray="440"
                            initial={{ strokeDashoffset: 440 }}
                            animate={{ strokeDashoffset: 440 - (440 * previewScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white">{previewScore}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">Est. Score</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-md mt-6">
                    <div className="text-center group relative cursor-pointer" onClick={() => setCurrentStep(1)}>
                        <p className="text-sm text-gray-400 group-hover:text-primary-400 transition-colors">Total Productivity ✎</p>
                        <p className="text-xl font-bold text-white mt-1">
                            {Number(activities.study_hours || 0) + Number(activities.work_hours || 0)} <span className="text-sm">hrs</span>
                        </p>
                    </div>
                    <div className="text-center group relative cursor-pointer" onClick={() => setCurrentStep(2)}>
                        <p className="text-sm text-gray-400 group-hover:text-primary-400 transition-colors">Mood Label ✎</p>
                        <p className="text-3xl mt-1">{mood.mood_label || '😐'}</p>
                    </div>
                </div>
            </div>

            {warnings.length > 0 && (
                <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-rose-400">Please review these warnings:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-300">
                        {warnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-primary-900/20 border border-primary-500/30 rounded-xl p-4 flex items-start gap-4">
                <Trophy className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-primary-300">Ready to level up?</h4>
                    <p className="text-sm text-gray-300 mt-1">Submitting this check-in will permanently lock these entries and award you +50 XP.</p>
                </div>
            </div>
        </motion.div>
    );
});

export default ReviewStep;
