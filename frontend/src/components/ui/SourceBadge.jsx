import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Target, Activity, Zap, Award, Calendar, FileText } from 'lucide-react';

const iconMap = {
  journal: BookOpen,
  goal: Target,
  habit: Activity,
  skill: Zap,
  achievement: Award,
  timeline: Calendar,
  document: FileText,
};

const routeMap = {
  journal: '/journal',
  goal: '/goals',
  habit: '/habits',
  skill: '/skills',
  achievement: '/achievements',
  timeline: '/history',
  document: '/memories',
};

const colorMap = {
  journal: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/50',
  goal: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/50',
  habit: 'bg-green-500/10 text-green-400 border-green-500/20 hover:border-green-500/50',
  skill: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/50',
  achievement: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:border-yellow-500/50',
  timeline: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/50',
  document: 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:border-pink-500/50',
};

export const SourceBadge = ({ type, id, label, onClick }) => {
  const normalizedType = type?.toLowerCase() || 'timeline';
  const Icon = iconMap[normalizedType] || Calendar;
  const route = routeMap[normalizedType] || '/';
  const colors = colorMap[normalizedType] || colorMap.timeline;
  
  const className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${colors}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={className} title="View Source">
        <Icon className="w-3.5 h-3.5" />
        {label || normalizedType}
      </button>
    );
  }

  return (
    <Link 
      to={route} 
      className={className}
      title="View Source"
    >
      <Icon className="w-3.5 h-3.5" />
      {label || normalizedType}
    </Link>
  );
};
