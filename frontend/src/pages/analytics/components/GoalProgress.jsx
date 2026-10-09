import React from 'react';
import { ChartCard } from '@components/dashboard/ChartCard';
import { Target, CheckCircle } from 'lucide-react';

export default function GoalProgress({ data }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Goal Progress" 
      subtitle={`Completed ${data.completedGoals} goals • ${data.completionRate}% success`} 
      delay={0.7}
      className="col-span-1 lg:col-span-1 min-h-[350px]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
          {data.goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            return (
              <div key={goal.id} className="bg-surface-800/40 p-3 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium text-slate-200">{goal.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-surface-900 px-2 py-0.5 rounded-md border border-slate-700">
                    {goal.category}
                  </span>
                </div>
                
                <div className="flex justify-between items-end mb-1.5 mt-3">
                  <span className="text-xs text-slate-500 font-medium">{goal.progress} / {goal.target}</span>
                  <span className="text-xs font-bold text-slate-300">{percentage}%</span>
                </div>
                
                <div className="w-full bg-surface-900 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-primary-500 transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
