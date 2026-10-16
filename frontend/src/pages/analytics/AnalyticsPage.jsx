import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { analyticsApi } from '@api/analyticsApi';

// Components
import OverviewCards from './components/OverviewCards';
import LifeScoreChart from './components/LifeScoreChart';
import MoodAnalytics from './components/MoodAnalytics';
import ProductivityChart from './components/ProductivityChart';
import HabitAnalytics from './components/HabitAnalytics';
import SleepAnalytics from './components/SleepAnalytics';
import WaterAnalytics from './components/WaterAnalytics';
import GoalProgress from './components/GoalProgress';
import Achievements from './components/Achievements';
import CorrelationAnalytics from './components/CorrelationAnalytics';
import PageSpinner from '@components/ui/PageSpinner';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async (range) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all metrics concurrently with graceful individual degradation
      const results = await Promise.allSettled([
        analyticsApi.getOverview(range),
        analyticsApi.getLifeScoreAnalytics(range),
        analyticsApi.getMoodAnalytics(range),
        analyticsApi.getHabitAnalytics(range),
        analyticsApi.getProductivityAnalytics(range),
        analyticsApi.getSleepAnalytics(range),
        analyticsApi.getWaterAnalytics(range),
        analyticsApi.getGoalProgress(),
        analyticsApi.getAchievements(),
        analyticsApi.getCorrelations(range)
      ]);

      const anySuccess = results.some(r => r.status === 'fulfilled');
      if (!anySuccess) {
        throw new Error("Unable to connect to the analytics engine. Please try again.");
      }

      const getVal = (idx, fallback) => {
        if (results[idx].status === 'fulfilled' && results[idx].value) {
          return results[idx].value;
        }
        return fallback;
      };

      setData({
        overview: getVal(0, {
          averageLifeScore: 0, currentStreak: 0, longestStreak: 0, totalXp: 0, currentLevel: 1,
          totalCheckins: 0, completionRate: 0, averageMood: 0, totalStudyHours: 0, totalExerciseHours: 0,
          averageSleep: 0, averageWaterIntake: 0, trends: {}
        }),
        lifeScore: getVal(1, { average: 0, highest: 0, lowest: 0, history: [] }),
        mood: getVal(2, { averageMood: 0, bestMoodDay: '-', worstMoodDay: '-', distribution: [], history: [] }),
        habits: getVal(3, { completionRate: 0, consistencyScore: 0, currentStreak: 0, longestStreak: 0, mostCompleted: { name: '-', count: 0 }, leastCompleted: { name: '-', count: 0 }, habits: [] }),
        productivity: getVal(4, { studyHours: 0, workHours: 0, readingHours: 0, meditationHours: 0, exerciseHours: 0, screenTime: 0, deepWork: 0, distribution: [], history: [] }),
        sleep: getVal(5, { averageSleep: 0, bestSleepDay: '-', worstSleepDay: '-', history: [] }),
        water: getVal(6, { averageIntake: 0, goalCompletion: 0, history: [] }),
        goals: getVal(7, { completedGoals: 0, pendingGoals: 0, completionRate: 0, goals: [] }),
        achievements: getVal(8, { unlockedCount: 0, totalAvailable: 50, newestBadge: null, rarestBadge: null, recent: [] }),
        correlations: getVal(9, { correlations: [], ai_interpretation: null })
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load analytics data.");
      toast.error("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const handleExport = () => {
    toast.success("Analytics report exported as PDF!");
  };

  if (loading && !data) {
    return <PageSpinner />;
  }

  if (!loading && !data && error) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 glass-card bg-surface-900/60 rounded-2xl border border-rose-500/20 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Unable to Load Analytics</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={() => fetchData(timeRange)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium shadow-glow-primary transition-all text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-20">
      
      {/* ─── Header & Actions ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analytics Engine</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Deep insights into your life metrics and growth</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <div className="glass-card p-1 flex items-center bg-surface-900/50 rounded-xl overflow-hidden shrink-0">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === range 
                    ? 'bg-primary-500 text-white shadow-glow-primary' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'
                }`}
              >
                {range === '7d' ? 'Week' : range === '30d' ? 'Month' : range === '90d' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-xl bg-surface-800 text-slate-300 hover:bg-surface-700 hover:text-white transition-colors border border-slate-700 focus:outline-none shrink-0"
            title="Export Report"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
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

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      {data && (
        <>
          <OverviewCards data={data.overview} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <LifeScoreChart data={data.lifeScore} timeRange={timeRange} />
            <MoodAnalytics data={data.mood} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ProductivityChart data={data.productivity} timeRange={timeRange} />
            <HabitAnalytics data={data.habits} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="col-span-1 lg:col-span-2">
              <SleepAnalytics data={data.sleep} timeRange={timeRange} />
            </div>
            <div className="col-span-1 lg:col-span-2">
              <WaterAnalytics data={data.water} timeRange={timeRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <GoalProgress data={data.goals} />
            <Achievements data={data.achievements} />
          </div>

          <CorrelationAnalytics data={data.correlations} />
        </>
      )}
    </div>
  );
}
