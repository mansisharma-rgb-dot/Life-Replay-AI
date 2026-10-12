import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const ReflectionStep = React.memo(({ data, updateJournal }) => {
    const journal = data.journal || {};

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Daily Reflection</h2>
                <p className="text-gray-400 mt-2">Take a moment to reflect on your day.</p>
            </div>

            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                        <h3 className="text-xl font-semibold text-white">Journal</h3>
                    </div>
                    <span className="text-xs text-gray-500">
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
