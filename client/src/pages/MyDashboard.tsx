import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Moon, Sun, Menu, X, User, MessageCircle, Shield, Accessibility, LogOut, Loader2, Sparkles, ClipboardList, Check, Trophy, BookOpen, Pill, Smile, ChevronRight, MapPin, MapPinOff, ChevronDown, Star, TrendingUp, Zap, Target, AlertTriangle } from 'lucide-react';
import { Heart, Flame } from 'lucide-react';
import { Link, useLocation, Redirect } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import logoHorizontalBlue from '@assets/Logo_horizontal_blue@2x_(1)_1766161586795.png';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import QuestCard from '@/components/QuestCard';
import MedicationTracker from '@/components/MedicationTracker';
import Leaderboard from '@/components/Leaderboard';
import AchievementBadge from '@/components/AchievementBadge';
import LevelUpModal from '@/components/LevelUpModal';
import HealthScienceSection from '@/components/HealthScienceSection';
import { type CommunityType } from '@/components/CommunitySelector';
import EmotionalCheckInModal from '@/components/EmotionalCheckInModal';
import AddMedicationModal from '@/components/AddMedicationModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMissions } from '@/hooks/useMissions';
import { useMedicationProgress } from '@/hooks/useMedicationProgress';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { privacyPolicyContent, accessibilityPolicyContent } from '@/content/policies';
import { useXPUpdater } from '@/hooks/useXPUpdater';
import { format, isToday, isYesterday } from 'date-fns';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

interface RiskScoreData {
  overallScore: number;
}

interface EmotionalCheckinData {
  id: string;
  userId: string;
  emotion: string;
  userMessage: string | null;
  aiResponse: string | null;
  xpAwarded: number;
  checkedInAt: string;
}

interface ActivityData {
  id?: string;
  userId: string;
  date: string;
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  sleepGoal: number;
  heartRate: number;
  calories: number;
  caloriesGoal: number;
  water: number;
  waterGoal: number;
}

interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  maxProgress: number;
  xpReward: number;
  category: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

function GlassCard({ 
  children, 
  className = '',
  glow = false,
  transparent = false
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
  transparent?: boolean;
}) {
  return (
    <div className={`
      ${transparent ? '' : 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10'}
      rounded-3xl shadow-xl shadow-gray-900/10
      ${className}
    `}>
      {children}
    </div>
  );
}

