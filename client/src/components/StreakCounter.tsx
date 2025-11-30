import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StreakCounterProps {
  days: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function StreakCounter({ days, size = 'md', showLabel = true, className = '' }: StreakCounterProps) {
  const sizeClasses = {
    sm: { container: 'gap-1', icon: 'w-5 h-5', number: 'text-xl', label: 'text-xs' },
    md: { container: 'gap-2', icon: 'w-8 h-8', number: 'text-3xl', label: 'text-sm' },
    lg: { container: 'gap-3', icon: 'w-12 h-12', number: 'text-5xl', label: 'text-base' }
  };
  
  const isMilestone = days % 7 === 0 && days > 0;
  
  return (
    <div className={`flex flex-col items-center ${sizeClasses[size].container} ${className}`} data-testid="streak-counter">
      <div className={`relative ${isMilestone ? 'animate-pulse-glow' : ''}`}>
        <Flame 
          className={`${sizeClasses[size].icon} fill-chart-3 text-chart-3 drop-shadow-lg`}
          data-testid="streak-flame"
        />
        {isMilestone && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="default" className="px-1 py-0 text-xs font-black animate-bounce-in">
              🎉
            </Badge>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className={`${sizeClasses[size].number} font-black text-foreground leading-none`} data-testid="streak-days">
          {days}
        </p>
        {showLabel && (
          <p className={`${sizeClasses[size].label} font-bold text-muted-foreground`}>
            Day Streak
          </p>
        )}
      </div>
      
      {isMilestone && days >= 7 && (
        <Badge variant="secondary" className="font-black animate-bounce-in" data-testid="streak-milestone">
          🏆 {days} Day Milestone!
        </Badge>
      )}
    </div>
  );
}
