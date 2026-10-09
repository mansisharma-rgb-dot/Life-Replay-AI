import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from '@components/dashboard/ChartCard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-modal !rounded-xl !bg-surface-850/90 !border-slate-700">
        <p className="text-sm font-semibold text-slate-100 mb-2">{label}</p>
        {payload.filter(entry => entry.value != null).map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-medium text-slate-200">{entry.value} {entry.name === 'Tasks' ? '' : 'hrs'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const formatDateTick = (val) => {
  if (!val) return '';
  if (val.length <= 4) return val;
  const parts = val.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return val;
};

export default function ProductivityChart({ data, timeRange }) {
  if (!data) return null;

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const avgDeepWork = data.deepWork ? Math.round((data.deepWork / days) * 10) / 10 : 0;

  return (
    <ChartCard 
      title="Productivity & Focus" 
      subtitle={`Avg Deep Work: ${avgDeepWork} hrs/day`} 
      delay={0.4}
      className="col-span-1 lg:col-span-2 min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey={timeRange === '7d' ? 'day' : 'date'} 
            tickFormatter={formatDateTick}
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
          
          <Bar yAxisId="left" dataKey="focus" name="Focus Time" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar yAxisId="left" dataKey="screenTime" name="Screen Time" fill="#cbd5e1" radius={[4, 4, 0, 0]} fillOpacity={0.2} stackId="a" />
          <Bar yAxisId="right" dataKey="tasks" name="Tasks" fill="#34d399" radius={[4, 4, 0, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
