import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api/aiApi';

export default function AIInsightsCard({ delay = 0 }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi.getOverview('30d')
      .then(res => {
        const insightsArray = res.data?.insights?.insights || [];
        const patterns = insightsArray.filter(i => i.category === 'pattern');
        const selected = patterns[0] || insightsArray[0];
        if (selected) {
          setInsight({
            metric: selected.title,
            description: selected.message,
            category: selected.category || 'pattern'
          });
        } else if (res.data?.insights?.summary && !res.data?.insights?.summary.includes("More check-ins are needed")) {
          setInsight({
            metric: "Growth Summary",
            description: res.data?.insights?.summary,
            category: "summary"
          });
        }
      })
      .catch(err => console.error("Failed to fetch AI insights for dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-2xl p-5 flex flex-col h-full"
      style={{
        background: 'rgba(9,14,26,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">AI Highlight</h3>
        </div>
        <Link
          to="/reports/monthly"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-all duration-200"
        >
          <Plus className="w-3 h-3" />
          Full Report
        </Link>
      </div>

      {/* Insight card */}
      <div className="flex flex-col gap-3 flex-1 justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-500 h-full">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-violet-500/50" />
            <p className="text-xs">Analyzing patterns...</p>
          </div>
        ) : insight ? (
          <div
            className="rounded-xl p-4 flex flex-col gap-3 group hover:border-white/10 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 bg-violet-500/20 border-violet-500/30">
                <Sparkles className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{insight.metric || "Key Pattern"}</p>
                <p className="text-[10px] text-violet-400 font-medium uppercase tracking-wider">Verified Correlation</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1">
              {insight.description}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full px-4 text-slate-500">
            <p className="text-sm font-medium text-slate-400 mb-1">More data needed</p>
            <p className="text-xs">Keep checking in to uncover hidden correlations in your lifestyle.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
