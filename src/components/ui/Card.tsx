import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: 'green' | 'blue' | 'red' | 'gold' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  title?: string;
  headerRight?: React.ReactNode;
}

const GLOW_CLASSES: Record<string, string> = {
  green: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
  red: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
  gold: 'shadow-[0_0_20px_rgba(251,191,36,0.12)]',
  none: 'shadow-card',
};

const PAD_CLASSES: Record<string, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  none: '',
};

export default function Card({ children, className = '', onClick, glowColor = 'none', padding = 'md', hover = false, title, headerRight }: CardProps) {
  const glowClass = GLOW_CLASSES[glowColor] || GLOW_CLASSES.none;
  const padClass = PAD_CLASSES[padding] || PAD_CLASSES.md;
  const hoverClass = hover || onClick ? 'card-hover cursor-pointer' : '';

  return (
    <div
      className={`card ${glowClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className={`flex items-center justify-between px-4 pt-4 ${children ? 'pb-2' : 'pb-4'}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</span>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={title ? `${padClass.replace('p-', 'px-').replace(/\d$/, m => m)} pb-4` : padClass}>
        {children}
      </div>
    </div>
  );
}
