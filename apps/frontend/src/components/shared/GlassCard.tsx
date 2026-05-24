'use client';

import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variants = {
  default: 'bg-white/5 border-white/10',
  accent: 'bg-accent/10 border-accent/20',
  success: 'bg-green-500/10 border-green-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  error: 'bg-red-500/10 border-red-500/20',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function GlassCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl backdrop-blur-xl border shadow-xl',
        variants[variant],
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
