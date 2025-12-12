import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronRight, Target, Check, Sparkles, Dumbbell, Droplets, Brain, Footprints, Wind, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface MissionCardViewProps {
  suggestedMission: SuggestedMission | null;
  showMissionCard: boolean;
  missionActivated: boolean;
  onActivate: () => void;
  onView: () => void;
}

export default function MissionCardView({
  suggestedMission,
  showMissionCard,
  missionActivated,
  onActivate,
  onView
}: MissionCardViewProps) {
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
        <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-chart-2/5">
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg">
                {(() => {
                  const IconComponent = suggestedMission.icon ? iconMap[suggestedMission.icon.toLowerCase()] : null;
                  return IconComponent ? (
                    <IconComponent className="w-6 h-6 text-white" />
                  ) : (
                    <Target className="w-6 h-6 text-white" />
                  );
                })()}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-gradient-to-r from-primary to-chart-2 text-white border-0 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Suggested Mission
                  </Badge>
                </div>
                <h4 className="font-bold text-foreground">{suggestedMission.title}</h4>
                {suggestedMission.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestedMission.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-primary font-black">
                <Zap className="w-4 h-4 fill-primary" />
                <span>+{suggestedMission.xpReward} XP</span>
              </div>

              <div className="flex gap-2">
                {missionActivated ? (
                  <Badge className="bg-chart-2 text-white border-0">
                    <Check className="w-3 h-3 mr-1" />
                    Activated!
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onView}
                      className="text-xs"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={onActivate}
                      className="bg-gradient-to-r from-primary to-chart-2 text-white text-xs"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Activate Mission
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
