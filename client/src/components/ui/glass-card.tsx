import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: GlassCardProps) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl shadow-gray-900/10
      ${className}
    `}>
      {children}
    </div>
  );
}
