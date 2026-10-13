import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, TrendingUp, TrendingDown, Target, Activity, CheckCircle, RefreshCw, AlertCircle, BrainCircuit } from 'lucide-react';
import { aiApi } from '@api/aiApi';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import aiHelperImg from '../../assets/characters/ai_helper.jpg';

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const fetchAiData = async (range) => {
    setLoading(true);
    setError(false);
    try {
      const response = await aiApi.getOverview(range);
      setData(response.data);
    } catch (err) {
      console.error("Failed to load AI data:", err);
      toast.error("AI insights are temporarily unavailable. Your data is still safe.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData(timeRange);
  }, [timeRange]);

  const { insights: insightsData, recommendations: recsData } = data || {};
  const insights = insightsData?.insights || [];
  const recommendations = recsData?.recommendations || [];
  
  const isInsufficient = recommendations.length === 1 && recommendations[0].evidence?.trend === 'insufficient_data';

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* ─── Header & Actions ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
            <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 shrink-0" />
            <span>AI Growth Analyzer</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Personalized intelligence based on your habits and behavior.</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <div className="glass-card p-1 sm:p-1.5 flex items-center bg-black/40 rounded-xl overflow-hidden border border-white/5 shadow-inner shrink-0">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
                  timeRange === range 
                    ? 'bg-indigo-600/80 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-500/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {range === '7d' ? 'Week' : range === '30d' ? 'Month' : range === '90d' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Friendly Mascot Hero Card ────────────────────────────────────── */}
      <div className="bg-[#17132e] border border-[#2e2652] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-lg">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-purple-400/30 shadow-[0_0_20px_rgba(124,86,237,0.4)]">
          <img src={aiHelperImg} alt="AI Companion" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
            AI Wellness Companion
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white mt-1">
            "I'm here to analyze your patterns and help you grow!"
          </h2>
          <p className="text-xs text-[#a398c7] mt-0.5">
            Real-time personalized reflections based on your daily data.
          </p>
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center h-64 glass-card rounded-3xl border border-white/5">
          <div className="relative">
            <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full border-t-indigo-400 animate-spin -m-4"></div>
          </div>
          <p className="text-indigo-300 font-medium mt-8 tracking-widest uppercase text-xs">Analyzing Neural Patterns...</p>
        </div>
      )}

      {error && !data && (
        <div className="flex flex-col items-center justify-center h-64 glass-card rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white">Neural Link Severed</h2>
          <p className="text-slate-400 mt-2">The AI service is currently unresponsive. Please try again later.</p>
          <button onClick={() => fetchAiData(timeRange)} className="mt-6 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30">
            Re-establish Link
          </button>
        </div>
      )}

      {/* ─── Insufficient Data State ─────────────────────────────────────────── */}
      {!loading && data && isInsufficient ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 rounded-3xl border border-indigo-500/20 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative z-10">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 relative z-10">More Data Needed</h2>
          <p className="text-slate-300 max-w-lg mb-8 relative z-10 leading-relaxed">
            {recommendations[0]?.reason || insightsData?.summary || "Insufficient check-in history to generate personalized recommendations."}
          </p>
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 w-full max-w-md relative z-10">
            <h3 className="font-semibold text-indigo-400 mb-2 uppercase tracking-wider text-xs">Recommended Action</h3>
            <p className="text-sm text-slate-300">{recommendations[0]?.action || "Keep logging your daily check-ins so the system can identify reliable patterns."}</p>
          </div>
        </motion.div>
      ) : !loading && data ? (
        <>
          {/* ─── AI Summary & Encouragement ──────────────────────────────────────── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mobile-card rounded-2xl sm:rounded-3xl border border-indigo-500/30 p-4.5 sm:p-8 relative overflow-hidden group"
          >
            {/* Holographic background effect */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent group-hover:animate-[shimmer_3s_infinite] pointer-events-none rotate-12 transform-gpu" />
            
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 relative z-10">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-500/10 shrink-0 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 tracking-tight">Executive Summary</h2>
                <p className="text-slate-200 leading-relaxed mb-3 text-xs sm:text-[15px]">
                  {insightsData?.summary}
                </p>
                {insightsData?.encouragement && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-medium">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>{insightsData.encouragement}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Two-Column Layout for Desktop ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* ─── Insights Column ──────────────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Deep Insights
                </h2>
              </div>
              
              <div className="grid gap-4">
                {insights.map((insight, idx) => (
                  <motion.div 
                    key={`insight-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
                    
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <h3 className="font-bold text-white flex items-center gap-2 text-[15px]">
                        {insight.category === 'strength' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                        {insight.category === 'weakness' && <TrendingDown className="w-4 h-4 text-red-400" />}
                        {insight.category === 'trend' && <Activity className="w-4 h-4 text-cyan-400" />}
                        {insight.category === 'pattern' && <Target className="w-4 h-4 text-violet-400" />}
                        {insight.title}
                      </h3>
                      <span className={clsx(
                        "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shrink-0 ml-2",
                        insight.category === 'strength' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        insight.category === 'weakness' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        insight.category === 'pattern' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      )}>
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4 relative z-10">{insight.message}</p>
                    
                    {insight.evidence && (
                      <div className="pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-3 text-xs relative z-10 bg-black/20 -mx-6 -mb-6 p-4 rounded-b-2xl">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Metric</span>
                          <span className="text-indigo-300 font-medium capitalize">{insight.evidence.metric.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Value</span>
                          <span className="text-white font-bold">{insight.evidence.value}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Baseline</span>
                          <span className="text-slate-300">{insight.evidence.comparison}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {insights.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-400 bg-white/5">
                    No specific insights generated for this period.
                  </div>
                )}
              </div>
            </div>

            {/* ─── Recommendations Column ────────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Action Plan
                </h2>
              </div>
              
              <div className="grid gap-4">
                {recommendations.map((rec, idx) => (
                  <motion.div 
                    key={`rec-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.2 }}
                    className={clsx(
                      "glass-card p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                      rec.priority === 'high' ? 'border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                      rec.priority === 'medium' ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
                      'border-white/5 hover:border-white/20'
                    )}
                  >
                    <div className={clsx(
                      "absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-colors duration-500",
                      rec.priority === 'high' ? 'bg-amber-500/10' :
                      rec.priority === 'medium' ? 'bg-emerald-500/10' : 'bg-white/5'
                    )} />

                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <h3 className="font-bold text-white text-[15px]">
                        {rec.title}
                      </h3>
                      <span className={clsx(
                        "text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shrink-0 ml-2 border",
                        rec.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        rec.priority === 'medium' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-700 text-slate-300 border-slate-600'
                      )}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    
                    <div className="space-y-4 mt-4 relative z-10">
                      <p className="text-sm text-slate-300 leading-relaxed"><span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Context</span>{rec.reason}</p>
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-100 font-medium leading-relaxed">{rec.action}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {recommendations.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-400 bg-white/5">
                    No specific recommendations for this period.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
