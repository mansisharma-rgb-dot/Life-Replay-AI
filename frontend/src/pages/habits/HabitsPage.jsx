import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, CheckCircle2, Circle, Activity, History, AlertCircle, Calendar as CalendarIcon, Flame, Target, Check } from 'lucide-react';
import { habitsApi } from '../../api/habitsApi';
import toast from 'react-hot-toast';

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Habits');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: '✨', frequency: 'daily' });
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState({ dates: [], habitName: '', isLoading: false });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const data = await habitsApi.getHabits();
      
      const enhancedHabits = await Promise.all(data.map(async (h) => {
        try {
          const hist = await habitsApi.getHistory(h.id);
          const today = new Date().toLocaleDateString('en-CA');
          const isCompletedToday = hist.history.includes(today);
          return { ...h, isCompletedToday, completion_count: hist.completion_count, history: hist.history };
        } catch {
          return { ...h, isCompletedToday: false, completion_count: 0, history: [] };
        }
      }));
      
      // Sort by active/incomplete first, then by streak
      enhancedHabits.sort((a, b) => {
        if (a.isCompletedToday !== b.isCompletedToday) return a.isCompletedToday ? 1 : -1;
        return b.current_streak - a.current_streak;
      });

      setHabits(enhancedHabits);
    } catch (err) {
      setError('Failed to load habits. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (habit = null) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({ name: habit.name, icon: habit.icon || '✨', frequency: habit.frequency || 'daily' });
    } else {
      setEditingHabit(null);
      setFormData({ name: '', icon: '✨', frequency: 'daily' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingHabit) {
        await habitsApi.updateHabit(editingHabit.id, formData);
        toast.success('Habit updated');
      } else {
        await habitsApi.createHabit(formData);
        toast.success('Habit created');
      }
      handleCloseModal();
      fetchHabits();
    } catch (err) {
      toast.error('Failed to save habit');
    }
  };

  const toggleCompletion = async (habit) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const newStatus = !habit.isCompletedToday;
    
    // Optimistic update
    setHabits(habits.map(h => {
      if (h.id === habit.id) {
        return { 
          ...h, 
          isCompletedToday: newStatus,
          current_streak: newStatus ? h.current_streak + 1 : Math.max(0, h.current_streak - 1)
        };
      }
      return h;
    }));

    try {
      const updated = await habitsApi.recordCompletion(habit.id, { completed: newStatus, date: todayStr });
      if (newStatus) toast.success(`Completed: ${habit.name}`);
      
      setHabits(prev => prev.map(h => {
        if (h.id === habit.id) {
          return { ...h, ...updated, isCompletedToday: newStatus };
        }
        return h;
      }));
    } catch (err) {
      toast.error('Failed to update habit');
      fetchHabits();
    }
  };

  const handleOpenHistory = async (habit) => {
    setHistoryModalOpen(true);
    setHistoryData({ dates: [], habitName: habit.name, isLoading: true });
    try {
      const hist = await habitsApi.getHistory(habit.id);
      setHistoryData({ dates: hist.history, habitName: habit.name, isLoading: false });
    } catch {
      setHistoryData({ dates: [], habitName: habit.name, isLoading: false });
      toast.error('Failed to load history');
    }
  };

  // Derived Stats
  const activeHabitsCount = habits.length;
  const completedTodayCount = habits.filter(h => h.isCompletedToday).length;
  const bestCurrentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.current_streak)) : 0;
  const successRate = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button onClick={fetchHabits} className="ml-auto underline text-sm hover:text-red-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Habits</h1>
          <p className="text-slate-400 text-sm mt-1">Build consistency, one habit at a time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors">
            <CalendarIcon size={18} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] border border-purple-500/50 text-sm font-medium"
          >
            <Plus size={16} />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* ── Top Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Habits" value={activeHabitsCount} icon={<Target size={18} />} trend="+2 from last month" />
        <StatCard title="Completed Today" value={completedTodayCount} icon={<CheckCircle2 size={18} />} trend="Keep it up!" />
        <StatCard title="Current Streak" value={`${bestCurrentStreak} days`} icon={<Flame size={18} />} trend="One day at a time" />
        <StatCard title="Success Rate" value={`${successRate}%`} icon={<Activity size={18} />} trend={successRate >= 50 ? '+5% from last week' : 'Needs attention'} />
      </div>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Habits List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 border-b border-white/10 pb-2">
            {['All Habits', 'Active', 'Completed', 'Paused'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 -mb-2.5 transition-colors border-b-2 ${
                  activeTab === tab ? 'text-white border-purple-500' : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {habits.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-2xl border-white/5">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity size={28} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No habits yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">Start small. Track daily routines like drinking water, exercising, or meditating to build lasting positive change.</p>
                <button 
                  onClick={() => handleOpenModal()}
                  className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
                >
                  Create your first habit
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {habits.map(habit => (
                  <motion.div 
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card p-4 flex items-center gap-4 transition-all duration-300 ${
                      habit.isCompletedToday ? 'border-purple-500/30 bg-purple-900/10' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <button 
                      onClick={() => toggleCompletion(habit)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        habit.isCompletedToday 
                          ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                          : 'border-2 border-slate-500 text-transparent hover:border-purple-400'
                      }`}
                    >
                      <Check size={14} className={habit.isCompletedToday ? 'opacity-100' : 'opacity-0'} />
                    </button>
                    
                    <div className="flex-shrink-0 w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xl">
                      {habit.icon}
                    </div>

                    <div className="flex-grow">
                      <h3 className={`font-medium ${habit.isCompletedToday ? 'text-slate-300 line-through decoration-purple-500/50' : 'text-white'}`}>
                        {habit.name}
                      </h3>
                      <p className="text-xs text-slate-400 capitalize">{habit.frequency} · Personal Growth</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Flame size={14} className={habit.current_streak > 0 ? "text-orange-400" : "text-slate-600"} />
                        <span className={habit.current_streak > 0 ? "text-white" : "text-slate-500"}>{habit.current_streak}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Day Streak</p>
                    </div>

                    <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                      <button onClick={() => handleOpenHistory(habit)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <History size={14} />
                      </button>
                      <button onClick={() => handleOpenModal(habit)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Column: Habit Stats Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6 border-white/5">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 mb-3 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                <Flame size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Habit Streak</h3>
              <p className="text-slate-400 text-sm mt-1">Keep going strong!</p>
            </div>
            
            <div className="flex items-center justify-center gap-4 py-4 border-y border-white/10 my-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{bestCurrentStreak}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Best Streak</p>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{habits.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Total Habits</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white mb-3">Categories</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Health</span>
                  <span className="text-slate-500">4</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Mind</span>
                  <span className="text-slate-500">2</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Productivity</span>
                  <span className="text-slate-500">3</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleOpenModal()}
              className="w-full mt-6 py-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors text-sm font-medium"
            >
              + Add New Habit
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-sm glass-card p-6 shadow-modal border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">{editingHabit ? 'Edit Habit' : 'Create Habit'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Meditate"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Emoji Icon</label>
                    <input 
                      type="text" 
                      value={formData.icon}
                      onChange={e => setFormData({...formData, icon: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-center text-xl"
                      maxLength="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Frequency</label>
                    <select 
                      value={formData.frequency}
                      onChange={e => setFormData({...formData, frequency: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-2">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-sm">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium text-sm">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* History Modal */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm glass-card p-6 shadow-modal border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{historyData.habitName} History</h2>
                <button onClick={() => setHistoryModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
              </div>
              
              {historyData.isLoading ? (
                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : historyData.dates.length === 0 ? (
                <div className="text-center p-6 text-white/50">No completions yet.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {historyData.dates.map(d => (
                    <div key={d} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                      <CheckCircle2 size={16} className="text-purple-400" />
                      <span className="text-white font-medium">{new Date(d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="glass-card p-4 border-white/5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="text-purple-400/80 bg-purple-500/10 p-1.5 rounded-lg">{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{trend}</p>
      </div>
    </div>
  );
}
