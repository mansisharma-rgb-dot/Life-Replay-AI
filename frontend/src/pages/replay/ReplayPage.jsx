import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, Send, FileText, BookOpen, Target, Flame, BrainCircuit, RefreshCw, AlertCircle, Calendar, Trophy, X, ArrowRight, BarChart } from 'lucide-react';
import { SourceBadge } from '../../components/ui/SourceBadge';
import { aiApi } from '@api/aiApi';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import aiHelperImg from '../../assets/characters/ai_helper.jpg';

const ReplayLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
        className="w-16 h-16 rounded-full border-2 border-primary-500/30 border-t-primary-500 flex items-center justify-center bg-primary-900/10"
      >
        <Sparkles className="w-6 h-6 text-primary-400" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-100">Searching Your Memories...</h3>
        <p className="text-sm text-primary-400 font-medium">Retrieving documents, journals, and life events.</p>
      </div>
    </div>
  );
};

const SourceIcon = ({ type }) => {
  switch (type) {
    case 'Document': return <FileText className="w-4 h-4" />;
    case 'Journal': return <BookOpen className="w-4 h-4" />;
    case 'Goal': return <Target className="w-4 h-4" />;
    case 'Habit': return <Flame className="w-4 h-4" />;
    case 'Achievement': return <Trophy className="w-4 h-4" />;
    case 'Timeline': return <Calendar className="w-4 h-4" />;
    case 'Skill': return <BrainCircuit className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const MemoryDetailModal = ({ memory, onClose, onRelatedClick, allMemories }) => {
  if (!memory) return null;

  // Find 2 related memories from same category or date
  const related = allMemories
    .filter(m => m !== memory && (m.type === memory.type || (m.date && memory.date && m.date === memory.date)))
    .slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface-900/90 border border-surface-600 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-800/50">
            <div className="flex items-center gap-2 text-primary-400 font-semibold uppercase tracking-wider text-sm">
              <SourceIcon type={memory.type} />
              {memory.type}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-white mb-2">{memory.title || memory.name}</h2>
            {memory.date && <div className="text-sm text-slate-400 mb-6">{new Date(memory.date).toLocaleDateString()}</div>}
            
            <div className="prose prose-invert prose-sm">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {memory.content || memory.summary || memory.description || 
                 (memory.type === 'Timeline' ? `Mood Score: ${memory.mood_score || 'N/A'}\nWork: ${memory.work_hours}h\nStudy: ${memory.study_hours}h` : '') ||
                 'No detailed content available.'}
              </p>
            </div>
            
            {memory.key_topics && (
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {memory.key_topics.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-800 rounded text-xs text-slate-300">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {related.length > 0 && (
            <div className="p-4 border-t border-surface-700 bg-surface-800/30">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Related Memories</h4>
              <div className="space-y-2">
                {related.map((rel, i) => (
                  <div 
                    key={i} 
                    onClick={() => onRelatedClick(rel)}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-800/80 border border-surface-600 cursor-pointer hover:border-primary-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <SourceIcon type={rel.type} />
                      <span className="text-sm font-medium text-slate-300 truncate">{rel.title || rel.name}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ReplayPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedMemory, setSelectedMemory] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(false);
    setHasSearched(true);
    setData(null);

    try {
      const response = await aiApi.getReplay(query);
      setData(response.data);
    } catch (err) {
      console.error("Failed to load Life Replay:", err);
      toast.error("Life Replay AI is temporarily unavailable.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  let allMemories = [];
  let groupedMemories = {};
  
  if (data?.context) {
    const keys = ['documents', 'journals', 'goals', 'skills', 'achievements', 'habits', 'timeline'];
    keys.forEach(key => {
      if (data.context[key] && data.context[key].length > 0) {
        groupedMemories[key] = data.context[key];
        allMemories = [...allMemories, ...data.context[key]];
      }
    });
  }

  const comparisonStats = data?.context?.comparison_stats;

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-10 pb-28">
      
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center animate-fade-in relative z-10 space-y-3 pt-2 sm:pt-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-purple-400/40 shadow-[0_0_24px_rgba(124,86,237,0.45)]">
          <img src={aiHelperImg} alt="AI Replay Companion" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            AI Life Replay
          </h1>
          <p className="text-[#a398c7] mt-1.5 sm:mt-2 text-xs sm:text-base max-w-xl mx-auto">
            Search your memories. Revisit your journey with your AI companion.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-4 sm:mt-6 relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to remember?"
            className="w-full bg-[#17132e] border border-[#2e2652] rounded-2xl py-3.5 pl-4 sm:pl-6 pr-14 text-white text-sm sm:text-base focus:border-[#7c56ed] focus:ring-1 focus:ring-[#7c56ed] transition-all placeholder-slate-400 shadow-xl"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-tr from-[#6c52d4] to-[#8c62f5] disabled:opacity-40 text-white rounded-xl transition-all shadow-md active:scale-95 touch-target tap-press"
            aria-label="Search memories"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
        
        {!hasSearched && (
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 opacity-90">
            <button onClick={() => setQuery("What was I focused on last month?")} className="px-3 py-1.5 text-[11px] sm:text-xs bg-surface-800 text-slate-300 rounded-full hover:bg-surface-700 active:scale-95 transition-all">"What was I focused on last month?"</button>
            <button onClick={() => setQuery("What happened during July?")} className="px-3 py-1.5 text-[11px] sm:text-xs bg-surface-800 text-slate-300 rounded-full hover:bg-surface-700 active:scale-95 transition-all">"What happened during July?"</button>
            <button onClick={() => setQuery("What goals was I working toward?")} className="px-3 py-1.5 text-[11px] sm:text-xs bg-surface-800 text-slate-300 rounded-full hover:bg-surface-700 active:scale-95 transition-all">"What goals was I working toward?"</button>
          </div>
        )}
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ReplayLoader />
          </motion.div>
        )}

        {error && !data && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-100">Search Failed</h2>
            <p className="text-slate-400 mt-2 mb-6">We couldn't connect to the AI service.</p>
            <button onClick={handleSearch} className="px-6 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}

        {data && !loading && (
          <motion.div 
            key="content"
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            {/* AI Response Narrative */}
            <motion.section variants={itemVars} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-primary-600/10 rounded-3xl blur-xl transition-all group-hover:blur-2xl"></div>
              <div className="relative glass-card p-8 sm:p-10 rounded-3xl shadow-glow-primary overflow-hidden border-primary-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-primary-400" />
                  <h2 className="text-xl font-bold text-white">AI Synthesis</h2>
                </div>
                
                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                    {data.answer || "I couldn't find enough information to answer that."}
                  </p>
                </div>
                
                {/* Citations/Sources from AI */}
                {data.sources && data.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sources Cited</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.sources.map((src, i) => {
                        const matchingMem = allMemories.find(m => m.id === src.id && m.type === src.type);
                        return (
                          <SourceBadge
                            key={i}
                            type={src.type}
                            id={src.id}
                            label={src.label || src.title}
                            onClick={matchingMem ? () => setSelectedMemory(matchingMem) : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Comparison Stats */}
            {comparisonStats && (
              <motion.section variants={itemVars} className="glass-card p-6 rounded-2xl flex flex-wrap gap-6 items-center border border-primary-500/20">
                <div className="flex items-center gap-3 mr-auto">
                  <div className="p-2 bg-primary-900/50 rounded-lg"><BarChart className="w-5 h-5 text-primary-400" /></div>
                  <div>
                    <h3 className="font-bold text-white">Comparison Stats</h3>
                    <p className="text-xs text-slate-400">Extracted from timeline</p>
                  </div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-white">{comparisonStats.timeline_average_mood_score || '-'}</div>
                  <div className="text-xs text-slate-400">Avg Mood</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-white">{comparisonStats.total_timeline_events}</div>
                  <div className="text-xs text-slate-400">Check-ins</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-white">{comparisonStats.total_goals}</div>
                  <div className="text-xs text-slate-400">Goals</div>
                </div>
              </motion.section>
            )}

            {/* Grouped Memories */}
            {allMemories.length === 0 ? (
              <motion.div variants={itemVars} className="glass-card p-12 text-center text-slate-400 border-dashed rounded-3xl">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No memories matched this search.</h3>
                <p className="text-sm">Try another keyword, upload a document, or write a journal entry.</p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedMemories).map(([groupKey, memories]) => (
                  <motion.section key={groupKey} variants={itemVars} className="space-y-4">
                    <div className="flex items-center gap-2 px-2 border-b border-surface-700 pb-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        {groupKey} <span className="text-slate-600 ml-1">({memories.length})</span>
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {memories.map((mem, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedMemory(mem)}
                          className="glass-card p-4 rounded-xl border border-surface-700 hover:border-primary-500/50 hover:bg-surface-800/80 transition-all cursor-pointer flex flex-col h-full group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
                              <SourceIcon type={mem.type} />
                              {mem.type}
                            </div>
                            {mem.date && <span className="text-xs text-slate-500">{new Date(mem.date).toLocaleDateString()}</span>}
                          </div>
                          
                          <h4 className="text-slate-200 font-medium mb-1 line-clamp-1 group-hover:text-primary-300 transition-colors">
                            {mem.title || mem.name}
                          </h4>
                          <p className="text-slate-400 text-sm line-clamp-2 mt-auto">
                            {mem.summary || mem.content || mem.description || mem.category || (mem.type === 'Timeline' ? `Mood: ${mem.mood_score || '-'}` : 'Memory record')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MemoryDetailModal 
        memory={selectedMemory} 
        allMemories={allMemories}
        onClose={() => setSelectedMemory(null)}
        onRelatedClick={(m) => setSelectedMemory(m)}
      />
    </div>
  );
}
