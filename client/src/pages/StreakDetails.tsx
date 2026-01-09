import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  ChevronLeft, 
  Flame, 
  Zap,
  Trophy,
  Star,
  Target,
  Gift,
  Crown,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

const weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function StreakDetails() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  
  const { data: gamificationData, isLoading } = useQuery<GamificationData>({
    queryKey: ['/api/gamification'],
    enabled: !!user,
  });
  
  const currentStreak = gamificationData?.currentStreak || 0;
  const longestStreak = gamificationData?.longestStreak || 0;
  const maxStreak = 30;
  
  const progressPercent = Math.min((currentStreak / maxStreak) * 100, 100);
  const daysRemaining = Math.max(maxStreak - currentStreak, 0);
  
  const milestoneConfigs = [
    { days: 7, xp: 100, titleKey: 'weekWarrior', icon: Star, achieved: currentStreak >= 7 },
    { days: 14, xp: 250, titleKey: 'fortnightFighter', icon: Target, achieved: currentStreak >= 14 },
    { days: 21, xp: 400, titleKey: 'threeWeekChampion', icon: Trophy, achieved: currentStreak >= 21 },
    { days: 30, xp: 500, titleKey: 'monthlyMaster', icon: Crown, achieved: currentStreak >= 30 },
  ];
  
  const achievedCount = milestoneConfigs.filter(m => m.achieved).length;
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (new Date().getDay() - 6 + i + 7) % 7;
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return {
      dayKey: weekDayKeys[adjustedIndex],
      completed: i < Math.min(currentStreak, 6) && i < 6,
      isToday: i === 6,
    };
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#013DC4]/5 via-background to-[#CDB6EF]/10 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl p-8 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#013DC4]/5 via-background to-[#CDB6EF]/10">
      <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {tCommon('common.back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-white fill-white" />
            <h1 className="text-lg font-black text-white">{t('streakDetails.title')}</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF]" />
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div 
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <div className="text-center">
                    <Flame className="w-10 h-10 text-white fill-white mx-auto mb-1" />
                    <span className="text-4xl font-black text-white">{currentStreak}</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-white text-orange-500 font-black shadow-md border-0">{t('streakDetails.days')}</Badge>
                </div>
              </motion.div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-black text-foreground mb-2">
                  {currentStreak > 0 ? t('streakDetails.amazingStreak') : t('streakDetails.startStreak', { defaultValue: 'Start Your Streak!' })}
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  {currentStreak >= 30 
                    ? t('streakDetails.goalReached', { defaultValue: 'You reached your 30-day goal!' })
                    : t('streakDetails.daysUntilGoal', { count: daysRemaining })}
                </p>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold text-muted-foreground">{t('streakDetails.progressTo30')}</span>
                    <span className="font-black text-orange-500">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-foreground">{longestStreak}</p>
                    <p className="text-xs text-muted-foreground">{t('streakDetails.longestStreak')}</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-[#013DC4]">500</p>
                    <p className="text-xs text-muted-foreground">{t('streakDetails.xpReward')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-black text-foreground mb-4">{t('streakDetails.thisWeek')}</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {last7Days.map((day, index) => (
                <motion.div
                  key={day.dayKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-center"
                >
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mb-1 sm:mb-2">{t(`streakDetails.weekDays.${day.dayKey}`)}</p>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center ${
                    day.completed 
                      ? 'bg-gradient-to-br from-orange-500 to-amber-400' 
                      : day.isToday 
                        ? 'bg-[#013DC4]/20 border-2 border-[#013DC4] border-dashed'
                        : 'bg-muted'
                  }`}>
                    {day.completed ? (
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                    ) : day.isToday ? (
                      <span className="text-[10px] sm:text-xs font-black text-[#013DC4]">{t('streakDetails.today')}</span>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-foreground">{t('streakDetails.milestones')}</h3>
              <Badge variant="secondary" className="font-bold bg-[#CDB6EF]/30 text-[#013DC4]">
                <Gift className="w-3 h-3 mr-1" />
                {t('streakDetails.unlockedCount', { count: achievedCount, total: 4 })}
              </Badge>
            </div>
            
            <div className="space-y-4">
              {milestoneConfigs.map((milestone, index) => {
                const Icon = milestone.icon;
                const isNext = !milestone.achieved && (index === 0 || milestoneConfigs[index - 1]?.achieved);
                
                return (
                  <motion.div
                    key={milestone.days}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`backdrop-blur-xl rounded-2xl p-4 transition-all border ${
                      milestone.achieved 
                        ? 'bg-gradient-to-r from-orange-500/10 to-amber-400/10 border-orange-500/30' 
                        : isNext
                          ? 'bg-white/50 dark:bg-gray-800/50 border-[#013DC4]/50 border-dashed'
                          : 'bg-white/30 dark:bg-gray-800/30 border-white/20 opacity-60'
                    }`}
                    data-testid={`milestone-${milestone.days}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          milestone.achieved 
                            ? 'bg-gradient-to-br from-orange-500 to-amber-400' 
                            : 'bg-muted'
                        }`}>
                          <Icon className={`w-7 h-7 ${milestone.achieved ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-black text-lg ${milestone.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {t(`streakDetails.milestoneNames.${milestone.titleKey}`)}
                            </h4>
                            {milestone.achieved && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs border-0">{t('streakDetails.achieved')}</Badge>
                            )}
                            {isNext && (
                              <Badge variant="outline" className="text-[#013DC4] border-[#013DC4] font-bold text-xs">{t('streakDetails.nextGoal')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('streakDetails.maintainStreak', { days: milestone.days })}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={`font-black border-0 ${milestone.achieved ? 'bg-[#013DC4] text-white' : 'bg-muted text-muted-foreground'}`}>
                            <Zap className="w-3 h-3 mr-1" />
                            +{milestone.xp} XP
                          </Badge>
                          {!milestone.achieved && currentStreak < milestone.days && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('streakDetails.daysToGo', { count: milestone.days - currentStreak })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="backdrop-blur-xl bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/20 border border-white/50 dark:border-white/10 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <img src={mascotImage} alt="Loretta Mascot" className="w-12 h-12 object-contain" />
              <div>
                <p className="font-bold text-foreground">{t('streakDetails.keepGoing')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('streakDetails.communityTipContent')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
