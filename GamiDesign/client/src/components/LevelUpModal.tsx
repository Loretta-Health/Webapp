import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Star, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  xpEarned?: number;
  badges?: string[];
  unlocks?: string[];
  onClose: () => void;
}

export default function LevelUpModal({
  open,
  level,
  xpEarned = 500,
  badges = [],
  unlocks = ['New achievement category', 'Bonus XP multiplier'],
  onClose
}: LevelUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-primary/10 via-background to-chart-2/10" data-testid="level-up-modal">
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center animate-level-up">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center shadow-2xl">
                <Trophy className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-destructive text-white font-black px-3 py-1 text-lg animate-pulse">
                  NEW!
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-foreground animate-bounce-in" data-testid="level-number">
              LEVEL {level}
            </h2>
            <p className="text-xl font-bold text-primary">Level Up! 🎉</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="p-4 rounded-lg bg-card border-2 border-border">
              <Zap className="w-8 h-8 fill-primary text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground" data-testid="xp-earned">+{xpEarned}</p>
              <p className="text-xs text-muted-foreground font-semibold">Bonus XP</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border-2 border-border">
              <Star className="w-8 h-8 fill-chart-3 text-chart-3 mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{badges.length || 2}</p>
              <p className="text-xs text-muted-foreground font-semibold">New Badges</p>
            </div>
          </div>
          
          {unlocks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-chart-2" />
                <h3 className="text-lg font-black text-foreground">Unlocked Features</h3>
              </div>
              
              <div className="space-y-2">
                {unlocks.map((unlock, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-foreground animate-bounce-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    data-testid={`unlock-${idx}`}
                  >
                    ✨ {unlock}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            size="lg" 
            className="w-full font-black text-lg"
            onClick={onClose}
            data-testid="button-continue"
          >
            Continue Your Journey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
