import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reportsApi';
import PageSpinner from '../../components/ui/PageSpinner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, Star, TrendingUp, AlertCircle, 
  BookOpen, Brain, Activity, Clock, Calendar, Sparkles, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { SourceBadge } from '../../components/ui/SourceBadge';

const MonthlyReportPage = () => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [weeklyPeriod, setWeeklyPeriod] = useState('this_week'); // 'this_week', 'last_week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'weekly') {
        const data = await reportsApi.getWeeklyReport({ period: weeklyPeriod });
        setReportData(data);
      } else {
        const data = await reportsApi.getMonthlyReport(currentDate.getFullYear(), currentDate.getMonth() + 1);
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load your progress report. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [viewMode, weeklyPeriod, currentDate]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (newDate <= new Date()) {
      setCurrentDate(newDate);
    }
  };

  const isNextDisabled = () => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate > new Date();
  };

  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  if (loading && !reportData) return <PageSpinner />;

  const periodTitle = viewMode === 'weekly' 
    ? (weeklyPeriod === 'this_week' ? 'This Week Summary' : 'Last Week Summary')
    : `${formatMonthYear(currentDate)} Report`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER & SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
            Life Growth Report
          </h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">Verified progress analysis and data-driven personal reflection.</p>
        </div>
        
        {/* Toggle Mode & Period Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Mode Selector */}
          <div className="flex bg-surface-800/90 rounded-xl p-1 border border-white/5 text-xs">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'monthly' ? 'bg-primary-500 text-white shadow-glow-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'weekly' ? 'bg-primary-500 text-white shadow-glow-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Sub Controls */}
          {viewMode === 'weekly' ? (
            <div className="flex bg-surface-800/90 rounded-xl p-1 border border-white/5 text-xs">
              <button
                onClick={() => setWeeklyPeriod('this_week')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  weeklyPeriod === 'this_week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setWeeklyPeriod('last_week')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  weeklyPeriod === 'last_week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last Week
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 bg-surface-800/90 rounded-xl p-1 border border-white/5">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold min-w-[110px] text-center text-white">
                {formatMonthYear(currentDate)}
              </span>
              <button 
                onClick={handleNextMonth}
                disabled={isNextDisabled()}
                className={`p-1.5 rounded-lg transition-colors ${isNextDisabled() ? 'opacity-30 cursor-not-allowed text-gray-500' : 'hover:bg-white/10 text-gray-300'}`}
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center shadow-lg">
          <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      ) : reportData?.empty ? (
        <div className="bg-gray-900/40 border border-white/5 rounded-3xl p-16 text-center shadow-2xl backdrop-blur-sm">
          <Activity className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">No tracked records found for {periodTitle}</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Completing daily check-ins, tracking habits, and recording your reflections will automatically populate your growth report.
          </p>
          <button
            onClick={() => {
              setViewMode('weekly');
              setWeeklyPeriod('this_week');
            }}
            className="btn-primary text-xs px-4 py-2"
          >
            Check Recent Activity
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* AT A GLANCE METRICS */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-200 gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>{periodTitle} at a Glance</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <p className="text-indigo-200 text-2xs sm:text-xs font-semibold mb-1 uppercase tracking-wider">Avg Life Score</p>
                <div className="flex items-end space-x-1.5 sm:space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{reportData.metrics?.average_life_score ?? '-'}</span>
                  <span className="text-indigo-300 text-2xs sm:text-xs mb-1">/ 100</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <p className="text-emerald-200 text-2xs sm:text-xs font-semibold mb-1 uppercase tracking-wider">Avg Mood</p>
                <div className="flex items-end space-x-1.5 sm:space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{reportData.metrics?.average_mood ?? '-'}</span>
                  <span className="text-emerald-300 text-2xs sm:text-xs mb-1">/ 10</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <p className="text-amber-200 text-2xs sm:text-xs font-semibold mb-1 uppercase tracking-wider">Deep Work</p>
                <div className="flex items-end space-x-1.5 sm:space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {((reportData.metrics?.total_study_hours || 0) + (reportData.metrics?.total_work_hours || 0)).toFixed(1)}
                  </span>
                  <span className="text-amber-300 text-2xs sm:text-xs mb-1">hrs</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-md border border-blue-500/20 rounded-2xl p-3.5 sm:p-5 shadow-lg">
                <p className="text-blue-200 text-2xs sm:text-xs font-semibold mb-1 uppercase tracking-wider">Habit Consistency</p>
                <div className="flex items-end space-x-1.5 sm:space-x-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white">{reportData.metrics?.habit_completion_rate ?? 0}</span>
                  <span className="text-blue-300 text-2xs sm:text-xs mb-1">%</span>
                </div>
              </div>
              
            </div>
          </section>

          {/* NARRATIVE & REFLECTION */}
          {reportData.narrative && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-surface-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center text-white gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Growth Synthesis
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider border ${
                    reportData.ai_available
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {reportData.ai_available ? 'AI Narrative' : 'Verified Data Report'}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                  {reportData.narrative.answer?.monthly_overview || reportData.narrative.answer || "Your verified activity demonstrates steady consistency across your logged habits and check-ins."}
                </p>
                
                {reportData.narrative.answer?.reflection && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Key Reflection</h4>
                    <p className="text-slate-300 italic text-xs sm:text-sm leading-relaxed border-l-2 border-purple-500/50 pl-3 py-1 bg-white/5 rounded-r-lg">
                      "{reportData.narrative.answer.reflection}"
                    </p>
                  </div>
                )}
                
                {reportData.narrative.sources && reportData.narrative.sources.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sources Cited</h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.narrative.sources.map((src, i) => (
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
              </div>
              
              <div className="bg-surface-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center text-white gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Actionable Focus
                  </h3>
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-200 text-xs sm:text-sm font-medium leading-relaxed">
                      {reportData.narrative.answer?.next_month || "Sustain your current check-in momentum and dedicate 30+ minutes daily to primary goals."}
                    </p>
                  </div>
                </div>
                
                {reportData.challenges?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center text-slate-300 gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" /> Areas of Friction
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-400">
                      {reportData.challenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* HIGHLIGHTS */}
          {reportData.highlights?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-200 gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Milestones</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.highlights.map((highlight, idx) => (
                  <div key={idx} className="glass-card p-5 border border-white/10 hover:border-emerald-500/30 transition-all shadow-md">
                    <h3 className="text-sm font-bold text-white mb-1">{highlight.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PATTERNS & TRENDS CHARTS */}
          {(reportData.metrics?.mood_history?.length > 0 || reportData.metrics?.productivity_history?.length > 0) && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportData.metrics?.mood_history?.length > 0 && (
                <div className="glass-card p-6 border border-white/5">
                  <h3 className="text-sm font-semibold mb-4 text-gray-200">Mood Pattern</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.metrics.mood_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff40" tickFormatter={(val) => val.split('-').slice(1).join('/')} tick={{fontSize: 11}} />
                        <YAxis stroke="#ffffff40" domain={[0, 10]} tick={{fontSize: 11}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#moodGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {reportData.metrics?.productivity_history?.length > 0 && (
                <div className="glass-card p-6 border border-white/5">
                  <h3 className="text-sm font-semibold mb-4 text-gray-200">Deep Work (Study + Work Hours)</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.metrics.productivity_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff40" tickFormatter={(val) => val.split('-').slice(1).join('/')} tick={{fontSize: 11}} />
                        <YAxis stroke="#ffffff40" tick={{fontSize: 11}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#f59e0b' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#prodGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </div>
  );
};

export default MonthlyReportPage;
