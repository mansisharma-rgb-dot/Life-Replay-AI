import React from 'react';
import { ChartCard } from '@components/dashboard/ChartCard';
import { Award, Medal, Trophy } from 'lucide-react';

export default function Achievements({ data }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Achievements" 
      subtitle={`${data.unlockedCount} / ${data.totalAvailable} unlocked`} 
      delay={0.8}
      className="col-span-1 lg:col-span-1 min-h-[350px]"
    >
      <div className="flex flex-col h-full gap-4">
        {/* Highlighted Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-800/40 border border-amber-500/30 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">{data.rarestBadge ? data.rarestBadge.icon : '💎'}</span>
            <span className="text-xs font-bold text-amber-400">Rarest Badge</span>
            <span className="text-sm font-semibold text-slate-200 mt-1">{data.rarestBadge ? data.rarestBadge.name : '—'}</span>
          </div>
          <div className="bg-surface-800/40 border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center text-center">
            <span className="text-2xl mb-1">{data.newestBadge ? data.newestBadge.icon : '🏆'}</span>
            <span className="text-xs font-bold text-emerald-400">Newest Badge</span>
            <span className="text-sm font-semibold text-slate-200 mt-1">{data.newestBadge ? data.newestBadge.name : '—'}</span>
          </div>
        </div>

        {/* Recent Timeline */}
        <div className="flex-1 mt-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Unlocks</h4>
          <div className="space-y-3">
            {data.recent.map((badge, idx) => (
              <div key={badge.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-800 border border-slate-700 flex items-center justify-center text-lg">
                  {badge.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{badge.name}</p>
                  <p className="text-xs text-slate-500">Unlocked on {new Date(badge.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
