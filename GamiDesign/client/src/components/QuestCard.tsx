import { useState } from 'react';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Zap, Star, ChevronRight } from 'lucide-react';

interface QuestCardProps {
  title: string;
  description?: string;
  xpReward: number;
  progress?: number;
  maxProgress?: number;
  category?: 'daily' | 'weekly' | 'bonus';
  completed?: boolean;
  legendary?: boolean;
  onComplete?: () => void;
  href?: string;
  className?: string;
}

export default function QuestCard({
  title,
  description,
  xpReward,
  progress = 0,
  maxProgress = 1,
  category = 'daily',
  completed = false,
  legendary = false,
  onComplete,
  href,
  className = ''
}: QuestCardProps) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleComplete = () => {
    if (!isCompleted && progress >= maxProgress) {
      setIsCompleted(true);
      setShowConfetti(true);
      onComplete?.();
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };
  
  const progressPercent = maxProgress > 1 ? (progress / maxProgress) * 100 : isCompleted ? 100 : 0;
  
  const categoryColors = {
    daily: 'bg-chart-1 text-white',
    weekly: 'bg-chart-2 text-white',
    bonus: 'bg-gradient-to-r from-chart-3 to-chart-1 text-white'
  };
  
  const cardContent = (
    <Card 
      className={`relative overflow-hidden transition-all hover:-translate-y-1 ${
        legendary ? 'border-2 border-chart-3 shadow-lg shadow-chart-3/20' : ''
      } ${isCompleted ? 'opacity-75' : ''} ${href ? 'cursor-pointer hover-elevate' : ''} ${className}`}
      onClick={href ? undefined : handleComplete}
      data-testid={`quest-card-${category}`}
    >
      {legendary && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-3 via-chart-1 to-chart-3 animate-pulse" />
      )}
      
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 z-10 pointer-events-none">
          <span className="text-6xl animate-bounce-in">🎉</span>
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <button
              className={`min-w-6 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                isCompleted
                  ? 'bg-primary border-primary'
                  : 'border-border hover-elevate active-elevate-2'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              data-testid="quest-checkbox"
            >
              {isCompleted && <Check className="w-4 h-4 text-white" />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-bold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  data-testid="quest-title">
                  {title}
                </h4>
                {legendary && <Star className="w-4 h-4 fill-chart-3 text-chart-3" data-testid="quest-legendary" />}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          
          <Badge className={`${categoryColors[category]} font-black text-xs whitespace-nowrap`} data-testid={`badge-${category}`}>
            {category.toUpperCase()}
          </Badge>
        </div>
        
        {maxProgress > 1 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                {progress}/{maxProgress}
              </span>
              <span className="font-bold text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" data-testid="quest-progress" />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-primary font-black" data-testid="quest-xp">
            <Zap className="w-4 h-4 fill-primary" />
            <span>+{xpReward} XP</span>
          </div>
          
          {href ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs font-bold">View Details</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : !isCompleted && progress >= maxProgress ? (
            <button
              onClick={handleComplete}
              className="text-xs font-bold text-primary hover:underline"
              data-testid="button-claim-reward"
            >
              Claim Reward
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
  
  if (href) {
    return (
      <Link href={href}>
        {cardContent}
      </Link>
    );
  }
  
  return cardContent;
}
