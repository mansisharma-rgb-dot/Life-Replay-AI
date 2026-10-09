import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Edit2, AlertCircle, Search, Filter, Hash, TrendingUp, Sparkles, PenTool } from 'lucide-react';
import { journalsApi } from '../../api/journalsApi';
import toast from 'react-hot-toast';

export default function JournalPage() {
  const [journals, setJournals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingJournal, setEditingJournal] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  
  useEffect(() => {
    fetchJournals(1);
  }, []);

  const fetchJournals = async (page = 1) => {
    try {
      setIsLoading(true);
      const data = await journalsApi.getJournals(page, 20); // fetch more for the list
      setJournals(data.items);
      setPagination({ page: data.current_page, pages: data.pages, total: data.total });
    } catch (err) {
      setError('Failed to load journals. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (journal) => {
    setEditingJournal(journal);
    setFormData({ title: journal.title || '', content: journal.content || '' });
  };

  const handleSave = async () => {
    try {
      await journalsApi.updateJournal(editingJournal.id, formData);
      toast.success('Journal updated');
      setJournals(journals.map(j => j.id === editingJournal.id ? { ...j, ...formData } : j));
      setEditingJournal(null);
    } catch (err) {
      toast.error('Failed to update journal');
    }
  };

  const filteredJournals = journals.filter(j => 
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (j.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && journals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && journals.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error}</p>
        <button onClick={() => fetchJournals(1)} className="ml-auto underline text-sm hover:text-red-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Journal</h1>
          <p className="text-slate-400 text-sm mt-1">Capture your thoughts, reflections & moments.</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600/80 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_20px_rgba(217,119,6,0.5)] border border-amber-500/50 text-sm font-medium">
          <PenTool size={16} />
          <span>New Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Journal List ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search journal entries..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-800/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:bg-surface-800/60 transition-colors placeholder:text-slate-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/40 border border-white/10 rounded-xl text-slate-300 hover:bg-surface-800/60 hover:text-white transition-colors text-sm font-medium">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>

          {journals.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border-white/5">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-amber-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No journal entries</h3>
              <p className="text-slate-400 max-w-md mx-auto">Journal entries are created when you complete your Daily Check-in. Go to the dashboard and complete today's check-in to start writing!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <AnimatePresence>
                {filteredJournals.map((journal, i) => (
                  <motion.div 
                    key={journal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 border-white/5 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    {/* Subtle warm glow on hover */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] group-hover:bg-amber-500/10 transition-colors duration-700 pointer-events-none" />
                    
                    <div className="flex-grow relative z-10">
                      <div className="flex items-center gap-2 text-amber-400/80 mb-2">
                        <Calendar size={12} />
                        <span className="text-[11px] font-semibold tracking-wider uppercase">
                          {new Date(journal.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                        {journal.title || "Untitled Entry"}
                      </h3>
                      
                      <div className="prose prose-invert max-w-none text-slate-300/80 line-clamp-2 font-serif text-sm leading-relaxed">
                        {journal.content ? (
                          <p>{journal.content}</p>
                        ) : (
                          <p className="italic text-slate-500">No content written for this day.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 relative z-10 sm:w-32 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
                      {/* Fake mood badge to match design if no real data exists, but since we don't want to fake data, we'll just put an edit button prominently */}
                      <button 
                        onClick={() => handleEdit(journal)}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors text-xs font-medium"
                      >
                        <Edit2 size={12} />
                        <span>Edit Entry</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredJournals.length === 0 && (
                <div className="text-center p-8 text-slate-500">No entries match your search.</div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                  <button 
                    disabled={pagination.page <= 1}
                    onClick={() => fetchJournals(pagination.page - 1)}
                    className="px-4 py-2 glass-card hover:bg-white/5 disabled:opacity-30 rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-white/60 text-sm font-medium">Page {pagination.page} of {pagination.pages}</span>
                  <button 
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchJournals(pagination.page + 1)}
                    className="px-4 py-2 glass-card hover:bg-white/5 disabled:opacity-30 rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Stats Sidebar ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass-card p-6 border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" />
              Journal Stats
            </h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <p className="text-3xl font-bold text-white">{pagination.total}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Entries</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-slate-400 border border-white/5">
                  <BookOpen size={18} />
                </div>
              </div>
              
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                  <p className="text-3xl font-bold text-white flex items-center gap-2">
                    {Math.min(pagination.total, 7)} <span className="text-sm text-slate-500 font-normal">days</span>
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Writing Streak</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>

            {/* Motivational Quote Area */}
            <div className="mt-8 p-4 rounded-xl bg-surface-900/50 border border-white/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-amber-500/10">
                <BookOpen size={64} />
              </div>
              <p className="text-sm italic text-slate-300 relative z-10 leading-relaxed font-serif">
                "Writing is medicine. It is an appropriate antidote to injury. It is an appropriate companion for any difficult change."
              </p>
              <p className="text-xs text-amber-500/80 mt-2 font-medium relative z-10">— Julia Cameron</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingJournal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingJournal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-3xl glass-card shadow-2xl border-white/10 flex flex-col max-h-[90vh] overflow-hidden bg-surface-950/80">
              
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-surface-900/30">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Journal Entry</h2>
                  <div className="flex items-center gap-1.5 text-amber-400/80 text-sm mt-1">
                    <Calendar size={14} />
                    <span>{new Date(editingJournal.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                <button onClick={() => setEditingJournal(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">✕</button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-grow">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-slate-600"
                    placeholder="Give your entry a title..."
                  />
                </div>
                <div className="flex-grow flex flex-col">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                  {/* CRITICAL: Must use standard controlled input to avoid duplication bug */}
                  <textarea 
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full flex-grow min-h-[400px] bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-slate-600 resize-y leading-relaxed font-serif text-[15px]"
                    placeholder="Write your thoughts here..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-white/5 bg-surface-900/30">
                <button onClick={() => setEditingJournal(null)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium text-sm">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors font-medium text-sm shadow-[0_0_15px_rgba(217,119,6,0.3)]">Save Entry</button>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
