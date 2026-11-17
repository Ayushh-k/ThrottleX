import React from 'react';
import { X, CheckCheck, AlertTriangle, Clock, ShieldAlert, DollarSign, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/formatters';

export default function NotificationDrawer({ isOpen, onClose, onNavigate }) {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type, severity) => {
    if (severity === 'urgent') return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    if (type === 'service_due') return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    if (type === 'settlement_due') return <DollarSign className="w-5 h-5 text-brand-orange" />;
    return <Clock className="w-5 h-5 text-sky-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-brand-card dark:bg-brand-card border-l border-brand-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-orange" />
            <h3 className="font-bold text-white text-base">Alerts & Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-brand-orange text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-white/5"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              No active alerts. All systems running smooth!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.isRead) markAsRead(n._id);
                  if (n.link) {
                    if (n.link.startsWith('/rentals/')) {
                      onNavigate('rentals', n.link.split('/')[2]);
                    } else if (n.link.startsWith('/bikes/')) {
                      onNavigate('bikes', n.link.split('/')[2]);
                    } else if (n.link === '/settlements') {
                      onNavigate('settlements');
                    }
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  n.isRead
                    ? 'bg-brand-surface/40 border-brand-border/40 opacity-70'
                    : 'bg-brand-surface border-brand-orange/30 shadow-sm'
                } hover:border-brand-orange/60`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(n.type, n.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
