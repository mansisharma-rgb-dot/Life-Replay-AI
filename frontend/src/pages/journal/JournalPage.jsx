import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MoreVertical, Heart, Sparkles, BookOpen, 
  Calendar, Edit2, Search, CheckCircle2 
} from 'lucide-react';
import { journalsApi } from '../../api/journalsApi';
import { checkinApi } from '../../api/checkinApi';
import toast from 'react-hot-toast';

import gratitudeReadingImg from '../../assets/characters/gratitude_reading.jpg';
import affirmationHeartImg from '../../assets/characters/affirmation_heart.jpg';

export default function JournalPage() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [gratitudeText, setGratitudeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit existing journal modal state
  const [editingJournal, setEditingJournal] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setIsLoading(true);
      const data = await journalsApi.getJournals(1, 20);
      setJournals(data.items || []);
    } catch {
      // Keep empty array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGratitude = async () => {
    if (!gratitudeText.trim()) {
      toast.error('Please write what you are grateful for');
      return;
    }

    setIsSaving(true);
    try {
      await checkinApi.upsertCheckin({
        reflection_text: gratitudeText.trim()
      });
      toast.success('Gratitude reflection saved! ✨');
      setGratitudeText('');
      fetchJournals();
    } catch (err) {
      toast.error('Failed to save reflection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await journalsApi.updateJournal(editingJournal.id, editFormData);
      toast.success('Journal entry updated');
      setJournals(journals.map(j => j.id === editingJournal.id ? { ...j, ...editFormData } : j));
      setEditingJournal(null);
    } catch {
      toast.error('Failed to update journal');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-8 animate-fade-in">
      
      {/* ── Top Header matching Reference Image 2 (right screen) ─────────── */}
      <div className="flex items-center justify-between pt-1">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white font-semibold text-sm hover:text-violet-300 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#1b1636] border border-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </div>
          <span>Gratitude Practice</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-[#1b1636] border border-white/10 flex items-center justify-center text-slate-300">
          <MoreVertical className="w-4 h-4" />
        </div>
      </div>

      {/* ── Positive Affirmations Banner Card matching Reference Image 1 (Screen 3) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#3b2d69] shadow-xl group"
      >
        <div className="h-44 sm:h-48 w-full relative overflow-hidden">
          <img src={gratitudeReadingImg} alt="Positive Affirmations" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14102a] via-[#14102a]/60 to-transparent flex flex-col justify-end p-5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
              Positive Affirmations
            </h2>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Build a grateful mindset
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── "Today's Affirmation" Card matching Reference Image 1 (Screen 3) ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-center space-y-3.5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a398c7]">
          Today's Affirmation
        </h3>

        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-[0_0_24px_rgba(244,63,94,0.35)] border border-pink-500/30">
          <img src={affirmationHeartImg} alt="Affirmation Heart" className="w-full h-full object-cover" />
        </div>

        <p className="text-sm sm:text-base font-semibold text-white italic max-w-sm mx-auto leading-relaxed">
          "I am worthy of all the good things that come to me today."
        </p>
      </motion.div>

      {/* ── "What are you grateful for today?" Input Card ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-3"
      >
        <label className="block text-xs font-semibold text-white">
          What are you grateful for today?
        </label>

        <textarea
          rows={4}
          value={gratitudeText}
          onChange={(e) => setGratitudeText(e.target.value)}
          placeholder="Tap to write your thoughts..."
          className="w-full bg-[#1e1938] border border-[#34295e] rounded-2xl p-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#7c56ed] resize-none transition-colors"
        />

        <button
          onClick={handleSaveGratitude}
          disabled={isSaving}
          className="w-full py-3.5 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-[0_4px_20px_rgba(108,82,212,0.4)] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #6c52d4 0%, #7c56ed 50%, #8c62f5 100%)',
          }}
        >
          {isSaving ? 'Saving...' : 'Save now'}
        </button>
      </motion.div>

      {/* ── Reflection & Journal History ──────────────────────────────────── */}
      {journals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 pt-2"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#a398c7]" />
              Saved Reflections
            </h3>
            <span className="text-xs text-[#a398c7]">{journals.length} entries</span>
          </div>

          <div className="space-y-2.5">
            {journals.map((journal) => (
              <div 
                key={journal.id} 
                className="bg-[#17132e] border border-[#2e2652] rounded-2xl p-4 flex items-start justify-between gap-3 shadow-md"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-[#a398c7]">
                    <Calendar className="w-3.5 h-3.5 text-[#7c56ed]" />
                    <span>
                      {(() => {
                        const raw = journal.created_at || journal.date;
                        if (!raw) return 'Recent reflection';
                        const d = new Date(raw);
                        return isNaN(d.getTime()) ? 'Recent reflection' : d.toLocaleDateString();
                      })()}
                    </span>
                  </div>
                  {journal.title && (
                    <h4 className="text-sm font-bold text-white truncate">{journal.title}</h4>
                  )}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {journal.content}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingJournal(journal);
                    setEditFormData({ title: journal.title || '', content: journal.content || '' });
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors shrink-0"
                  aria-label="Edit entry"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Entry Modal */}
      <AnimatePresence>
        {editingJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#17132e] border border-[#3b2d69] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white">Edit Reflection</h3>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Title (optional)"
                className="w-full bg-[#1e1938] border border-[#34295e] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#7c56ed]"
              />
              <textarea
                rows={5}
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="w-full bg-[#1e1938] border border-[#34295e] rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#7c56ed] resize-none"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setEditingJournal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#6c52d4] hover:bg-[#7c56ed] shadow-md"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
