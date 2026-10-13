import React from 'react';
import StatCard from '@components/dashboard/StatCard';
import { 
  Heart, Zap, Star, Trophy, Activity,
  CheckCircle, Droplet, Moon, Target, BookOpen 
} from 'lucide-react';

export default function OverviewCards({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <StatCard
        title="Average Life Score"
        value={data.averageLifeScore ?? 0}
        icon={Heart}
        trend={data.trends?.lifeScore}
        color="rose"
        delay={0.1}
      />
      <StatCard
        title="Current Streak"
        value={`${data.currentStreak ?? 0} Days`}
        icon={Zap}
        trend={data.trends?.streak}
        color="amber"
        delay={0.2}
      />
      <StatCard
        title="Total XP"
        value={(data.totalXp ?? 0).toLocaleString()}
        icon={Star}
        trend={data.trends?.xp}
        color="primary"
        delay={0.3}
      />
      <StatCard
        title="Average Mood"
        value={`${data.averageMood ?? 0} / 10`}
        icon={Activity}
        trend={data.trends?.mood}
        color="emerald"
        delay={0.4}
      />
      <StatCard
        title="Completion Rate"
        value={`${data.completionRate ?? 0}%`}
        icon={CheckCircle}
        color="emerald"
        delay={0.5}
      />
      <StatCard
        title="Deep Work (Avg)"
        value={`${Math.round((data.totalStudyHours ?? 0) / 7)} hrs/wk`}
        icon={BookOpen}
        trend={data.trends?.productivity}
        color="violet"
        delay={0.6}
      />
      <StatCard
        title="Avg Sleep"
        value={`${data.averageSleep ?? 0} hrs`}
        icon={Moon}
        color="primary"
        delay={0.7}
      />
      <StatCard
        title="Water Intake"
        value={`${data.averageWaterIntake ?? 0}L`}
        icon={Droplet}
        color="primary"
        delay={0.8}
      />
    </div>
  );
}
