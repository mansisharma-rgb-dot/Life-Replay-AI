import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Filter, Loader2, ArrowRight } from 'lucide-react';
import { notificationsApi } from '@api/notificationsApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageSpinner from '@components/ui/PageSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, WARNINGS, INSIGHTS
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['smart-notifications'],
    queryFn: () => notificationsApi.getSmartNotifications(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['smart-notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['smart-notifications']);
      toast.success("All caught up!");
    }
  });

  if (isLoading) return <PageSpinner />;

  const allNotifications = data?.notifications || [];
  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  const filteredNotifications = allNotifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'WARNINGS') return n.severity === 'WARNING' || n.severity === 'IMPORTANT';
    if (filter === 'INSIGHTS') return n.type === 'productivity' || n.type === 'focus' || n.type === 'sleep';
    return true; // ALL
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'WARNING': return { icon: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'IMPORTANT': return { icon: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
      case 'SUCCESS': return { icon: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      default: return { icon: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary-400 tracking-tight flex items-center gap-2.5 sm:gap-3">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-violet-400" />
            Smart Notifications
          </h1>
          <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Stay aware of patterns that matter.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {markAllAsReadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-700/50 pb-4">
        <Filter className="w-4 h-4 text-slate-500 mr-2" />
        {['ALL', 'UNREAD', 'WARNINGS', 'INSIGHTS'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              filter === f 
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                : 'bg-surface-800 text-slate-400 hover:bg-surface-700 border border-surface-700'
            }`}
          >
            {f} {f === 'UNREAD' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="glass-card flex flex-col items-center justify-center text-center py-20 rounded-2xl border-dashed border-surface-700"
            >
              <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">You're all caught up!</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                No notifications to display for the current filter.
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => {
              const style = getSeverityStyle(notif.severity);
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-card p-5 sm:p-6 rounded-2xl border transition-all ${
                    !notif.is_read ? 'border-violet-500/30 bg-surface-800/80' : 'border-surface-700/50 bg-surface-900/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${style.bg} ${style.border} ${style.icon}`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <h3 className={`text-lg font-bold ${!notif.is_read ? 'text-white' : 'text-slate-300'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-4 leading-relaxed ${!notif.is_read ? 'text-slate-300' : 'text-slate-400'}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3">
                        {notif.link && (
                          <button
                            onClick={() => {
                              if (!notif.is_read) markAsReadMutation.mutate(notif.id);
                              navigate(notif.link);
                            }}
                            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-2"
                          >
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsReadMutation.mutate(notif.id)}
                            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-2"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
