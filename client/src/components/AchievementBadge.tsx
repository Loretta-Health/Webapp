import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock, Star, Target, Flame, Crown, Award, Zap, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon?: 'trophy' | 'target' | 'flame' | 'crown' | 'award' | 'zap' | 'heart' | 'star';
  unlocked?: boolean;
  progress?: number;
  maxProgress?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedDate?: string;
  className?: string;
}

const iconMap = {
  trophy: Trophy,
  target: Target,
  flame: Flame,
  crown: Crown,
  award: Award,
  zap: Zap,
  heart: Heart,
  star: Star,
};

export default function AchievementBadge({
  title,
  description,
  icon = 'trophy',
  unlocked = false,
  progress = 0,
  maxProgress = 100,
  rarity = 'common',
  unlockedDate,
  className = ''
}: AchievementBadgeProps) {
  const IconComponent = iconMap[icon] || Trophy;
  const rarityColors = {
    common: 'border-muted',
    rare: 'border-chart-4',
    epic: 'border-chart-2',
    legendary: 'border-chart-3'
  };
  
  const rarityGradients = {
    common: 'from-muted to-muted',
    rare: 'from-chart-4 to-chart-1',
    epic: 'from-chart-2 to-chart-4',
    legendary: 'from-chart-3 to-chart-1'
  };
  
  const progressPercent = (progress / maxProgress) * 100;
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:-translate-y-1 ${
        unlocked ? `border-2 ${rarityColors[rarity]}` : 'opacity-60'
      } ${className}`}
      data-testid={`achievement-${unlocked ? 'unlocked' : 'locked'}`}
    >
      {unlocked && rarity !== 'common' && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityGradients[rarity]}`} />
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
            unlocked 
              ? `bg-gradient-to-br ${rarityGradients[rarity]} shadow-lg` 
              : 'bg-muted'
          }`}>
            {unlocked ? (
              <IconComponent className="w-8 h-8 text-white drop-shadow-md" />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-bold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}
                data-testid="achievement-title">
                {unlocked ? title : '???'}
              </h4>
              {unlocked && rarity !== 'common' && (
                <Badge variant="secondary" className="text-xs font-black capitalize">
                  {rarity}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {unlocked ? description : 'Complete challenges to unlock'}
            </p>
          </div>
        </div>
        
        {!unlocked && maxProgress > 1 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                Progress: {progress}/{maxProgress}
              </span>
              <span className="font-bold text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" data-testid="achievement-progress" />
          </div>
        )}
        
        {unlocked && unlockedDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Star className="w-3 h-3" />
            <span>Unlocked {unlockedDate}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
