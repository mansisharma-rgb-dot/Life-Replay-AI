import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ComingSoonPage() {
  const location = useLocation();
  
  // Pretty format the path name
  const pageName = location.pathname
    .replace('/', '')
    .replace('-', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card max-w-lg w-full p-10 md:p-14 rounded-3xl border border-white/10 text-center relative overflow-hidden"
      >
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl relative group">
            <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-violet-500/30" />
            <Sparkles className="w-8 h-8 text-violet-400 relative z-10" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {pageName}
          </h1>
          
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-300">
              Coming Soon
            </span>
          </div>
          
          <p className="text-slate-300 leading-relaxed max-w-sm mx-auto">
            We're building an incredible experience for this feature. Stay tuned for the next major update!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
