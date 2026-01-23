import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, Target, Check, Sparkles, Dumbbell, Droplets, Brain, Footprints, Wind, Loader2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const iconMap: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  droplets: Droplets,
  brain: Brain,
  footprints: Footprints,
  wind: Wind,
  target: Target,
};

export interface SuggestedMission {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  icon?: string;
  category?: 'daily' | 'weekly' | 'bonus';
  missionKey?: string;
  userMissionId?: string;
  isAlternative?: boolean;
  parentMissionKey?: string;
}

interface MissionCardViewProps {
  suggestedMission: SuggestedMission | null;
  showMissionCard: boolean;
  missionActivated: boolean;
  onActivate: () => void;
  onView: () => void;
  isActivating?: boolean;
}

function GlassCard({ 
  children, 
  className = '',
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl shadow-gray-900/10
      ${className}
    `}>
      {children}
    </div>
  );
}

function triggerHaptic() {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch (e) {
  }
}

export default function MissionCardView({
  suggestedMission,
  showMissionCard,
  missionActivated,
  onActivate,
  onView,
  isActivating = false
}: MissionCardViewProps) {
  const { t } = useTranslation('pages');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const handleActivate = () => {
    triggerHaptic();
    onActivate();
  };
  
  if (!suggestedMission || !showMissionCard) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="my-4"
      >
        <GlassCard className="overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center shadow-lg shadow-gray-900/10 flex-shrink-0">
                {(() => {
                  const IconComponent = suggestedMission.icon ? iconMap[suggestedMission.icon.toLowerCase()] : null;
                  return IconComponent ? (
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  ) : (
                    <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  );
                })()}
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <span 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] text-white pointer-events-none select-none"
                    aria-label="AI suggested mission badge"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    {t('chat.missionCard.suggestedMission')}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-base sm:text-lg leading-tight truncate max-w-full" title={suggestedMission.title}>
                  {suggestedMission.title}
                </h4>
                {suggestedMission.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {suggestedMission.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-200/50 dark:border-white/10">
              <div 
                className="flex items-center gap-1.5 font-black text-sm sm:text-base bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] bg-clip-text text-transparent pointer-events-none select-none"
                aria-label={`${suggestedMission.xpReward} experience points reward`}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#013DC4] fill-[#013DC4]" aria-hidden="true" />
                <span>+{suggestedMission.xpReward} XP</span>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onView}
                  aria-label={`View details for ${suggestedMission.title}`}
                  className="text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none rounded-xl border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all"
                >
                  {t('chat.missionCard.viewDetails')}
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" aria-hidden="true" />
                </Button>
                <AnimatePresence mode="wait">
                  {missionActivated ? (
                    <motion.span 
                      key="activated"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white min-h-[44px] pointer-events-none"
                      aria-label="Mission activated successfully"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.3, 1] }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </motion.div>
                      {t('chat.missionCard.activated')}
                    </motion.span>
                  ) : (
                    <Button
                      key="activate"
                      size="sm"
                      onClick={handleActivate}
                      disabled={isActivating}
                      aria-label={`Activate mission: ${suggestedMission.title}`}
                      className="bg-gradient-to-r from-[#013DC4] to-[#4B7BE5] hover:from-[#0150FF] hover:to-[#5B8BF5] text-white text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none rounded-xl shadow-lg shadow-gray-900/10 active:scale-95 transition-all disabled:opacity-70"
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 animate-spin" aria-hidden="true" />
                          {t('chat.missionCard.activating', 'Activating...')}
                        </>
                      ) : (
                        <>
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" aria-hidden="true" />
                          {t('chat.missionCard.activateMission')}
                        </>
                      )}
                    </Button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
