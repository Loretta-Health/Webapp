import { Progress } from '@/components/ui/progress';
import { Trophy, Zap } from 'lucide-react';

interface XPProgressProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
}

export default function XPProgress({ currentXP, nextLevelXP, level, className = '' }: XPProgressProps) {
  const progress = (currentXP / nextLevelXP) * 100;
  
  return (
    <div className={`space-y-3 ${className}`} data-testid="xp-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-white" data-testid="level-icon" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Level</p>
            <p className="text-2xl font-black text-foreground" data-testid="level-number">{level}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-semibold text-muted-foreground">XP</p>
          <p className="text-lg font-bold text-primary flex items-center gap-1" data-testid="xp-amount">
            <Zap className="w-4 h-4 fill-primary" />
            {currentXP}/{nextLevelXP}
          </p>
        </div>
      </div>
      
      <div className="relative">
        <Progress value={progress} className="h-3 bg-muted" data-testid="xp-progress-bar" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-black text-white drop-shadow-md">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
