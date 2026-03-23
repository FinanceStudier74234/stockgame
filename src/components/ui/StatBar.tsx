import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  icon?: string;
}

function getAutoColor(value: number): string {
  if (value >= 70) return '#10b981';
  if (value >= 40) return '#3b82f6';
  if (value >= 20) return '#f59e0b';
  return '#ef4444';
}

export default function StatBar({ label, value, max = 100, color, showValue = true, size = 'sm', icon }: StatBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || getAutoColor((value / max) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-400 flex items-center gap-1`}>
          {icon && <span>{icon}</span>}
          {label}
        </span>
        {showValue && (
          <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium num`} style={{ color: barColor }}>
            {value.toFixed(0)}
          </span>
        )}
      </div>
      <div className={`w-full ${size === 'sm' ? 'h-1.5' : 'h-2'} bg-dark-400 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: `0 0 8px ${barColor}40` }}
        />
      </div>
    </div>
  );
}
