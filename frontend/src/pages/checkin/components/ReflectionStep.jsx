import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import gratitudeReadingImg from '../../../assets/characters/gratitude_reading.jpg';

const ReflectionStep = React.memo(({ data, updateJournal }) => {
    const journal = data.journal || {};

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-lg">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 border border-purple-400/30 shadow-[0_0_20px_rgba(124,86,237,0.3)]">
                    <img src={gratitudeReadingImg} alt="Daily Reflection" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Daily Reflection</h2>
                    <p className="text-xs text-[#a398c7] mt-0.5">Take a quiet moment to write your thoughts and gratitude.</p>
                </div>
            </div>

            <div className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-[#a78bfa]" />
                        <h3 className="text-base font-bold text-white">Journal Entry</h3>
                    </div>
                    <span className="text-xs text-[#a398c7]">
                        {(journal.content || '').trim().split(/\s+/).filter(x => x).length} words
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Title</label>
                        <input 
                            type="text" 
                            placeholder="E.g., A productive Tuesday"
                            className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
                            value={journal.title || ''}
                            onChange={(e) => updateJournal('title', e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Content</label>
                        <textarea 
                            rows={8}
                            placeholder="Write your thoughts..."
                            className="w-full bg-surface-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 text-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner resize-y leading-relaxed"
                            value={journal.content || ''}
                            onChange={(e) => updateJournal('content', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export default ReflectionStep;
