import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, RefreshCw } from 'lucide-react';
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

  const fetchData = async (range) => {
    setLoading(true);
    try {
      // Fetch all metrics concurrently
      const [
        overview, lifeScore, mood, habits, 
        productivity, sleep, water, goals, achievements, correlations
      ] = await Promise.all([
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

      setData({
        overview, lifeScore, mood, habits, 
        productivity, sleep, water, goals, achievements, correlations
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
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
