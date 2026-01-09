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
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10" data-testid="level-up-modal">
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center animate-level-up">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-2xl shadow-[#013DC4]/30">
                <Trophy className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-gradient-to-r from-[#CDB6EF] to-purple-500 text-white font-black px-3 py-1 text-lg animate-pulse border-0">
                  NEW!
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white animate-bounce-in" data-testid="level-number">
              LEVEL {level}
            </h2>
            <p className="text-xl font-bold text-[#013DC4]">Level Up! 🎉</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#013DC4]/10 to-[#0150FF]/10 border border-[#013DC4]/20">
              <Zap className="w-8 h-8 fill-[#013DC4] text-[#013DC4] mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900 dark:text-white" data-testid="xp-earned">+{xpEarned}</p>
              <p className="text-xs text-gray-500 font-semibold">Bonus XP</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#CDB6EF]/20 to-purple-400/10 border border-[#CDB6EF]/30">
              <Star className="w-8 h-8 fill-[#CDB6EF] text-[#CDB6EF] mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900 dark:text-white">{badges.length || 2}</p>
              <p className="text-xs text-gray-500 font-semibold">New Badges</p>
            </div>
          </div>
          
          {unlocks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-[#CDB6EF]" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Unlocked Features</h3>
              </div>
              
              <div className="space-y-2">
                {unlocks.map((unlock, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white animate-bounce-in"
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
            className="w-full font-black text-lg bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl shadow-lg shadow-[#013DC4]/20"
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
