import React from 'react';
import { X, Trophy, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { GameNotification } from '../../types';

const ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle size={14} className="text-accent-green flex-shrink-0" />,
  error: <AlertTriangle size={14} className="text-accent-red flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-accent-yellow flex-shrink-0" />,
  info: <Info size={14} className="text-accent-blue flex-shrink-0" />,
  achievement: <Trophy size={14} className="text-gold flex-shrink-0" />,
  market: <TrendingUp size={14} className="text-accent-cyan flex-shrink-0" />,
};

const BORDERS: Record<string, string> = {
  success: 'border-l-accent-green',
  error: 'border-l-accent-red',
  warning: 'border-l-accent-yellow',
  info: 'border-l-accent-blue',
  achievement: 'border-l-gold',
  market: 'border-l-accent-cyan',
};

interface NotifProps {
  notification: GameNotification;
}

function NotifCard({ notification }: NotifProps) {
  const { dismissNotification } = useGameStore();

  return (
    <div className={`notification-enter card border-l-2 ${BORDERS[notification.type] || 'border-l-dark-300'} p-3 shadow-lg`}>
      <div className="flex items-start gap-2">
        {ICONS[notification.type]}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white leading-tight">{notification.title}</div>
          <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">{notification.message}</div>
        </div>
        <button
          onClick={() => dismissNotification(notification.id)}
          className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPanel() {
  const { notifications } = useGameStore();
  const visible = notifications.slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 w-80">
      {visible.map(n => <NotifCard key={n.id} notification={n} />)}
    </div>
  );
}
