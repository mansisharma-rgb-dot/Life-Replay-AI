import React from 'react';
import { ChartCard } from '@components/dashboard/ChartCard';
import { CheckCircle2, Flame, Trophy } from 'lucide-react';

export default function HabitAnalytics({ data }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Habit Consistency" 
      subtitle={`Overall Completion: ${data.completionRate}%`} 
      delay={0.3}
      className="col-span-1 lg:col-span-1 min-h-[350px]"
    >
      <div className="flex flex-col h-full justify-between pb-2">
        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-surface-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-2xl font-bold text-slate-100">{data.currentStreak}</span>
            <span className="text-xs text-slate-400">Current Streak</span>
          </div>
          <div className="bg-surface-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center justify-center text-center">
            <Trophy className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-2xl font-bold text-slate-100">{data.longestStreak}</span>
            <span className="text-xs text-slate-400">Longest Streak</span>
          </div>
        </div>

        {/* Top Habits List */}
        <div className="space-y-3 mt-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Habit Completion</h4>
          
          {(data.habits || []).map((habit, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${habit.completion >= 80 ? 'text-emerald-400' : habit.completion >= 50 ? 'text-amber-400' : 'text-rose-400'}`} />
                  {habit.name}
                </span>
                <span className="font-medium text-slate-300">{habit.completion}%</span>
              </div>
              <div className="w-full bg-surface-800 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${habit.completion >= 80 ? 'bg-emerald-500' : habit.completion >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${habit.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
