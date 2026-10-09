import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
            <span className="font-medium text-slate-200">
              {entry.name === 'Duration' 
                ? `${entry.value} hrs` 
                : (entry.value != null ? `${Math.round(entry.value)}/10` : 'Not available')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SleepAnalytics({ data, timeRange }) {
  if (!data) return null;

  return (
    <ChartCard 
      title="Sleep Trends" 
      subtitle={`Average: ${data.averageSleep} hrs • Best: ${data.bestSleepDay}`} 
      delay={0.5}
      className="col-span-1 min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey={timeRange === '7d' ? 'day' : 'date'} 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 12]} />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide domain={[0, 10]} />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line yAxisId="left" type="monotone" dataKey="hours" name="Duration" stroke="#60a5fa" strokeWidth={3} dot={{ r: 3, fill: '#60a5fa' }} activeDot={{ r: 6 }} />
          <Line yAxisId="right" type="monotone" dataKey="quality" name="Quality Score" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
