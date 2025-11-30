import { Heart } from 'lucide-react';

interface LivesIndicatorProps {
  current: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LivesIndicator({ current, max = 5, size = 'md', className = '' }: LivesIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const isLow = current <= max * 0.4;
  
  return (
    <div className={`flex flex-col gap-2 ${className}`} data-testid="lives-indicator">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <Heart
            key={i}
            className={`${sizeClasses[size]} transition-all ${
              i < current
                ? 'fill-destructive text-destructive drop-shadow-md'
                : 'fill-muted/30 text-muted/30'
            } ${isLow && i < current ? 'animate-pulse' : ''}`}
            data-testid={`heart-${i}`}
          />
        ))}
      </div>
      
      <p className={`text-xs font-bold ${isLow ? 'text-destructive' : 'text-muted-foreground'}`} data-testid="lives-count">
        {current}/{max} {isLow && '⚠️ Low Lives!'}
      </p>
    </div>
  );
}
