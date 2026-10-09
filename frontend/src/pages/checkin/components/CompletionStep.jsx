import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';

const CompletionStep = React.memo(({ data }) => {
    const { width, height } = useWindowSize();
    const navigate = useNavigate();
    const [showConfetti, setShowConfetti] = useState(true);

    // Calculate score
    const activities = data?.activities || {};
    const mood = data?.mood || {};
    const wellbeing = data?.wellbeing || {};
    
    let previewScore = 50;
    if (activities.sleep_hours >= 7 && activities.sleep_hours <= 9) previewScore += 15;
    if (activities.water_intake_ml >= 2000) previewScore += 10;
    if (activities.exercise_minutes >= 30) previewScore += 10;
    if (activities.study_hours >= 4) previewScore += 10;
    if (mood.mood_score >= 7) previewScore += 10;
    if (activities.screen_time_minutes > 240) previewScore -= 5;
    previewScore = Math.min(100, Math.max(0, previewScore));

    // Dynamic Confetti
    const confettiCount = previewScore > 80 ? 800 : previewScore > 50 ? 400 : 100;
    
    // Smart Summary
    const insights = [];
    if (activities.sleep_hours < 6) insights.push("Prioritize getting 7-9 hours of rest tonight.");
    else if (activities.sleep_hours > 9) insights.push("Try waking up a bit earlier to maintain energy.");
    if (wellbeing.stress_level >= 4) insights.push("Consider a 10-minute mindfulness session.");
    if (activities.water_intake_ml < 1500) insights.push("Stay hydrated! Aim for 2L of water tomorrow.");
    if ((activities.study_hours + activities.work_hours) >= 6) insights.push("Incredible focus and productivity today!");
    
    
    // Removed mock personal best check
    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), previewScore > 80 ? 8000 : 5000);
        return () => clearTimeout(timer);
    }, [previewScore]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center justify-center space-y-8 py-12 text-center"
        >
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={confettiCount} gravity={previewScore > 80 ? 0.2 : 0.1} />}
            
            <div className="relative">
                <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 rounded-full animate-pulse" />
                <img src="/assets/trophy.png" alt="Success" className="w-32 h-32 relative z-10 hidden" />
                <Trophy className="w-32 h-32 text-amber-400 relative z-10 drop-shadow-2xl" />
            </div>

            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-brand mb-4">
                    Excellent Work!
                </h2>
                <p className="text-lg text-gray-300">You've successfully completed your daily check-in.</p>
            </div>

            {insights.length > 0 && (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-md w-full text-left bg-surface-800/50 rounded-xl p-4 border border-surface-700"
                >
                    <h4 className="text-sm font-semibold text-primary-400 mb-2">Smart Summary</h4>
                    <ul className="space-y-2">
                        {insights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-primary-500 mt-0.5">•</span> {insight}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Removed mock XP and Streak stats */}

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-8 w-full max-w-sm"
            >
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2 shadow-glow-primary hover:scale-105 transition-transform"
                >
                    Return to Dashboard <ArrowRight className="w-5 h-5" />
                </button>
            </motion.div>
        </motion.div>
    );
});

export default CompletionStep;
