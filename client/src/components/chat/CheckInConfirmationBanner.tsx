import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckInConfirmationBannerProps {
  emotion: string;
  onConfirm: () => void;
  onDeny: () => void;
}

const emotionEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  stressed: '😫',
  calm: '😌',
  excited: '🤩',
  tired: '😴',
  energetic: '⚡',
  neutral: '😐',
  grateful: '🙏',
  frustrated: '😤',
  hopeful: '🌟',
};

const emotionColors: Record<string, string> = {
  happy: 'from-yellow-400 to-orange-400',
  sad: 'from-blue-400 to-indigo-400',
  anxious: 'from-purple-400 to-pink-400',
  stressed: 'from-red-400 to-orange-400',
  calm: 'from-teal-400 to-cyan-400',
  excited: 'from-pink-400 to-rose-400',
  tired: 'from-gray-400 to-slate-400',
  energetic: 'from-yellow-400 to-lime-400',
  neutral: 'from-gray-400 to-gray-500',
  grateful: 'from-emerald-400 to-teal-400',
  frustrated: 'from-red-500 to-rose-500',
  hopeful: 'from-amber-400 to-yellow-400',
};

export default function CheckInConfirmationBanner({
  emotion,
  onConfirm,
  onDeny
}: CheckInConfirmationBannerProps) {
  const emoji = emotionEmojis[emotion.toLowerCase()] || '💭';
  const colorGradient = emotionColors[emotion.toLowerCase()] || 'from-primary to-chart-2';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="my-4"
      >
        <Card className="overflow-hidden border-2 border-chart-2/30 bg-gradient-to-br from-chart-2/5 via-card to-primary/5">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg`}>
                <span className="text-2xl">{emoji}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-destructive fill-destructive" />
                  <span className="text-sm font-bold text-foreground">Emotional Check-In</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're feeling <span className="font-bold text-foreground capitalize">{emotion}</span> today. Is that right?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={onDeny}
                className="text-xs sm:text-sm text-muted-foreground hover:text-destructive hover:border-destructive min-h-[40px] active:scale-95"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Not quite
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className="bg-gradient-to-r from-chart-2 to-emerald-500 text-white text-xs sm:text-sm min-h-[40px] active:scale-95"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Yes, that's right
              </Button>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Confirming earns you +10 XP for self-awareness!</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
