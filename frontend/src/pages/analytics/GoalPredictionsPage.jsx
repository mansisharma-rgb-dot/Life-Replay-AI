import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Brain, Activity, Clock, ShieldAlert, Plus, X, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { goalsApi } from '@api/goalsApi';
import PageSpinner from '@components/ui/PageSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SourceBadge } from '../../components/ui/SourceBadge';

const PredictionCard = ({ prediction, onAdd, onDismiss }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { title, category, suggested_target, confidence, feasibility, reason, evidence } = prediction;

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await onAdd({
        title,
        category,
        target: 1, // Start with 1, user can edit later
        progress: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });
      toast.success("Goal added successfully!");
    } catch (err) {
      toast.error("Failed to add goal");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4 sm:p-6 rounded-2xl border border-surface-700 hover:border-violet-500/50 transition-colors relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -z-10 group-hover:bg-violet-600/20 transition-all" />
      
      <div className="flex justify-between items-start mb-4 gap-2">
        <div>
          <span className="text-2xs font-bold text-violet-400 uppercase tracking-widest mb-2 block">{category}</span>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
            <Target className="w-4 h-4" /> {suggested_target}
          </p>
        </div>
        
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 bg-surface-800/80 px-2 py-1 rounded-md border border-surface-700">
            <Activity className={`w-3.5 h-3.5 ${confidence > 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-xs font-bold text-white">{confidence}%</span>
          </div>
          <span className={`text-2xs mt-1 font-medium ${feasibility === 'High' ? 'text-emerald-400' : feasibility === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
            {feasibility}
          </span>
        </div>
      </div>

      <div className="bg-surface-900/50 p-3.5 sm:p-4 rounded-xl border border-surface-700/50 mb-5">
        <p className="text-xs sm:text-sm text-slate-300 italic">"{reason}"</p>
        
        <div className="mt-3 pt-3 border-t border-surface-700/50">
          <p className="text-2xs sm:text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Historical Evidence</p>
          <ul className="space-y-1.5">
            {evidence?.map((item, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={handleAdd}
          disabled={isAdding}
          className="flex-1 btn-primary min-h-[44px] flex items-center justify-center gap-2"
        >
          {isAdding ? <PageSpinner /> : (
            <>
              <Plus className="w-4 h-4" />
              Add to Goals
            </>
          )}
        </button>
        <button 
          onClick={() => onDismiss(prediction)}
          disabled={isAdding}
          className="w-11 h-11 rounded-xl bg-surface-800 text-slate-400 hover:text-white hover:bg-surface-700 transition-colors border border-surface-700 flex items-center justify-center shrink-0"
          title="Dismiss prediction"
          aria-label="Dismiss prediction"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default function GoalPredictionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await goalsApi.getGoalPredictions('30d');
      setData(response);
      setPredictions(response.predictions || []);
    } catch (err) {
      toast.error("Failed to load goal predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddGoal = async (goalData) => {
    await goalsApi.createGoal(goalData);
    // Remove from UI after adding
    setPredictions(prev => prev.filter(p => p.title !== goalData.title));
  };

  const handleDismiss = (prediction) => {
    setPredictions(prev => prev.filter(p => p.title !== prediction.title));
  };

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary-400 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-violet-400" />
            AI Future Goal Prediction
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Discover realistic next goals based on your growth patterns.</p>
        </div>
      </div>

      {(!data?.data_sufficiency) ? (
        <div className="glass-card flex flex-col items-center justify-center text-center py-24 rounded-2xl border-dashed border-surface-600 mt-8">
          <div className="w-20 h-20 bg-surface-800 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Not enough history yet</h3>
          <p className="text-slate-400 max-w-md mx-auto text-base">
            {data?.message || "Complete more check-ins, goals and habits to unlock personalized future goal predictions."}
          </p>
          <button onClick={() => navigate('/checkin')} className="btn-primary mt-8 flex items-center gap-2">
            Complete Daily Check-in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-surface-700 bg-surface-900/40">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <Clock className="w-5 h-5 text-primary-400" />
                <h4 className="font-semibold uppercase tracking-wider text-xs">Data History</h4>
              </div>
              <p className="text-2xl font-bold text-white">{data.metrics?.days_active || 0} Days</p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl border border-surface-700 bg-surface-900/40">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <Brain className="w-5 h-5 text-violet-400" />
                <h4 className="font-semibold uppercase tracking-wider text-xs">AI Confidence Base</h4>
              </div>
              <p className="text-2xl font-bold text-white">{data.metrics?.habit_consistency || 0}% Cons.</p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl border border-surface-700 bg-surface-900/40">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold uppercase tracking-wider text-xs">Growth Trend</h4>
              </div>
              <p className="text-2xl font-bold text-white">{data.metrics?.strongest_category || 'General'}</p>
            </div>
          </div>

          <div className="space-y-6 mt-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-400" />
              AI Recommended Goals
            </h2>
            
            {data.sources && data.sources.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sources Cited</h4>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((src, i) => (
                    <SourceBadge
                      key={i}
                      type={src.type}
                      id={src.id}
                      label={src.label || src.title}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {predictions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-12 text-slate-400"
                  >
                    <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-lg">You've handled all predictions for now!</p>
                  </motion.div>
                ) : (
                  predictions.map((pred, idx) => (
                    <PredictionCard 
                      key={pred.title + idx} 
                      prediction={pred} 
                      onAdd={handleAddGoal} 
                      onDismiss={handleDismiss} 
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
