import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '@components/dashboard/ChartCard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-modal !rounded-xl !bg-surface-850/90 !border-slate-700">
        <p className="text-sm font-semibold text-slate-100 mb-1">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
          <span className="text-slate-400">Intake:</span>
          <span className="font-medium text-slate-200">{payload[0].value} L</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function WaterAnalytics({ data, timeRange }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Hydration History" 
      subtitle={`Avg Intake: ${data.averageIntake}L • Goal met: ${data.goalCompletion}%`} 
      delay={0.6}
      className="col-span-1 min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey={timeRange === '7d' ? 'day' : 'date'} 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 4]} />
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="step" 
            dataKey="liters" 
            name="Intake" 
            stroke="#38bdf8" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorWater)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
