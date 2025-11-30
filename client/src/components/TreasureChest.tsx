import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Gift, Zap, Trophy, Sparkles } from 'lucide-react';

interface Reward {
  type: 'xp' | 'badge' | 'tip' | 'unlock';
  value: string | number;
  icon?: string;
}

interface TreasureChestProps {
  rewards?: Reward[];
  canOpen?: boolean;
  onOpen?: () => void;
  className?: string;
}

export default function TreasureChest({ 
  rewards = [
    { type: 'xp', value: 100 },
    { type: 'badge', value: 'Health Champion' },
    { type: 'tip', value: 'Drink water first thing in the morning!' }
  ],
  canOpen = true,
  onOpen,
  className = '' 
}: TreasureChestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleOpen = () => {
    if (canOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(true);
        setIsAnimating(false);
        onOpen?.();
      }, 600);
    }
  };
  
  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp': return <Zap className="w-6 h-6 fill-primary text-primary" />;
      case 'badge': return <Trophy className="w-6 h-6 text-chart-3" />;
      case 'tip': return <Sparkles className="w-6 h-6 text-chart-2" />;
      default: return <Gift className="w-6 h-6 text-chart-1" />;
    }
  };
  
  return (
    <>
      <button
        onClick={handleOpen}
        disabled={!canOpen}
        className={`relative ${className} ${isAnimating ? 'animate-shake' : canOpen ? 'animate-pulse' : ''}`}
        data-testid="treasure-chest"
      >
        <div className={`w-16 h-16 rounded-lg ${canOpen ? 'bg-gradient-to-br from-chart-3 to-chart-1' : 'bg-muted'} 
          flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95`}>
          <Gift className={`w-8 h-8 ${canOpen ? 'text-white' : 'text-muted-foreground'}`} />
        </div>
        
        {canOpen && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="destructive" className="w-5 h-5 p-0 flex items-center justify-center text-xs font-black rounded-full animate-pulse">
              !
            </Badge>
          </div>
        )}
      </button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" data-testid="treasure-chest-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">
              🎁 Treasure Unlocked!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-6">
            {rewards.map((reward, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border-2 border-border animate-bounce-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`reward-${idx}`}
              >
                <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                  {getRewardIcon(reward.type)}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground capitalize">
                    {reward.type}
                  </p>
                  <p className="font-bold text-foreground">
                    {typeof reward.value === 'number' ? `+${reward.value}` : reward.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => setIsOpen(false)} 
            size="lg" 
            className="w-full font-bold"
            data-testid="button-claim-rewards"
          >
            Claim Rewards
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
