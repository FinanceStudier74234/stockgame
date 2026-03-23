import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-accent-blue hover:bg-blue-500 text-white border border-accent-blue/50',
  secondary: 'bg-dark-400 hover:bg-dark-300 text-gray-200 border border-dark-300',
  success: 'bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/30',
  danger: 'bg-accent-red/20 hover:bg-accent-red/30 text-accent-red border border-accent-red/30',
  warning: 'bg-accent-yellow/20 hover:bg-accent-yellow/30 text-accent-yellow border border-accent-yellow/30',
  ghost: 'bg-transparent hover:bg-dark-400 text-gray-300 border border-transparent hover:border-dark-300',
  gold: 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30',
};

const SIZES: Record<string, string> = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-sm rounded-lg font-semibold',
};

export default function Button({
  children, onClick, variant = 'secondary', size = 'md',
  disabled = false, className = '', fullWidth = false, icon
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 select-none
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
