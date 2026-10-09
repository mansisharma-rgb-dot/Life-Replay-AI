import React from 'react';
import { Network, Brain, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CorrelationCard = ({ metric1, metric2, correlation, insight, sampleSize, status }) => {
  if (status === 'insufficient_data' || sampleSize < 5) {
    return (
      <div className="glass-card p-6 rounded-2xl border border-surface-700 opacity-60">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
            {metric1} ↔ {metric2}
          </h4>
          <AlertCircle className="w-5 h-5 text-slate-500" />
        </div>
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm font-medium">Insufficient Data</p>
          <p className="text-slate-500 text-xs mt-1">Need at least 5 logged days</p>
        </div>
      </div>
    );
  }

  // Determine strength label & color
  let strengthLabel = "Weak/None";
  let colorClass = "text-slate-400";
  let bgClass = "bg-slate-500/10";
  let borderClass = "border-slate-500/20";
  
  const absR = Math.abs(correlation);
  if (absR > 0.6) {
    strengthLabel = correlation > 0 ? "Strong Positive" : "Strong Negative";
    colorClass = correlation > 0 ? "text-emerald-400" : "text-rose-400";
    bgClass = correlation > 0 ? "bg-emerald-500/10" : "bg-rose-500/10";
    borderClass = correlation > 0 ? "border-emerald-500/20" : "border-rose-500/20";
  } else if (absR > 0.3) {
    strengthLabel = correlation > 0 ? "Moderate Positive" : "Moderate Negative";
    colorClass = correlation > 0 ? "text-emerald-300" : "text-rose-300";
    bgClass = correlation > 0 ? "bg-emerald-500/5" : "bg-rose-500/5";
    borderClass = correlation > 0 ? "border-emerald-500/10" : "border-rose-500/10";
  }

  const sign = correlation > 0 ? "+" : "";

  return (
    <div className={`glass-card p-6 rounded-2xl border ${borderClass} transition-colors hover:bg-surface-800/80`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-1">
            {metric1} ↔ {metric2}
          </h4>
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${bgClass} ${colorClass}`}>
            {strengthLabel}
          </span>
        </div>
        <div className={`text-2xl font-black tracking-tighter ${colorClass}`}>
          {sign}{correlation.toFixed(2)}
        </div>
      </div>
      
      <p className="text-slate-300 text-sm font-medium leading-relaxed mb-4">
        {insight}
      </p>
      
      <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-surface-700">
        <span>{sampleSize} observations</span>
      </div>
    </div>
  );
};

export default function CorrelationAnalytics({ data }) {
  if (!data) return null;
  
  const { correlations, ai_interpretation } = data;
  if (!correlations || correlations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Network className="w-6 h-6 text-violet-400" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Life Correlations</h2>
      </div>

      {ai_interpretation && (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-violet-900/20 to-primary-900/20 border border-violet-500/20 mb-8">
          <div className="flex items-center gap-2 mb-3 text-violet-300 font-semibold text-sm uppercase tracking-wider">
            <Brain className="w-5 h-5" />
            AI Interpretation
          </div>
          <p className="text-slate-200 leading-relaxed">
            {ai_interpretation}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {correlations.map((corr) => (
          <CorrelationCard key={corr.id} {...corr} />
        ))}
      </div>
    </div>
  );
}