function CollapsibleSectionNew({ 
  title, 
  icon, 
  badge, 
  children, 
  defaultOpen = true,
  gradient = false,
  className = ''
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  gradient?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <GlassCard className={`overflow-hidden ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 sm:p-5 flex items-center justify-between transition-colors min-h-[60px] ${
          gradient ? 'bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg flex-shrink-0">
            {icon}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">{title}</h3>
          {badge}
        </div>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
      </div>
    </GlassCard>
  );
}

export default function MyDashboard() {
  const { t } = useTranslation('dashboard');
  const [currentPath, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  const [communityType, setCommunityType] = useState<CommunityType>('loretta');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAccessibilityPolicy, setShowAccessibilityPolicy] = useState(false);
  const [policyLang, setPolicyLang] = useState<'en' | 'de'>('en');
  const [isChecklistClosing, setIsChecklistClosing] = useState(false);
  const previousAllSetupCompleteRef = useRef<boolean | null>(null);
  const { user, isLoading: isAuthLoading, logoutMutation } = useAuth();
  const { locationEnabled, toggleLocationEnabled, usingDefault, loading: locationLoading } = useGeolocation();
  const userId = user?.id;
  const { missions, activeMissions, completedCount, totalCount, completeMission } = useMissions();
  const { medications, getTotalProgress } = useMedicationProgress();
  const medicationProgress = getTotalProgress();
  const { progress: onboardingProgress, isConsentComplete, isQuestionnaireComplete, isSetupChecklistDismissed, markSetupChecklistDismissed } = useOnboardingProgress();
  const { updateAllXPDisplays, updateStreak, refreshAllXPData } = useXPUpdater();
  
  const { data: gamificationData } = useQuery<GamificationData>({
    queryKey: ['/api/gamification'],
    enabled: !!user,
  });

  const { data: riskScoreData } = useQuery<RiskScoreData>({
    queryKey: ['/api/risk-scores/latest'],
    enabled: !!user,
  });

  const { data: allEmotionalCheckins } = useQuery<EmotionalCheckinData[]>({
    queryKey: ['/api/emotional-checkins'],
    enabled: !!user,
  });

  const { data: preferencesData } = useQuery<{ consentAccepted: boolean; consentDate: string | null }>({
    queryKey: ['/api/preferences'],
    enabled: !!user,
  });

  const { data: profileData } = useQuery<{ firstName: string | null; lastName: string | null; dateOfBirth: string | null; profilePhoto: string | null }>({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  const { data: questionnaireData } = useQuery<{ category: string; answers: Record<string, string> }[]>({
    queryKey: ['/api/questionnaires'],
    enabled: !!user,
  });

  const { data: activityData } = useQuery<ActivityData>({
    queryKey: ['/api/activities/today'],
    enabled: !!user,
  });

  const { data: userAchievements } = useQuery<UserAchievement[]>({
    queryKey: ['/api/achievements/user'],
    enabled: !!user,
  });

  const { data: userTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams/me'],
    enabled: !!user,
  });

  const coreQuestionIds = [
    'prescription_medicine', 'high_blood_pressure', 'general_health',
    'age', 'weight_current', 'height', 'high_cholesterol', 'daily_aspirin'
  ];
  
  const getSavedAnswerIds = (): string[] => {
    if (!Array.isArray(questionnaireData) || questionnaireData.length === 0) return [];
    const healthRecord = questionnaireData.find(r => r.category === 'health_risk_assessment');
    if (!healthRecord?.answers) return [];
    return Object.keys(healthRecord.answers);
  };
  
  const savedAnswerIds = getSavedAnswerIds();
  const allCoreQuestionsAnswered = coreQuestionIds.every(id => savedAnswerIds.includes(id));

  // Calculate XP earned today from all sources
  const xpFromCheckinsToday = allEmotionalCheckins?.filter(c => isToday(new Date(c.checkedInAt))).reduce((sum, c) => sum + (c.xpAwarded || 0), 0) || 0;
  const xpFromMissionsToday = missions?.filter(m => m.completed && m.completedAt && isToday(new Date(m.completedAt))).reduce((sum, m) => sum + (m.xpReward || 0), 0) || 0;
  const totalXpToday = xpFromCheckinsToday + xpFromMissionsToday;

  const consentComplete = isConsentComplete || preferencesData?.consentAccepted === true;
  const profileComplete = !!(profileData?.firstName && profileData?.lastName) || !!(user?.firstName && user?.lastName && user?.email);
  const questionnaireComplete = isQuestionnaireComplete || allCoreQuestionsAnswered;
  const firstCheckInComplete = Array.isArray(allEmotionalCheckins) && allEmotionalCheckins.length > 0;
  
  const setupSteps = [
    { id: 'consent', complete: consentComplete, label: t('setup.consent'), xp: 10 },
    { id: 'profile', complete: profileComplete, label: t('setup.profile'), xp: 25 },
    { id: 'questionnaire', complete: questionnaireComplete, label: t('setup.questionnaire'), xp: 50 },
    { id: 'checkin', complete: firstCheckInComplete, label: t('setup.checkin'), xp: 15 },
  ];
  const completedStepsCount = setupSteps.filter(s => s.complete).length;
  const setupProgress = (completedStepsCount / setupSteps.length) * 100;
  const allSetupComplete = completedStepsCount === setupSteps.length;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/gamification/checkin`, {});
    },
    onSuccess: () => {
      const currentStreak = gamificationData?.currentStreak ?? 0;
      updateStreak(currentStreak + 1);
      refreshAllXPData();
    },
  });

  const addXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('POST', `/api/gamification/${userId}/xp`, { amount });
    },
    onSuccess: (_, amount) => {
      updateAllXPDisplays(amount, 'bonus');
    },
  });

  // Refresh all data when dashboard is visited/mounted or when page regains focus
  const refreshAllDashboardData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/activities/today'] });
    queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
    queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins'] });
    queryClient.invalidateQueries({ queryKey: ['/api/risk-scores/latest'] });
  };

  useEffect(() => {
    if (currentPath === '/my-dashboard') {
      refreshAllDashboardData();
    }
  }, [currentPath]);

  // Refresh data when page becomes visible again (e.g., navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAllDashboardData();
      }
    };

    const handleFocus = () => {
      refreshAllDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);

  const xp = gamificationData?.xp ?? 0;
  const level = gamificationData?.level ?? 1;
  const streak = gamificationData?.currentStreak ?? 0;
  const lives = gamificationData?.lives ?? 5;
  const nextLevelXP = level * 100 + 200;
  const xpProgress = ((xp % nextLevelXP) / nextLevelXP) * 100;
  
  const isNewUser = !allSetupComplete && !isSetupChecklistDismissed;
  const showSetupChecklist = !isSetupChecklistDismissed && (!allSetupComplete || isChecklistClosing);
  const displayName = profileData?.firstName || user?.firstName || user?.username || t('common.friend');

  // Detect when all setup steps become complete and trigger closing animation
  useEffect(() => {
    if (previousAllSetupCompleteRef.current === false && allSetupComplete && !isSetupChecklistDismissed) {
      // All steps just became complete - trigger closing animation
      setIsChecklistClosing(true);
      
      // Wait for animation then permanently dismiss and save to database
      const timer = setTimeout(() => {
        markSetupChecklistDismissed();
        setIsChecklistClosing(false);
      }, 2000); // 2 seconds for celebration + exit animation
      
      return () => clearTimeout(timer);
    }
    previousAllSetupCompleteRef.current = allSetupComplete;
  }, [allSetupComplete, isSetupChecklistDismissed, markSetupChecklistDismissed]);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCompleteQuest = (missionId: string, xpReward: number) => {
    completeMission(missionId);
    addXPMutation.mutate(xpReward);
  };

  const handleCheckInComplete = (emotion: string, xpAwarded: number) => {
    queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins'] });
  };

  const getEmotionEmoji = (emotion: string): string => {
    const emojiMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      stressed: '😓',
      calm: '😌',
      tired: '😴',
      energetic: '⚡',
      frustrated: '😤',
      grateful: '🙏',
      hopeful: '✨',
    };
    return emojiMap[emotion.toLowerCase()] || '💭';
  };

  const formatCheckinData = (checkin: EmotionalCheckinData) => {
    const date = new Date(checkin.checkedInAt);
    const time = format(date, 'h:mma').toLowerCase();
    const emotion = checkin.emotion;
    const capitalizedEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    
    let dateStr = '';
    if (isToday(date)) {
      dateStr = t('common.atTime', { time });
    } else if (isYesterday(date)) {
      dateStr = t('common.yesterdayAt', { time });
    } else {
      dateStr = t('common.onDateAt', { date: format(date, 'MMM d'), time });
    }
    
    return {
      id: checkin.id,
      emotion: capitalizedEmotion,
      emoji: getEmotionEmoji(emotion),
      dateStr,
    };
  };

  const formatMedicationTime = (timeStr: string): { day?: string; time: string } => {
    const dayAbbreviations: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    
    const formatTime12h = (time24: string): string => {
      const match = time24.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return time24;
      const hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${period}`;
    };
    
    const dayMatch = timeStr.match(/^([a-zA-Z]+):(\d{1,2}:\d{2})$/);
    if (dayMatch) {
      const day = dayMatch[1].toLowerCase();
      const time = dayMatch[2];
      return {
        day: dayAbbreviations[day] || day.charAt(0).toUpperCase() + day.slice(1, 2),
        time: formatTime12h(time),
      };
    }
    
    const timeOnlyMatch = timeStr.match(/^(\d{1,2}:\d{2})$/);
    if (timeOnlyMatch) {
      return { time: formatTime12h(timeOnlyMatch[1]) };
    }
    
    return { time: timeStr };
  };

  const groupMedicationTimes = (times: string[]): { label: string; times: string[] }[] => {
    const grouped: Record<string, string[]> = {};
    const dailyTimes: string[] = [];
    
    times.forEach(timeStr => {
      const formatted = formatMedicationTime(timeStr);
      if (formatted.day) {
        if (!grouped[formatted.day]) {
          grouped[formatted.day] = [];
        }
        grouped[formatted.day].push(formatted.time);
      } else {
        dailyTimes.push(formatted.time);
      }
    });
    
    const result: { label: string; times: string[] }[] = [];
    
    if (dailyTimes.length > 0) {
      result.push({ label: 'Daily', times: dailyTimes });
    }
    
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayOrder.forEach(day => {
      if (grouped[day]) {
        result.push({ label: day, times: grouped[day] });
      }
    });
    
    return result;
  };

  const riskScore = riskScoreData?.overallScore ?? 50;
  // Risk score: higher = worse health (0 = healthy, 100 = high risk)
  const riskLevel = riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Moderate Risk' : 'High Risk';
  const riskColor = riskScore <= 30 ? 'text-green-600' : riskScore <= 60 ? 'text-amber-600' : 'text-red-600';

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[85vw] max-w-[320px] sm:w-80 lg:w-[340px]
          bg-gradient-to-b from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-2xl
          border-r border-white/50 dark:border-white/10
          flex flex-col overflow-y-auto
          transform transition-transform duration-500 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl shadow-gray-900/10
          safe-area-top safe-area-left safe-area-bottom
        `}
        data-testid="sidebar"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-5 lg:p-7">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-5">
            <img src={logoHorizontalBlue} alt="Loretta" className="h-9 object-contain" data-testid="logo-loretta-mobile" />
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2.5 hover:bg-white/50 rounded-2xl transition-colors"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-5 lg:space-y-6">
          <Link href="/profile">
            <GlassCard className="p-5 text-center cursor-pointer hover:shadow-xl transition-all">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-2xl shadow-gray-900/20 overflow-hidden">
                  {profileData?.profilePhoto ? (
                    <img 
                      src={profileData.profilePhoto} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-[#CDB6EF] to-purple-400 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                  <img src={logomarkViolet} alt="" className="w-5 h-5 brightness-0 invert" />
                </div>
              </div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white">{user.username}</h2>
              <p className="text-sm text-gray-500 font-medium">
                {isNewUser ? t('sidebar.newMember') : t('sidebar.healthExplorer', { level })}
              </p>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 rounded-2xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{t('stats.level', { level })}</span>
                  </div>
                  <span className="text-gray-500 font-medium">{(xp % nextLevelXP).toLocaleString()} / {nextLevelXP.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </GlassCard>
          </Link>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('sidebar.todaysProgress')}</h3>
              <Link href="/streak">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">{streak}</span>
                </div>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t('sidebar.xpEarned'), value: `+${totalXpToday}`, color: 'from-[#013DC4] to-[#0150FF]', href: null },
                { label: t('sidebar.badges', 'Badges'), value: `${userAchievements?.filter(a => a.unlocked).length || 0}`, color: 'from-amber-400 to-orange-400', href: '/leaderboard?tab=achievements' },
                { label: t('sidebar.missions'), value: `${completedCount}/${activeMissions.length}`, color: 'from-[#CDB6EF] to-purple-400', href: '/mission-details' },
              ].map((stat) => (
                stat.href ? (
                  <Link key={stat.label} href={stat.href}>
                    <div className="text-center p-2 sm:p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all cursor-pointer">
                      <div className={`text-base sm:text-lg font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{stat.label}</div>
                    </div>
                  </Link>
                ) : (
                  <div key={stat.label} className="text-center p-2 sm:p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                    <div className={`text-base sm:text-lg font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{stat.label}</div>
                  </div>
                )
              ))}
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">{t('sidebar.myCommunity')}</h3>
            <div className="space-y-2">
              <div className="relative">
                <select
                  value={communityType}
                  onChange={(e) => setCommunityType(e.target.value as CommunityType)}
                  className="w-full appearance-none bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border border-[#013DC4]/20 rounded-2xl px-4 py-3 pr-10 font-semibold text-[#013DC4] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 cursor-pointer"
                >
                  <option value="loretta">{t('community.loretta', 'Loretta Community')}</option>
                  <option value="friends">{t('community.friends', 'My Friends')}</option>
                  {userTeams && userTeams.filter(team => team.id !== 'loretta-community').map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#013DC4] pointer-events-none" />
              </div>
              
              <Link href={`/leaderboard?community=${communityType}`}>
                <button 
                  className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/50 dark:hover:bg-gray-800/50"
                  data-testid="button-leaderboard"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.leaderboard')}</span>
                </button>
              </Link>
            </div>
          </GlassCard>
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider px-1 mb-3">{t('sidebar.navigation')}</h3>
            <Link href="/profile">
              <button 
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10"
                data-testid="button-profile"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-[#013DC4]">{t('sidebar.myProfile')}</span>
              </button>
            </Link>
            <Link href="/chat">
              <button 
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:bg-white/50 dark:hover:bg-gray-800/50"
                data-testid="button-chat"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.healthNavigator')}</span>
              </button>
            </Link>
            <button 
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:bg-white/50 dark:hover:bg-gray-800/50"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
                  <LogOut className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('sidebar.signOut')}</span>
            </button>
          </div>
          </div>
          
          <div className="flex gap-4 px-1 pt-2">
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#013DC4] transition-colors font-medium"
              data-testid="button-privacy-policy"
            >
              <Shield className="w-3.5 h-3.5" />
              {t('sidebar.privacyPolicy')}
            </button>
            <button 
              onClick={() => setShowAccessibilityPolicy(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#013DC4] transition-colors font-medium"
              data-testid="button-accessibility"
            >
              <Accessibility className="w-3.5 h-3.5" />
              {t('sidebar.accessibility')}
            </button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white px-4 pt-6 pb-4 sm:pt-8 sm:pb-5 flex items-center justify-between shadow-2xl shadow-gray-900/20 relative overflow-hidden safe-area-top">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          
          <button 
            className="lg:hidden p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors relative z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-open-sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-3 relative z-10">
            {!isNewUser && (
              <div className="hidden sm:flex px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-xl items-center gap-2 shadow-lg">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-bold">{t('stats.level', { level })}</span>
              </div>
            )}
            
            <LanguageSwitcher />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={toggleLocationEnabled}
                    disabled={locationLoading}
                    data-testid="button-location-toggle"
                    className={`p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${locationEnabled && !usingDefault ? 'text-white' : 'text-white/60'}`}
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : locationEnabled && !usingDefault ? (
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <MapPinOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{locationEnabled && !usingDefault ? t('location.usingYours', 'Using your location') : t('location.usingDefault', 'Using default location (Berlin)')}</p>
                  <p className="text-xs text-muted-foreground">{t('location.clickTo', 'Click to')} {locationEnabled ? t('location.disable', 'disable') : t('location.enable', 'enable')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <button 
              className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={toggleDarkMode}
              data-testid="button-theme-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 safe-area-bottom">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5 lg:space-y-7">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] shadow-xl shadow-gray-900/15">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              <div className="absolute top-0 right-0 w-24 sm:w-48 h-24 sm:h-48 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                      {t('stats.level', { level })}
                    </span>
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {streak} {t('sidebar.streak', 'day streak')}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-white truncate">
                    {isNewUser 
                      ? t('welcome.newUser', { name: displayName }) 
                      : t('welcome.returningUser', { name: displayName })}
                  </h1>
                  <p className="text-white/80 text-xs sm:text-sm font-medium">
                    {isNewUser ? t('welcome.newUserSubtitle') : t('welcome.returningUserSubtitle')}
                  </p>
                </div>
                <div className="hidden sm:flex w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl items-center justify-center shadow-xl flex-shrink-0 ml-3">
                  <img src={logomarkViolet} alt="Loretta mascot" className="w-7 h-7 sm:w-8 sm:h-8 object-contain brightness-0 invert" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
              <Link href="/leaderboard">
                <GlassCard className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-xs sm:text-xl font-black text-gray-900 dark:text-white truncate">+{totalXpToday}</div>
                    <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{t('sidebar.xpToday', 'XP Today')}</div>
                  </div>
                </GlassCard>
              </Link>
              
              <Link href="/streak">
                <GlassCard className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Flame className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-xs sm:text-xl font-black text-gray-900 dark:text-white truncate">{streak}d</div>
                    <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{t('sidebar.streakLabel', 'Streak')}</div>
                  </div>
                </GlassCard>
              </Link>
              
              <Link href="/mission-details">
                <GlassCard className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-xs sm:text-xl font-black text-gray-900 dark:text-white truncate">{completedCount}/{activeMissions.length}</div>
                    <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{t('sidebar.missions', 'Missions')}</div>
                  </div>
                </GlassCard>
              </Link>
              
              <Link href="/leaderboard?tab=achievements">
                <GlassCard className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 hover:shadow-xl transition-shadow cursor-pointer h-full">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Trophy className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-xs sm:text-xl font-black text-gray-900 dark:text-white truncate">{userAchievements?.filter(a => a.unlocked).length || 0}</div>
                    <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{t('sidebar.achievements', 'Achievements')}</div>
                  </div>
                </GlassCard>
              </Link>
            </div>
            
            <div className="block">
              <Link href="/chat">
                <button className="w-full group">
                  <GlassCard className="p-4 sm:p-5 hover:shadow-2xl hover:shadow-gray-900/15 transition-all" glow>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#CDB6EF] via-purple-400 to-[#013DC4] flex items-center justify-center shadow-2xl shadow-gray-900/20 group-hover:scale-110 transition-transform flex-shrink-0">
                        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="font-black text-base sm:text-xl text-gray-900 dark:text-white group-hover:text-[#013DC4] transition-colors truncate">
                          {t('chat.speakToLoretta', 'Speak to Loretta')}
                        </h3>
                        <p className="text-gray-500 font-medium text-xs sm:text-base truncate">
                          {t('chat.speakToLorettaSubtitle', 'Get personalized health guidance and support')}
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 flex items-center justify-center group-hover:bg-[#013DC4] transition-all flex-shrink-0">
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#013DC4] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </GlassCard>
              </button>
            </Link>
            </div>
            
            {showSetupChecklist && (
              <AnimatePresence mode="sync">
                <motion.div
                  key="setup-checklist"
                  initial={{ opacity: 1, scale: 1, y: 0, height: 'auto' }}
                  animate={isChecklistClosing ? {
                    scale: [1, 1.02, 0.95],
                    opacity: [1, 1, 0],
                    y: [0, -10, -30],
                    height: ['auto', 'auto', 0],
                    marginBottom: [undefined, undefined, 0],
                  } : { opacity: 1, scale: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, y: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: isChecklistClosing ? 1.5 : 0.3, ease: "easeInOut" }}
                  style={{ overflow: 'hidden' }}
                >
                  <CollapsibleSectionNew
                    title={t('setup.title')}
                    icon={<Sparkles className="w-5 h-5" />}
                    badge={
                      isChecklistClosing ? (
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                          {t('setup.complete', 'Complete!')}
                        </span>
                      ) : (
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs font-bold rounded-full shadow-lg">
                          {completedStepsCount}/{setupSteps.length}
                        </span>
                      )
                    }
                    gradient
                  >
                    <div className="space-y-4">
                      <div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full shadow-lg transition-all ${
                            isChecklistClosing 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                              : 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF]'
                          }`}
                          style={{ width: `${setupProgress}%` }}
                        />
                      </div>
                      <p className={`text-sm font-medium ${isChecklistClosing ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {isChecklistClosing ? t('setup.congratulations', 'Congratulations! You\'re all set up!') : (setupProgress === 100 ? t('setup.allDone') : t('setup.stepsToUnlock'))}
                      </p>
                      
                      <div className="space-y-3">
                        <Link href="/onboarding">
                          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            consentComplete 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10' 
                              : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg cursor-pointer'
                          }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                              consentComplete 
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                            }`}>
                              {consentComplete ? <Check className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${consentComplete ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {t('setup.consent')}
                              </p>
                            </div>
                            {consentComplete ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">{t('setup.done')}</span>
                            ) : (
                              <span className="px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">+10 XP</span>
                            )}
                          </div>
                        </Link>
                        
                        <Link href="/profile">
                          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            profileComplete 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10' 
                              : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg cursor-pointer'
                          }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                              profileComplete 
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                            }`}>
                              {profileComplete ? <Check className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${profileComplete ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {t('setup.profile')}
                              </p>
                            </div>
                            {profileComplete ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">{t('setup.done')}</span>
                            ) : (
                              <span className="px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">+25 XP</span>
                            )}
                          </div>
                        </Link>
                        
                        <Link href="/onboarding">
                          <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            questionnaireComplete 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10' 
                              : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg cursor-pointer'
                          }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                              questionnaireComplete 
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                            }`}>
                              {questionnaireComplete ? <Check className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${questionnaireComplete ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {t('setup.questionnaire')}
                              </p>
                            </div>
                            {questionnaireComplete ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">{t('setup.done')}</span>
                            ) : (
                              <span className="px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">+50 XP</span>
                            )}
                          </div>
                        </Link>
                        
                        <div 
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            firstCheckInComplete 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10' 
                              : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg cursor-pointer'
                          }`}
                          onClick={() => !firstCheckInComplete && setShowCheckInModal(true)}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                            firstCheckInComplete 
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                              : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400'
                          }`}>
                            {firstCheckInComplete ? <Check className="w-5 h-5 text-white" /> : <Heart className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${firstCheckInComplete ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {t('setup.checkin')}
                            </p>
                          </div>
                          {firstCheckInComplete ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">{t('setup.done')}</span>
                          ) : (
                            <span className="px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full">+15 XP</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSectionNew>
                </motion.div>
              </AnimatePresence>
            )}
            
            {showLeaderboard ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7">
                <Link href={`/leaderboard?community=${communityType}`} className="block">
                  <div className="cursor-pointer hover:scale-[1.01] transition-transform">
                    <CollapsibleSectionNew
                      title={t('sidebar.leaderboard')}
                      icon={<Users className="w-5 h-5" />}
                      defaultOpen={true}
                    >
                      <Leaderboard communityType={communityType} />
                    </CollapsibleSectionNew>
                  </div>
                </Link>
                <Link href="/leaderboard?tab=achievements" className="block">
                  <div className="cursor-pointer hover:scale-[1.01] transition-transform">
                    <CollapsibleSectionNew
                      title={t('achievements.title')}
                      icon={<Trophy className="w-5 h-5" />}
                      defaultOpen={true}
                    >
                  <div className="grid grid-cols-1 gap-3 lg:gap-4">
                    {userAchievements && userAchievements.length > 0 ? (
                      userAchievements.slice(0, 6).map((achievement) => (
                        <AchievementBadge
                          key={achievement.id}
                          title={achievement.title}
                          description={achievement.description}
                          icon={achievement.icon as any}
                          unlocked={achievement.unlocked}
                          rarity={achievement.rarity}
                          unlockedDate={achievement.unlockedAt ? format(new Date(achievement.unlockedAt), 'MMM d, yyyy') : undefined}
                          progress={achievement.unlocked ? undefined : achievement.progress}
                          maxProgress={achievement.unlocked ? undefined : achievement.maxProgress}
                        />
                      ))
                    ) : (
                      <>
                        <AchievementBadge
                          title={t('achievements.firstSteps.title')}
                          description={t('achievements.firstSteps.description')}
                          icon="target"
                          unlocked={streak >= 1}
                          rarity="common"
                          unlockedDate={streak >= 1 ? t('achievements.recently') : undefined}
                        />
                        <AchievementBadge
                          title={t('achievements.weekWarrior.title')}
                          description={t('achievements.weekWarrior.description')}
                          icon="flame"
                          unlocked={streak >= 7}
                          rarity="rare"
                          unlockedDate={streak >= 7 ? t('achievements.recently') : undefined}
                          progress={streak >= 7 ? undefined : streak}
                          maxProgress={streak >= 7 ? undefined : 7}
                        />
                        <AchievementBadge
                          title={t('achievements.healthChampion.title')}
                          description={t('achievements.healthChampion.description')}
                          icon="crown"
                          unlocked={level >= 15}
                          progress={level >= 15 ? undefined : level}
                          maxProgress={level >= 15 ? undefined : 15}
                          rarity="epic"
                        />
                      </>
                    )}
                  </div>
                    </CollapsibleSectionNew>
                  </div>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-7">
                  <Link href="/risk-score" className="block">
                    <div className="cursor-pointer hover:scale-[1.01] transition-transform">
                      <CollapsibleSectionNew
                        title={t('riskScore.title')}
                        icon={<Heart className="w-5 h-5" />}
                        defaultOpen={true}
                      >
                        <div className="flex flex-col items-center justify-center w-full py-2 sm:py-4">
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 sm:mb-6">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                              <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${Math.round(riskScore) * 2.51} 251`}
                              />
                              <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor={riskScore <= 30 ? "#22C55E" : riskScore <= 60 ? "#F59E0B" : "#EF4444"} />
                                  <stop offset="100%" stopColor={riskScore <= 30 ? "#10B981" : riskScore <= 60 ? "#D97706" : "#DC2626"} />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{Math.round(riskScore)}</span>
                              <span className={`text-xs sm:text-sm font-bold ${riskColor}`}>{riskLevel}</span>
                            </div>
                          </div>
                          
                          {!questionnaireComplete && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-300 text-xs sm:text-sm mb-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>{t('riskScore.incompleteDisclaimer', 'Complete your health questionnaire for a more accurate score')}</span>
                            </div>
                          )}
                          
                          <div className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base text-[#013DC4] font-bold hover:bg-[#013DC4]/5 rounded-xl flex items-center gap-1 justify-center min-h-[48px] transition-all">
                            {t('riskScore.viewDetails', 'View Details')} <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        </div>
                      </CollapsibleSectionNew>
                    </div>
                  </Link>
                  
                  <CollapsibleSectionNew
                    title={t('checkin.title', 'Daily Check-In')}
                    icon={<Smile className="w-5 h-5" />}
                    defaultOpen={true}
                    badge={
                      allEmotionalCheckins && allEmotionalCheckins.length > 0 ? (
                        <span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#CDB6EF] to-purple-400 text-white text-xs font-bold rounded-full shadow-lg">
                          {allEmotionalCheckins.length}
                        </span>
                      ) : null
                    }
                  >
                    <div className="space-y-4">
                      <button 
                        onClick={() => setShowCheckInModal(true)}
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-gray-900/20 transition-all hover:scale-[1.02] min-h-[48px]"
                      >
                        {t('checkin.startButton', 'Start Check-in')} (+10 XP)
                      </button>
                      
                      {allEmotionalCheckins && allEmotionalCheckins.length > 0 && (
                        <div className="bg-gradient-to-br from-[#CDB6EF]/10 to-[#D2EDFF]/10 rounded-2xl p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('checkin.subtitle')}</p>
                          <div className="space-y-2">
                            {allEmotionalCheckins.slice(0, 3).map((checkin) => {
                              const data = formatCheckinData(checkin);
                              return (
                                <div key={data.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all">
                                  <span className="text-2xl">{data.emoji}</span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">{data.emotion}</p>
                                    <p className="text-xs text-gray-500">{data.dateStr}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSectionNew>
                </div>
                
                <CollapsibleSectionNew
                  title={t('missions.title')}
                  icon={<Flame className="w-5 h-5" />}
                  defaultOpen={true}
                  badge={
                    activeMissions.length > 0 ? (
                      <span className="ml-2 px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold rounded-full shadow-lg">
                        {activeMissions.length}
                      </span>
                    ) : null
                  }
                >
                  <div className="space-y-4">
                    {activeMissions.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 mb-3">{t('missions.noActive')}</p>
                        <Link href="/mission-details">
                          <button className="px-4 py-2 border-2 border-[#013DC4] text-[#013DC4] rounded-xl font-bold hover:bg-[#013DC4] hover:text-white transition-all">
                            {t('missions.activate')}
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        {activeMissions.slice(0, 3).map((mission: any) => (
                          <Link key={mission.id} href={`/mission-details?id=${mission.missionKey}`}>
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all cursor-pointer">
                              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] sm:text-xs text-[#013DC4] font-bold uppercase tracking-wider">{mission.category}</span>
                                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">{mission.title}</h4>
                                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{mission.description}</p>
                                </div>
                                <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-[#013DC4] text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap flex-shrink-0">
                                  +{mission.xpReward} XP
                                </span>
                              </div>
                              <div className="h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all"
                                  style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                    
                    <Link href="/mission-details">
                      <button className="w-full py-3 border-2 border-[#013DC4] text-[#013DC4] rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-gradient-to-r hover:from-[#013DC4] hover:to-[#0150FF] hover:text-white hover:border-transparent transition-all min-h-[48px]" data-testid="button-view-all-quests">
                        {t('missions.viewAll')}
                      </button>
                    </Link>
                  </div>
                </CollapsibleSectionNew>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-7">
                  <Link href={`/leaderboard?community=${communityType}`} className="block">
                    <div className="cursor-pointer hover:scale-[1.01] transition-transform">
                      <CollapsibleSectionNew
                        title={t('sidebar.leaderboard')}
                        icon={<Users className="w-5 h-5" />}
                        defaultOpen={true}
                      >
                        <Leaderboard communityType={communityType} />
                      </CollapsibleSectionNew>
                    </div>
                  </Link>
                  
                  <CollapsibleSectionNew
                  title={t('medications.title')}
                  icon={<Pill className="w-5 h-5" />}
                  defaultOpen={true}
                  badge={
                    medications.length > 0 ? (
                      <span className="ml-2 px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs font-bold rounded-full shadow-lg">
                        {medications.length}
                      </span>
                    ) : null
                  }
                >
                  {medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.slice(0, 3).map((med: any) => (
                        <Link key={med.id} href={`/medication-details?id=${med.id}`}>
                          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{med.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{med.dosage}</p>
                              </div>
                              <div className={`px-2 py-1 rounded-full font-bold text-xs flex-shrink-0 ${
                                (med.adherencePercent ?? 100) >= 90 
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 text-green-600' 
                                  : 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 text-amber-600'
                              }`}>
                                {med.adherencePercent ?? 100}%
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {groupMedicationTimes(med.scheduledTimes || []).map((group, j) => (
                                <div key={j} className="flex items-center gap-1">
                                  {group.label !== 'Daily' && (
                                    <span className="px-1.5 py-0.5 bg-[#013DC4] text-white text-[10px] font-bold rounded-md">
                                      {group.label}
                                    </span>
                                  )}
                                  {group.times.map((time, k) => (
                                    <span key={k} className="px-2 py-1 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-[#013DC4] text-xs font-semibold rounded-lg">
                                      {time}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                      <button 
                        onClick={() => setShowAddMedicationModal(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 rounded-xl font-bold text-sm hover:border-[#013DC4] hover:text-[#013DC4] hover:bg-[#013DC4]/5 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                        data-testid="button-add-medication"
                      >
                        <Pill className="w-4 h-4" />
                        {t('medications.addMedication', 'Add Medication')}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 text-center rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <Pill className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-gray-400 mb-2 sm:mb-3" />
                      <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
                        {t('medications.noMedications', 'No medications tracked yet')}
                      </p>
                      <button
                        onClick={() => setShowAddMedicationModal(true)}
                        className="px-4 sm:px-6 py-3 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white rounded-xl font-bold text-sm sm:text-base hover:shadow-lg transition-all min-h-[48px]"
                        data-testid="button-add-first-medication"
                      >
                        <Pill className="w-4 h-4 inline mr-2" />
                        {t('medications.addFirstMedication', 'Add Your First Medication')}
                      </button>
                    </div>
                  )}
                  </CollapsibleSectionNew>
                </div>
                
                {!isNewUser && (
                  <CollapsibleSectionNew
                    title={t('healthScience.title', 'Health Science')}
                    icon={<BookOpen className="w-5 h-5" />}
                    defaultOpen={false}
                  >
                    <HealthScienceSection category="activity" />
                  </CollapsibleSectionNew>
                )}
              </>
            )}
            
            <p className="text-sm text-gray-400 text-center pb-6 font-medium">
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </main>
      
      <LevelUpModal
        open={showLevelUp}
        level={level}
        xpEarned={100}
        badges={['Health Explorer']}
        unlocks={['New features unlocked!']}
        onClose={() => setShowLevelUp(false)}
      />
      
      <EmotionalCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        userId={userId || ''}
        onCheckInComplete={handleCheckInComplete}
      />
      
      <AddMedicationModal
        open={showAddMedicationModal}
        onOpenChange={setShowAddMedicationModal}
      />
      
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] sm:max-h-[80vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">{privacyPolicyContent[policyLang].title}</DialogTitle>
            <DialogDescription className="text-sm">
              {privacyPolicyContent[policyLang].subtitle} | {policyLang === 'en' ? 'Effective' : 'Gültig ab'}: {privacyPolicyContent[policyLang].effectiveDate}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPolicyLang('en')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                policyLang === 'en' 
                  ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPolicyLang('de')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                policyLang === 'de' 
                  ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Deutsch
            </button>
          </div>
          <ScrollArea className="h-[50vh] sm:h-[60vh] pr-4">
            <div className="space-y-6 text-sm text-muted-foreground">
              {privacyPolicyContent[policyLang].sections.map((section: { title: string; content: string }, index: number) => (
                <div key={index}>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{section.title}</h3>
                  <p className="whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAccessibilityPolicy} onOpenChange={setShowAccessibilityPolicy}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] sm:max-h-[80vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black">{accessibilityPolicyContent[policyLang].title}</DialogTitle>
            <DialogDescription className="text-sm">
              {policyLang === 'en' ? 'Our commitment to accessible health technology' : 'Unser Engagement für barrierefreie Gesundheitstechnologie'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPolicyLang('en')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                policyLang === 'en' 
                  ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPolicyLang('de')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                policyLang === 'de' 
                  ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Deutsch
            </button>
          </div>
          <ScrollArea className="h-[50vh] sm:h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="whitespace-pre-line">{accessibilityPolicyContent[policyLang].content}</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
