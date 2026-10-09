import React from 'react';
import { motion } from 'framer-motion';

export default function GithubHeatmap({ history }) {
    // Generate a grid of 52 weeks x 7 days representing the last 365 days
    const today = new Date();
    const days = Array.from({ length: 365 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (364 - i));
        return d;
    });

    const getScoreForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        const record = history.find(h => h.date.startsWith(dateString));
        if (record && record.life_score !== undefined && record.life_score !== null) {
            return typeof record.life_score === 'object' ? record.life_score.total_score : record.life_score;
        }
        return null; // no data
    };

    const getColorClass = (score) => {
        if (score === null) return 'bg-surface-800';
        if (score < 40) return 'bg-primary-900/40';
        if (score < 60) return 'bg-primary-700/60';
        if (score < 80) return 'bg-primary-500';
        return 'bg-primary-400 shadow-glow-primary';
    };

    return (
        <div className="glass-card p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Yearly Growth Heatmap</h3>
            <div className="flex gap-1 min-w-max">
                {/* Generate columns (weeks) */}
                {Array.from({ length: 52 }).map((_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIdx) => {
                            const dayIndex = weekIdx * 7 + dayIdx;
                            if (dayIndex >= 365) return <div key={dayIdx} className="w-3 h-3" />;
                            
                            const date = days[dayIndex];
                            const score = getScoreForDate(date);
                            
                            return (
                                <div 
                                    key={dayIdx}
                                    title={`${date.toDateString()}: ${score !== null ? score + ' Score' : 'No Data'}`}
                                    className={`w-3 h-3 rounded-[2px] transition-colors cursor-help ${getColorClass(score)}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 justify-end w-full max-w-3xl">
                <span>Less</span>
                <div className="w-3 h-3 rounded-[2px] bg-surface-800"></div>
                <div className="w-3 h-3 rounded-[2px] bg-primary-900/40"></div>
                <div className="w-3 h-3 rounded-[2px] bg-primary-700/60"></div>
                <div className="w-3 h-3 rounded-[2px] bg-primary-500"></div>
                <div className="w-3 h-3 rounded-[2px] bg-primary-400"></div>
                <span>More</span>
            </div>
        </div>
    );
}
