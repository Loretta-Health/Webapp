import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  Flame, 
  Zap,
  Trophy,
  ChevronRight,
  Loader2,
  Target,
  Crown,
  Star,
  Heart,
  Shield,
  Award,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  flame: Flame,
  crown: Crown,
  star: Star,
  zap: Zap,
  heart: Heart,
  shield: Shield,
  award: Award,
  trophy: Trophy,
};
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  category: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt: string | null;
}

const weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function StreakDetails() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  useSwipeBack({ backPath: '/my-dashboard' });
  
  const { data: gamificationData, isLoading } = useQuery<GamificationData>({
    queryKey: ['/api/gamification'],
    enabled: !!user,
  });
  
  const { data: achievements } = useQuery<UserAchievement[]>({
    queryKey: ['/api/achievements/user'],
    enabled: !!user,
  });
  
  const currentStreak = gamificationData?.currentStreak || 0;
  const longestStreak = gamificationData?.longestStreak || 0;
  const maxStreak = 30;
  
  const progressPercent = Math.min((currentStreak / maxStreak) * 100, 100);
  const daysRemaining = Math.max(maxStreak - currentStreak, 0);
  
  const streakAchievements = achievements?.filter(a => a.category === 'streak') || [];
  const unlockedCount = streakAchievements.filter(a => a.unlocked).length;
  
  const lastCheckIn = gamificationData?.lastCheckIn;
  const hasCheckedInToday = lastCheckIn 
    ? new Date(lastCheckIn).toDateString() === new Date().toDateString()
    : false;
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOfWeek = date.getDay();
    const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const isToday = i === 6;
    const daysAgo = 6 - i;
    
    let completed = false;
    if (isToday) {
      completed = hasCheckedInToday;
    } else if (hasCheckedInToday) {
      completed = daysAgo < currentStreak;
    } else {
      completed = daysAgo > 0 && daysAgo <= currentStreak;
    }
    
    return {
      dayKey: weekDayKeys[adjustedIndex],
      completed,
      isToday,
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
      <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] pt-14 px-4 pb-4 safe-area-top">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="w-[44px] flex justify-start">
            <BackButton 
              href="/my-dashboard" 
              className="text-white" 
              iconClassName="text-white"
              data-testid="button-back-dashboard" 
            />
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Flame className="w-5 h-5 text-white fill-white" />
            <h1 className="text-lg font-black text-white">{t('streakDetails.title')}</h1>
          </div>
          <div className="w-[44px]" />
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
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                {t('streakDetails.streakAchievements', { defaultValue: 'Streak Achievements' })}
              </h3>
              <Badge variant="secondary" className="font-bold bg-[#CDB6EF]/30 text-[#013DC4]">
                {unlockedCount}/{streakAchievements.length} {t('streakDetails.unlocked', { defaultValue: 'unlocked' })}
              </Badge>
            </div>
            
            {streakAchievements.length > 0 ? (
              <div className="space-y-3">
                {streakAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`backdrop-blur-xl rounded-2xl p-4 transition-all border ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-r from-orange-500/10 to-amber-400/10 border-orange-500/30' 
                        : 'bg-white/30 dark:bg-gray-800/30 border-white/20 opacity-70'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-orange-500 to-amber-400' 
                            : 'bg-muted grayscale'
                        }`}>
                          {(() => {
                            const IconComponent = iconMap[achievement.icon.toLowerCase()] || Flame;
                            return <IconComponent className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : 'text-muted-foreground'}`} />;
                          })()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-black ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {achievement.title}
                            </h4>
                            {achievement.unlocked && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-xs border-0">
                                {t('streakDetails.achieved', { defaultValue: 'Achieved' })}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          
                          {!achievement.unlocked && achievement.maxProgress > 0 && (
                            <div className="mt-2">
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-orange-500/50 to-amber-400/50 rounded-full"
                                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {achievement.progress}/{achievement.maxProgress} {t('streakDetails.days', { defaultValue: 'days' })}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {achievement.unlocked && (
                          <div className="text-right">
                            <Badge className="font-black border-0 bg-[#013DC4] text-white">
                              <Zap className="w-3 h-3 mr-1" />
                              +50 XP
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('streakDetails.noStreakAchievements', { defaultValue: 'Keep your streak going to unlock achievements!' })}</p>
              </div>
            )}
            
            <Link href="/achievements">
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-[#013DC4] hover:bg-[#013DC4]/10 font-bold min-h-[48px] active:scale-95 transition-transform"
              >
                {t('streakDetails.viewAllAchievements', { defaultValue: 'View All Achievements' })}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
