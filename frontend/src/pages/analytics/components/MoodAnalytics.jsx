import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartCard } from '@components/dashboard/ChartCard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-modal !rounded-xl !bg-surface-850/90 !border-slate-700">
        <p className="text-sm font-semibold text-slate-100 mb-1">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].payload.fill }} />
          <span className="text-slate-400">Frequency:</span>
          <span className="font-medium text-slate-200">{payload[0].value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MoodAnalytics({ data }) {
  if (!data) return null;

  const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f87171', '#ef4444'];

  return (
    <ChartCard 
      title="Mood Distribution" 
      subtitle={`Avg Mood: ${data.averageMood}/10 • Best Day: ${data.bestMoodDay}`} 
      delay={0.2}
      className="col-span-1 lg:col-span-1 min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data.distribution} 
          layout="vertical"
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} hide />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
          
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
