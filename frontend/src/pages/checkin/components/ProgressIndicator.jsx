import React from 'react';
import { motion } from 'framer-motion';
const QUOTES = [
    "Small daily improvements are the key to staggering long-term results.",
    "What you do today can improve all your tomorrows.",
    "Consistency is what transforms average into excellence.",
    "Growth is never by mere chance; it is the result of forces working together.",
    "Success is the sum of small efforts, repeated day in and day out."
];

const ProgressIndicator = React.memo(({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;
    
    // Select quote based on day of year so it's consistent for the session
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    
    return (
        <div className="z-50 mt-6 mb-4 max-w-3xl mx-auto w-full px-4">
            <div className="glass-card p-5 border-white/10">
                <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
                    <span>Step {currentStep} of {totalSteps}</span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-brand shadow-glow-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeInOut", duration: 0.3 }}
                    />
                </div>
                <div className="mt-4 text-center">
                    <p className="text-xs text-amber-500/80 italic font-serif">"{quote}"</p>
                </div>
            </div>
        </div>
    );
});

export default ProgressIndicator;
