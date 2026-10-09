import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '@components/dashboard/ChartCard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-modal !rounded-xl !bg-surface-850/90 !border-slate-700">
        <p className="text-sm font-semibold text-slate-100 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-medium text-slate-200">{Math.round(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LifeScoreChart({ data, timeRange }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Life Score Analytics" 
      subtitle={`Trend over the last ${timeRange}`} 
      delay={0.1}
      className="col-span-1 lg:col-span-2 min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
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
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey="movingAverage" 
            name="Moving Avg" 
            stroke="#a78bfa" 
            strokeDasharray="4 4"
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorMA)" 
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            name="Life Score" 
            stroke="#f43f5e" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
