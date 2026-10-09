import React from 'react';
import { motion } from 'framer-motion';

export default function TimelineEventCard({ event, index }) {
    // Determine colors based on event type
    let gradientColors = "from-primary-500 to-indigo-500";
    let iconBg = "bg-primary-900/30 text-primary-400";
    
    switch (event.type) {
        case 'achievement':
            gradientColors = "from-amber-400 to-orange-500";
            iconBg = "bg-amber-900/30 text-amber-400";
            break;
        case 'goal':
            gradientColors = "from-emerald-400 to-cyan-500";
            iconBg = "bg-emerald-900/30 text-emerald-400";
            break;
        case 'checkin':
            gradientColors = "from-blue-400 to-indigo-500";
            iconBg = "bg-blue-900/30 text-blue-400";
            break;
        case 'journal':
            gradientColors = "from-purple-400 to-pink-500";
            iconBg = "bg-purple-900/30 text-purple-400";
            break;
        case 'skill':
            gradientColors = "from-cyan-400 to-blue-500";
            iconBg = "bg-cyan-900/30 text-cyan-400";
            break;
        case 'habit':
            gradientColors = "from-green-400 to-emerald-500";
            iconBg = "bg-green-900/30 text-green-400";
            break;
        case 'life_score':
            gradientColors = "from-yellow-400 to-amber-500";
            iconBg = "bg-yellow-900/30 text-yellow-400";
            break;
        default:
            break;
    }

    const dateStr = new Date(event.timestamp).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });

    return (
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative flex gap-6"
        >
            {/* Vertical Line */}
            <div className="absolute left-6 top-12 bottom-[-2rem] w-px bg-surface-700"></div>

            {/* Icon Node */}
            <div className={`relative z-10 w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center border border-surface-600 ${iconBg} shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.3)]`}>
                <span className="text-xl">{event.icon}</span>
            </div>

            {/* Content Card */}
            <div className="glass-card flex-grow p-5 hover:border-primary-500/50 transition-colors group mb-8">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                        {event.title}
                    </h3>
                    <span className="text-xs text-gray-400 bg-surface-800 px-2 py-1 rounded-full whitespace-nowrap">
                        {dateStr}
                    </span>
                </div>
                
                {event.description && (
                    <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                        {event.description}
                    </p>
                )}

                {/* Subtle neon accent line at bottom of card */}
                <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${gradientColors} rounded-b-xl absolute bottom-0 left-0 opacity-70`}></div>
            </div>
        </motion.div>
    );
}
