import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Star, Award, Trash2, Edit2, Check, X } from 'lucide-react';
import { skillsApi } from '../api/skillsApi';

export default function SkillsPage() {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', category: 'Technical' });
    const [editProgress, setEditProgress] = useState(0);

    const { data: skills = [], isLoading, error } = useQuery({
        queryKey: ['skills'],
        queryFn: skillsApi.getSkills
    });

    const addMutation = useMutation({
        mutationFn: skillsApi.addSkill,
        onSuccess: () => {
            queryClient.invalidateQueries(['skills']);
            setIsAdding(false);
            setFormData({ name: '', category: 'Technical' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => skillsApi.updateSkill(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['skills']);
            setEditingId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: skillsApi.deleteSkill,
        onSuccess: () => queryClient.invalidateQueries(['skills'])
    });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (formData.name.trim()) {
            addMutation.mutate(formData);
        }
    };

    const handleUpdateProgress = (id, currentProgress, amount) => {
        updateMutation.mutate({ id, data: { progress: currentProgress + amount } });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[70vh] text-red-400">
                Failed to load skills.
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative z-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-violet-400" />
                        Skill Growth
                    </h1>
                    <p className="text-slate-300 mt-2">Track and level up your personal and professional skills.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary flex items-center gap-2 shadow-glow-primary"
                >
                    <Plus className="w-5 h-5" /> Add Skill
                </button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddSubmit}
                        className="glass-card p-6 border border-violet-500/30"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">New Skill</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text"
                                placeholder="Skill Name (e.g. Python, Piano, Leadership)"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="input-field flex-1"
                                required
                            />
                            <select 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                className="input-field md:w-48"
                            >
                                <option value="Technical">Technical</option>
                                <option value="Creative">Creative</option>
                                <option value="Language">Language</option>
                                <option value="Physical">Physical</option>
                                <option value="Soft Skill">Soft Skill</option>
                            </select>
                            <button type="submit" className="btn-primary">Create</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {skills.length === 0 && !isAdding ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center border-white/5"
                >
                    <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/20">
                        <Award className="w-10 h-10 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Start your skill journey</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-8">
                        Track your progress in programming, languages, instruments, or any other skill you want to master.
                    </p>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="btn-secondary"
                    >
                        Add your first skill
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map((skill) => (
                        <motion.div 
                            key={skill.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-4 sm:p-6 group relative overflow-hidden"
                        >
                            <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-2 sm:p-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2">
                                <button 
                                    onClick={() => deleteMutation.mutate(skill.id)}
                                    aria-label="Delete skill"
                                    className="p-2 sm:p-1.5 rounded-xl sm:rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20">
                                        {skill.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mt-3">{skill.name}</h3>
                                </div>
                                <div className="text-center px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                                    <div className="text-xs text-slate-400 uppercase">Level</div>
                                    <div className="text-2xl font-bold text-emerald-400">{skill.level}</div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300">Progress</span>
                                    <span className="text-violet-300 font-medium">{Math.floor(skill.progress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${skill.progress}%` }}
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button 
                                    onClick={() => handleUpdateProgress(skill.id, skill.progress, 10)}
                                    className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4 text-amber-400" /> +10 XP
                                </button>
                                <button 
                                    onClick={() => handleUpdateProgress(skill.id, skill.progress, 25)}
                                    className="flex-1 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-sm font-semibold text-violet-300 hover:bg-violet-500/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <TrendingUp className="w-4 h-4" /> +25 XP
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
