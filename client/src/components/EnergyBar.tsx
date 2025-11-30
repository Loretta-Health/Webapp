import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface EnergyBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export default function EnergyBar({ current, max = 100, showLabel = true, className = '' }: EnergyBarProps) {
  const percentage = (current / max) * 100;
  const isLow = percentage < 30;
  const isMedium = percentage >= 30 && percentage < 70;
  
  const getColor = () => {
    if (isLow) return 'from-destructive to-chart-5';
    if (isMedium) return 'from-chart-3 to-chart-1';
    return 'from-chart-1 to-chart-4';
  };
  
  return (
    <div className={`space-y-2 ${className}`} data-testid="energy-bar">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isLow ? 'text-destructive' : 'text-primary'} fill-current`} />
            <span className="text-sm font-bold text-muted-foreground">Daily Energy</span>
          </div>
          <span className="text-sm font-black text-foreground" data-testid="energy-value">
            {current}/{max}
          </span>
        </div>
      )}
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
          data-testid="energy-fill"
        />
        
        {percentage < 100 && percentage > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md animate-pulse"
            style={{ left: `${percentage}%`, marginLeft: '-4px' }}
          />
        )}
      </div>
    </div>
  );
}
