import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, CheckCircle, Target, Clock, AlertCircle, TrendingUp, Award, Flag } from 'lucide-react';
import { goalsApi } from '../../api/goalsApi';
import toast from 'react-hot-toast';
import moodFocused from '../../assets/characters/mood_focused.jpg';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({ title: '', target: 100, progress: 0, deadline: '', category: '' });
  
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const data = await goalsApi.getGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        target: goal.target,
        progress: goal.progress,
        deadline: goal.deadline || '',
        category: goal.category || ''
      });
    } else {
      setEditingGoal(null);
      setFormData({ title: '', target: 100, progress: 0, deadline: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    const payload = {
      ...formData,
      target: Number(formData.target),
      progress: Number(formData.progress),
      deadline: formData.deadline || null
    };

    try {
      if (editingGoal) {
        await goalsApi.updateGoal(editingGoal.id, payload);
        toast.success('Goal updated');
      } else {
        await goalsApi.createGoal(payload);
        toast.success('Goal created');
      }
      handleCloseModal();
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.details?.title?.[0] || 'Failed to save goal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalsApi.deleteGoal(id);
        toast.success('Goal deleted');
        setGoals(goals.filter(g => g.id !== id));
      } catch (err) {
        toast.error('Failed to delete goal');
      }
    }
  };

  const handleProgressUpdate = async (goal, newProgress) => {
    try {
      const updated = await goalsApi.updateGoal(goal.id, { progress: newProgress });
      setGoals(goals.map(g => g.id === goal.id ? updated : g));
      if (updated.status === 'completed' && goal.status !== 'completed') {
        toast.success('Goal completed! 🎉');
      }
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status !== 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button onClick={fetchGoals} className="ml-auto underline text-sm hover:text-red-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-emerald-400/30 shadow-[0_0_16px_rgba(52,211,153,0.3)]">
            <img src={moodFocused} alt="Goal Champion" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vision & Goals</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Set milestones and conquer your personal ambitions.</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-full transition-all text-sm font-semibold active:scale-95 shadow-[0_4px_20px_rgba(108,82,212,0.4)]"
          style={{
            background: 'linear-gradient(135deg, #6c52d4 0%, #7c56ed 50%, #8c62f5 100%)',
          }}
        >
          <Plus size={16} />
          <span>New Goal</span>
        </button>
      </div>

      {/* ── Top Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-4 sm:mb-8">
        <div className="mobile-card p-3 sm:p-5 flex items-center justify-between border-white/5">
          <div>
            <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 truncate">Total</p>
            <p className="text-xl sm:text-3xl font-bold text-white">{goals.length}</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Target className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
        
        <div className="mobile-card p-3 sm:p-5 flex items-center justify-between border-white/5">
          <div>
            <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 truncate">Active</p>
            <p className="text-xl sm:text-3xl font-bold text-white">{inProgressGoals}</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="mobile-card p-3 sm:p-5 flex items-center justify-between border-white/5">
          <div>
            <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 truncate">Done</p>
            <p className="text-xl sm:text-3xl font-bold text-white">{completedGoals}</p>
          </div>
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Award className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* ── Main Goals Grid ──────────────────────────────────────────────────── */}
      {goals.length === 0 ? (
        <div className="bg-[#17132e] border border-[#2e2652] p-8 sm:p-12 text-center rounded-3xl shadow-lg">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3.5 border border-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <img src={moodFocused} alt="Goal Companion" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">No goals created yet</h3>
          <p className="text-xs sm:text-sm text-[#a398c7] mb-5 max-w-md mx-auto leading-relaxed">
            Set ambitious milestones and track your journey over time. Learn a skill, build fitness, or start a project.
          </p>
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-full text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #6c52d4 0%, #7c56ed 50%, #8c62f5 100%)',
            }}
          >
            Create Your First Goal ✨
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-6">
          <AnimatePresence>
            {goals.map(goal => {
              const progressPercent = Math.min(100, Math.round((goal.progress / goal.target) * 100)) || 0;
              const isCompleted = goal.status === 'completed';
              
              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mobile-card p-4 sm:p-6 flex flex-col group relative overflow-hidden transition-all duration-300 ${isCompleted ? 'border-emerald-500/30' : 'border-white/5 hover:border-cyan-500/30'}`}
                >
                  {/* Subtle Glow */}
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] transition-colors duration-700 pointer-events-none ${isCompleted ? 'bg-emerald-500/10' : 'bg-cyan-500/5 group-hover:bg-cyan-500/15'}`} />
                  
                  <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base sm:text-lg font-bold truncate ${isCompleted ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-white'}`}>
                        {goal.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {goal.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-900/30 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                            {goal.category}
                          </span>
                        )}
                        {goal.deadline && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Clock size={12} />
                            {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Always visible on touch, hover on desktop */}
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(goal)} className="p-2 sm:p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-target tap-press" aria-label="Edit goal">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="p-2 sm:p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors touch-target tap-press" aria-label="Delete goal">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 relative z-10">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-slate-300">{goal.progress} <span className="text-slate-500">/ {goal.target}</span></span>
                      <span className={isCompleted ? "text-emerald-400" : "text-cyan-400"}>{progressPercent}%</span>
                    </div>
                    
                    {/* Premium Progress Bar */}
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                          isCompleted 
                            ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      >
                        {/* Shimmer effect inside progress bar */}
                        {!isCompleted && (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end mt-4">
                      {!isCompleted ? (
                        <button 
                          onClick={() => handleProgressUpdate(goal, goal.progress + 1)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Plus size={12} />
                          Add Progress
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                          <CheckCircle size={14} />
                          <span>Goal Achieved</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Edit/Create Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md glass-card p-6 shadow-2xl border-white/10 bg-surface-950/90"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="text-cyan-400" size={20} />
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                    placeholder="e.g. Run a Marathon"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Progress</label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      value={formData.progress}
                      onChange={e => setFormData({...formData, progress: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Goal</label>
                    <input 
                      type="number" 
                      min="0.1"
                      step="any"
                      value={formData.target}
                      onChange={e => setFormData({...formData, target: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-600"
                      placeholder="e.g. Fitness"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
                    <input 
                      type="date" 
                      value={formData.deadline}
                      onChange={e => setFormData({...formData, deadline: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-cyan-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors font-medium text-sm shadow-[0_0_15px_rgba(8,145,178,0.3)]"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
