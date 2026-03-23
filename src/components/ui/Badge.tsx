import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray' | 'gold' | 'cyan';
  size?: 'xs' | 'sm';
  pulse?: boolean;
}

const VARIANTS: Record<string, string> = {
  green: 'bg-accent-green/15 text-accent-green border border-accent-green/20',
  red: 'bg-accent-red/15 text-accent-red border border-accent-red/20',
  blue: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/20',
  yellow: 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/20',
  purple: 'bg-accent-purple/15 text-accent-purple border border-accent-purple/20',
  gray: 'bg-dark-400 text-gray-400 border border-dark-300',
  gold: 'bg-gold/15 text-gold border border-gold/20',
  cyan: 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20',
};

export default function Badge({ children, variant = 'gray', size = 'xs', pulse = false }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full font-semibold
      ${size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
      ${VARIANTS[variant]}
      ${pulse ? 'animate-pulse' : ''}
    `}>
      {children}
    </span>
  );
}
