import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, RefreshCw, AlertCircle, Brain, Target, Activity, FileText, Plus } from 'lucide-react';
import { analyticsApi } from '@api/analyticsApi';
import PageSpinner from '@components/ui/PageSpinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import toast from 'react-hot-toast';

// ─── Formatting Helpers ────────────────────────────────────────────────────────
const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const dateOnly = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Stat Card Component ───────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass }) => (
  <div className={`glass-card p-3.5 sm:p-6 rounded-2xl border border-surface-700 relative overflow-hidden group`}>
    <div className={`absolute -right-4 -top-4 w-20 sm:w-24 h-20 sm:h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-30 ${gradientClass}`} />
    
    <div className="flex items-start justify-between relative z-10 gap-2">
      <div>
        <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase mb-1 line-clamp-1">{title}</p>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-xl sm:text-3xl font-black text-white tracking-tight">{value}</span>
        </div>
      </div>
      <div className={`p-2 sm:p-3 rounded-xl bg-surface-800/50 border border-surface-700 shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2.5} />
      </div>
    </div>
  </div>
);

export default function TimeAnalysisPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = async (range) => {
    setLoading(true);
    try {
      const response = await analyticsApi.getTimeAnalysis(range);
      setData(response);
    } catch (error) {
      console.error("Failed to load time analysis:", error);
      toast.error("Failed to load time analysis data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  if (loading && !data) return <PageSpinner />;

  const isEmpty = !data || !data.daily || data.daily.length === 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* ─── Header & Actions ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Time & Productivity Analysis</h1>
          <p className="text-slate-400 mt-1">Understand where your tracked time goes and discover productivity patterns.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="glass-card p-1 flex items-center bg-surface-900/50 rounded-xl overflow-hidden border border-white/5">
            {[
              { id: '7d', label: 'Week' },
              { id: '14d', label: '2 Weeks' },
              { id: '30d', label: 'Month' },
              { id: '90d', label: 'Quarter' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTimeRange(id)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                  timeRange === id 
                    ? 'bg-primary-500 text-white shadow-glow-primary font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Link
            to="/reports/monthly"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-violet-300 border border-violet-500/30 bg-violet-500/15 hover:bg-violet-500/25 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-105 transition-all duration-200"
          >
            <FileText className="w-4 h-4" />
            + Full Report
          </Link>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Crunching your data...</p>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="glass-card flex flex-col items-center justify-center text-center py-20 rounded-2xl border-dashed border-surface-600 mt-8">
          <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Not enough tracked data yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            Complete more daily check-ins to discover your productivity patterns.
          </p>
        </div>
      ) : (
        <>
          {/* ─── AI Insight ────────────────────────────────────────────────────── */}
          {data.ai_insight && (
            <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-violet-900/20 to-primary-900/20 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-3 text-violet-300 font-semibold text-sm uppercase tracking-wider">
                <Brain className="w-5 h-5" />
                AI Productivity Coach
              </div>
              <p className="text-slate-200 leading-relaxed text-sm md:text-base">
                {data.ai_insight}
              </p>
            </div>
          )}

          {/* ─── Summary Cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <StatCard 
              title="Productivity Score" 
              value={`${data.summary.averageProductivityScore}/100`} 
              icon={Activity} 
              colorClass="text-emerald-400" 
              gradientClass="bg-emerald-500" 
            />
            <StatCard 
              title="Tracked Productive Time" 
              value={`${data.summary.productiveHoursTotal}h`} 
              icon={Target} 
              colorClass="text-violet-400" 
              gradientClass="bg-violet-500" 
            />
            <StatCard 
              title="Average Focus" 
              value={`${data.summary.averageFocus}/5`} 
              icon={Brain} 
              colorClass="text-blue-400" 
              gradientClass="bg-blue-500" 
            />
            <StatCard 
              title="Low-Productivity Days" 
              value={data.summary.lowProductivityDays} 
              icon={Clock} 
              colorClass="text-amber-400" 
              gradientClass="bg-amber-500" 
            />
          </div>

          {/* ─── Trends Chart ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-surface-700">
              <h3 className="text-lg font-bold text-white mb-6">Productivity Trend</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDateStr} 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={[0, 100]}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 'bold', marginBottom: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '14px' }}
                      labelFormatter={formatDateStr}
                    />
                    <Area type="monotone" name="Productivity Score" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── Time Distribution & Patterns ────────────────────────────────── */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-surface-700">
                <h3 className="text-lg font-bold text-white mb-4">Time Distribution</h3>
                <div className="space-y-4">
                  {data.distributions?.map((dist, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 font-medium">{dist.name}</span>
                        <span className="text-slate-400">{dist.value}h</span>
                      </div>
                      <div className="w-full bg-surface-800 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((dist.value / data.summary.productiveHoursTotal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!data.distributions || data.distributions.length === 0) && (
                    <p className="text-slate-500 text-sm text-center">No time distribution data available.</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-surface-700">
                <h3 className="text-lg font-bold text-white mb-4">Time-Loss Patterns</h3>
                <div className="space-y-3">
                  {data.patterns?.map((pattern, idx) => (
                    <div key={idx} className="p-3 bg-surface-800/50 border border-surface-700 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300">{pattern}</p>
                    </div>
                  ))}
                  {(!data.patterns || data.patterns.length === 0) && (
                    <p className="text-slate-500 text-sm text-center">No distinct time-loss patterns detected yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
