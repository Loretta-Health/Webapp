import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Users, Moon, Sun, Menu, X, User, MessageCircle, QrCode, Shield, Accessibility, LogOut, Loader2, Sparkles, ClipboardList, Check, Activity, Trophy, BookOpen, Pill, Smile, ChevronRight, MapPin, MapPinOff } from 'lucide-react';
import { Footprints, Moon as MoonIcon, Heart, Flame } from 'lucide-react';
import CollapsibleSection from '@/components/CollapsibleSection';
import { Link, useLocation, Redirect } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import lorettaLogo from '@assets/logos/loretta_logo.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

import MascotCharacter from '@/components/MascotCharacter';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import XPProgress from '@/components/XPProgress';
import StreakCounter from '@/components/StreakCounter';
import RiskScoreCard from '@/components/RiskScoreCard';
import QuestCard from '@/components/QuestCard';
import DailyCheckIn from '@/components/DailyCheckIn';
import MedicationTracker from '@/components/MedicationTracker';
import ActivityMetric from '@/components/ActivityMetric';
import TreasureChest from '@/components/TreasureChest';
import Leaderboard from '@/components/Leaderboard';
import AchievementBadge from '@/components/AchievementBadge';
import LevelUpModal from '@/components/LevelUpModal';
import EnergyBar from '@/components/EnergyBar';
import HealthScienceSection from '@/components/HealthScienceSection';
import CommunitySelector, { type CommunityType } from '@/components/CommunitySelector';
import EmotionalCheckInModal from '@/components/EmotionalCheckInModal';
import AddMedicationModal from '@/components/AddMedicationModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMissions } from '@/hooks/useMissions';
import { useMedicationProgress } from '@/hooks/useMedicationProgress';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useWeatherSimulation } from '@/contexts/WeatherSimulationContext';
import { Switch } from '@/components/ui/switch';
import { CloudRain } from 'lucide-react';
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
  diabetesRisk: number;
  heartRisk: number;
  strokeRisk: number;
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

export default function MyDashboard() {
  const { t } = useTranslation('dashboard');
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityType, setCommunityType] = useState<CommunityType>('loretta');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAccessibilityPolicy, setShowAccessibilityPolicy] = useState(false);
  const { user, isLoading: isAuthLoading, logoutMutation } = useAuth();
  const { locationEnabled, toggleLocationEnabled, usingDefault, loading: locationLoading } = useGeolocation();
  const { simulateBadWeather, setSimulateBadWeather } = useWeatherSimulation();
  const userId = user?.id;
  const { activeMissions, completedCount, totalCount, completeMission } = useMissions();
  const { medications, getTotalProgress } = useMedicationProgress();
  const medicationProgress = getTotalProgress();
  const { progress: onboardingProgress, isConsentComplete, isQuestionnaireComplete } = useOnboardingProgress();
  
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

  const { data: preferencesData } = useQuery<{ consentGiven: boolean; consentDate: string | null }>({
    queryKey: ['/api/preferences'],
    enabled: !!user,
  });

  const { data: profileData } = useQuery<{ firstName: string | null; lastName: string | null; dateOfBirth: string | null }>({
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

  // Core question IDs that must be answered for questionnaire to be complete (must match Onboarding.tsx baseQuestions)
  const coreQuestionIds = [
    'blood_test_3_years', 'prescription_medicine', 'high_blood_pressure', 'general_health',
    'age', 'weight_current', 'height', 'high_cholesterol', 'daily_aspirin', 'prediabetes'
  ];
  
  // Check if all core questions have been answered
  const getSavedAnswerIds = (): string[] => {
    if (!Array.isArray(questionnaireData) || questionnaireData.length === 0) return [];
    const healthRecord = questionnaireData.find(r => r.category === 'health_risk_assessment');
    if (!healthRecord?.answers) return [];
    return Object.keys(healthRecord.answers);
  };
  
  const savedAnswerIds = getSavedAnswerIds();
  const allCoreQuestionsAnswered = coreQuestionIds.every(id => savedAnswerIds.includes(id));

  const consentComplete = isConsentComplete || preferencesData?.consentGiven === true;
  const profileComplete = !!(profileData?.firstName && profileData?.lastName) || !!(user?.firstName && user?.lastName && user?.email);
  const questionnaireComplete = isQuestionnaireComplete || allCoreQuestionsAnswered;
  const firstCheckInComplete = Array.isArray(allEmotionalCheckins) && allEmotionalCheckins.length > 0;
  
  const setupSteps = [
    { id: 'consent', complete: consentComplete },
    { id: 'profile', complete: profileComplete },
    { id: 'questionnaire', complete: questionnaireComplete },
    { id: 'checkin', complete: firstCheckInComplete },
  ];
  const completedStepsCount = setupSteps.filter(s => s.complete).length;
  const setupProgress = (completedStepsCount / setupSteps.length) * 100;
  const allSetupComplete = completedStepsCount === setupSteps.length;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/gamification/checkin`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    },
  });

  const addXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('POST', `/api/gamification/${userId}/xp`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    },
  });

  const xp = gamificationData?.xp ?? 0;
  const level = gamificationData?.level ?? 1;
  const streak = gamificationData?.currentStreak ?? 0;
  const lives = gamificationData?.lives ?? 5;
  const nextLevelXP = level * 100 + 200;
  
  const isNewUser = !allSetupComplete;
  const showSetupChecklist = !allSetupComplete;
  const displayName = profileData?.firstName || user?.firstName || user?.username || t('common.friend');
  
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
    queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
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

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 lg:w-80 
          bg-sidebar
          border-r border-sidebar-border 
          flex flex-col overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        data-testid="sidebar"
      >
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between lg:hidden">
            <img src={lorettaLogo} alt="Loretta" className="h-8 object-contain" data-testid="logo-loretta-mobile" />
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="hidden lg:flex justify-center mb-4">
            <img src={lorettaLogo} alt="Loretta" className="h-10 object-contain" data-testid="logo-loretta" />
          </div>
          
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <User className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div className="absolute -bottom-0 -right-0 w-6 h-6 lg:w-8 lg:h-8">
                <img 
                  src={mascotImage} 
                  alt="Health Mascot" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            </div>
            <h2 className="text-lg lg:text-xl font-black text-sidebar-foreground">{user.username}</h2>
            <p className="text-xs lg:text-sm text-muted-foreground mb-2">
              {isNewUser ? t('sidebar.newMember') : t('sidebar.healthExplorer', { level })}
            </p>
            <div className="flex justify-center">
              <StreakCounter days={streak} size="md" showLabel={true} />
            </div>
          </div>
          
          <Separator />
          
          <XPProgress currentXP={xp % nextLevelXP} nextLevelXP={nextLevelXP} level={level} />
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase">{t('sidebar.todaysProgress')}</h3>
            <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.xpEarned')}</span>
                <span className="font-bold text-sidebar-foreground">+{xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.quests')}</span>
                <span className="font-bold text-sidebar-foreground">{completedCount}/{totalCount} {t('sidebar.done')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sidebar.achievements')}</span>
                <span className="font-bold text-sidebar-foreground">{userAchievements?.filter(a => a.unlocked).length || 0} {t('sidebar.total')}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase mb-2 lg:mb-3">{t('sidebar.myCommunity')}</h3>
            <CommunitySelector value={communityType} onChange={setCommunityType} />
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-3">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase">{t('sidebar.navigation')}</h3>
            <Link href="/profile">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50"
                data-testid="button-profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mr-2">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">{t('sidebar.myProfile')}</span>
              </Button>
            </Link>
            <Link href="/chat">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-chart-2/10 to-chart-2/5 border-chart-2/30 hover:border-chart-2/50"
                data-testid="button-chat"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center mr-2">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">{t('sidebar.healthNavigator')}</span>
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-chart-3/10 to-chart-3/5 border-chart-3/30 hover:border-chart-3/50"
                data-testid="button-leaderboard"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-chart-3 to-yellow-500 flex items-center justify-center mr-2">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">{t('sidebar.leaderboard')}</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-sm bg-gradient-to-r from-muted/50 to-muted/30 border-muted-foreground/30 hover:border-muted-foreground/50"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center mr-2">
                  <LogOut className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span className="font-bold text-muted-foreground">{t('sidebar.signOut')}</span>
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground justify-start p-0 h-auto"
              onClick={() => setShowPrivacyPolicy(true)}
              data-testid="button-privacy-policy"
            >
              <Shield className="w-3 h-3 mr-1" />
              {t('sidebar.privacyPolicy')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground justify-start p-0 h-auto"
              onClick={() => setShowAccessibilityPolicy(true)}
              data-testid="button-accessibility"
            >
              <Accessibility className="w-3 h-3 mr-1" />
              {t('sidebar.accessibility')}
            </Button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-primary via-primary to-chart-2 text-white p-2 sm:p-3 lg:p-4 flex items-center justify-between gap-1 sm:gap-2 lg:gap-4 shadow-lg">
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            <Button 
              size="icon" 
              variant="ghost"
              className="lg:hidden w-8 h-8 sm:w-10 sm:h-10"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {!isNewUser && (
              <Badge variant="secondary" className="font-bold text-[10px] sm:text-xs lg:text-sm px-1.5 sm:px-2" data-testid="user-rank">
                {t('stats.level', { level })}
              </Badge>
            )}
            <LanguageSwitcher />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={toggleLocationEnabled}
                    disabled={locationLoading}
                    data-testid="button-location-toggle"
                    className={`w-8 h-8 sm:w-10 sm:h-10 ${locationEnabled && !usingDefault ? 'text-white' : 'text-white/60'}`}
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : locationEnabled && !usingDefault ? (
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <MapPinOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{locationEnabled && !usingDefault ? t('location.usingYours', 'Using your location') : t('location.usingDefault', 'Using default location (Berlin)')}</p>
                  <p className="text-xs text-muted-foreground">{t('location.clickTo', 'Click to')} {locationEnabled ? t('location.disable', 'disable') : t('location.enable', 'enable')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg bg-white/10">
              <CloudRain className={`w-3 h-3 sm:w-4 sm:h-4 ${simulateBadWeather ? 'text-amber-400' : 'text-white/60'}`} />
              <span className="text-[10px] sm:text-xs text-white/80 hidden sm:inline">{t('weather.simulateBadWeather', 'Simulate Bad Weather')}</span>
              <Switch
                checked={simulateBadWeather}
                onCheckedChange={setSimulateBadWeather}
                data-testid="switch-weather-simulation"
                className="data-[state=checked]:bg-amber-500 scale-75 sm:scale-100"
              />
            </div>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={toggleDarkMode}
              data-testid="button-theme-toggle"
              className="w-8 h-8 sm:w-10 sm:h-10"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 rounded-xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black text-foreground mb-1">
                    {isNewUser 
                      ? t('welcome.newUser', { name: displayName }) 
                      : t('welcome.returningUser', { name: displayName })}
                  </h1>
                  <p className="text-sm lg:text-lg text-muted-foreground">
                    {isNewUser ? t('welcome.newUserSubtitle') : t('welcome.returningUserSubtitle')}
                  </p>
                </div>
                <MascotCharacter size="sm" pose={isNewUser ? "encourage" : "celebrate"} className="hidden sm:block" />
              </div>
            </div>
            
            {/* Speak to Loretta Button */}
            <Link href="/chat">
              <Card className="bg-gradient-to-r from-chart-2/20 via-emerald-500/10 to-primary/20 border-chart-2/30 hover:border-chart-2/50 transition-all hover:shadow-lg cursor-pointer group">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-chart-2 transition-colors">
                        {t('chat.speakToLoretta', 'Speak to Loretta')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('chat.speakToLorettaSubtitle', 'Get personalized health guidance and support')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-chart-2 transition-colors" />
                </div>
              </Card>
            </Link>
            
            {showSetupChecklist && (
              <CollapsibleSection
                title={t('setup.title')}
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                defaultOpen={true}
                badge={
                  <Badge variant="secondary" className="ml-2 font-bold text-xs">
                    {t('setup.progress', { completed: completedStepsCount, total: setupSteps.length })}
                  </Badge>
                }
              >
                <div className="space-y-4">
                  <div>
                    <Progress value={setupProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {setupProgress === 100 ? t('setup.allDone') : t('setup.stepsToUnlock')}
                    </p>
                  </div>
                      
                  <div className="space-y-3">
                        <Link href="/onboarding">
                          <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            consentComplete 
                              ? 'bg-chart-2/10 border-chart-2/30' 
                              : 'bg-card border-border hover:border-primary/50'
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              consentComplete ? 'bg-chart-2 text-white' : 'bg-chart-2/20'
                            }`}>
                              {consentComplete ? <Check className="w-4 h-4" /> : <Shield className="w-4 h-4 text-chart-2" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${consentComplete ? 'line-through text-muted-foreground' : ''}`}>
                                {t('setup.consent')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {consentComplete ? t('setup.consentComplete') : t('setup.consentPending')}
                              </p>
                            </div>
                            {consentComplete ? (
                              <Badge className="bg-chart-2 text-white border-0">{t('setup.done')}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-chart-2 border-chart-2">+10 XP</Badge>
                            )}
                          </div>
                        </Link>
                        
                        <Link href="/profile">
                          <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            profileComplete 
                              ? 'bg-chart-3/10 border-chart-3/30' 
                              : 'bg-card border-border hover:border-primary/50'
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              profileComplete ? 'bg-chart-3 text-white' : 'bg-chart-3/20'
                            }`}>
                              {profileComplete ? <Check className="w-4 h-4" /> : <User className="w-4 h-4 text-chart-3" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${profileComplete ? 'line-through text-muted-foreground' : ''}`}>
                                {t('setup.profile')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profileComplete ? t('setup.profileComplete') : t('setup.profilePending')}
                              </p>
                            </div>
                            {profileComplete ? (
                              <Badge className="bg-chart-3 text-white border-0">{t('setup.done')}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-chart-3 border-chart-3">+25 XP</Badge>
                            )}
                          </div>
                        </Link>
                        
                        <Link href="/onboarding">
                          <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            questionnaireComplete 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-card border-border hover:border-primary/50'
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              questionnaireComplete ? 'bg-primary text-white' : 'bg-primary/20'
                            }`}>
                              {questionnaireComplete ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${questionnaireComplete ? 'line-through text-muted-foreground' : ''}`}>
                                {t('setup.questionnaire')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {questionnaireComplete ? t('setup.questionnaireComplete') : t('setup.questionnairePending')}
                              </p>
                            </div>
                            {questionnaireComplete ? (
                              <Badge className="bg-primary text-white border-0">{t('setup.done')}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-primary border-primary">+50 XP</Badge>
                            )}
                          </div>
                        </Link>
                        
                        <div 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            firstCheckInComplete 
                              ? 'bg-destructive/10 border-destructive/30' 
                              : 'bg-card border-border hover:border-primary/50'
                          }`}
                          onClick={() => !firstCheckInComplete && setShowCheckInModal(true)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            firstCheckInComplete ? 'bg-destructive text-white' : 'bg-destructive/20'
                          }`}>
                            {firstCheckInComplete ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4 text-destructive" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${firstCheckInComplete ? 'line-through text-muted-foreground' : ''}`}>
                              {t('setup.checkin')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {firstCheckInComplete ? t('setup.checkinComplete') : t('setup.checkinPending')}
                            </p>
                          </div>
                          {firstCheckInComplete ? (
                            <Badge className="bg-destructive text-white border-0">{t('setup.done')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive">+15 XP</Badge>
                          )}
                        </div>
                  </div>
                      
                  <p className="text-xs text-muted-foreground italic">
                    {allSetupComplete 
                      ? t('setup.completedAll') 
                      : t('setup.unlockLeaderboard')}
                  </p>
                </div>
              </CollapsibleSection>
            )}
            
            {showLeaderboard ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <CollapsibleSection
                  title={t('sidebar.leaderboard')}
                  icon={<Users className="w-5 h-5 text-chart-3" />}
                  defaultOpen={true}
                >
                  <Leaderboard communityType={communityType} />
                </CollapsibleSection>
                <CollapsibleSection
                  title={t('achievements.title')}
                  icon={<Trophy className="w-5 h-5 text-yellow-500" />}
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
                </CollapsibleSection>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <CollapsibleSection
                    title={t('riskScore.title')}
                    icon={<Heart className="w-5 h-5 text-destructive" />}
                    defaultOpen={true}
                  >
                    <RiskScoreCard
                      score={riskScoreData?.overallScore ?? 50}
                      trend="stable"
                      message={riskScoreData ? t('riskScore.subtitle') : t('riskScore.notAvailable')}
                    />
                  </CollapsibleSection>
                  
                  <CollapsibleSection
                    title={t('checkin.title', 'Daily Check-In')}
                    icon={<Smile className="w-5 h-5 text-chart-2" />}
                    defaultOpen={true}
                    badge={
                      allEmotionalCheckins && allEmotionalCheckins.length > 0 ? (
                        <Badge variant="secondary" className="ml-2 font-bold text-xs">
                          {allEmotionalCheckins.length}
                        </Badge>
                      ) : null
                    }
                  >
                    <div className="space-y-3 lg:space-y-4">
                      <DailyCheckIn
                        streak={streak}
                        dayNumber={streak}
                        xpReward={50}
                        onStart={() => setShowCheckInModal(true)}
                      />
                      
                      {allEmotionalCheckins && allEmotionalCheckins.length > 0 && (
                        <Card className="bg-gradient-to-br from-chart-2/20 via-primary/10 to-secondary/20 border-0 shadow-lg overflow-hidden">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {t('checkin.subtitle')}
                              </p>
                              <span className="text-xs text-muted-foreground">{allEmotionalCheckins.length}</span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                              {allEmotionalCheckins.slice(0, 3).map((checkin) => {
                                const data = formatCheckinData(checkin);
                                return (
                                  <div key={data.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                                    <span className="text-lg">{data.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{data.emotion}</p>
                                      <p className="text-xs text-muted-foreground">{data.dateStr}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6">
                  <CollapsibleSection
                    title={t('missions.title')}
                    icon={<Flame className="w-5 h-5 text-primary" />}
                    defaultOpen={true}
                    badge={
                      activeMissions.length > 0 ? (
                        <Badge variant="secondary" className="ml-2 font-bold text-xs">
                          {activeMissions.length}
                        </Badge>
                      ) : null
                    }
                  >
                    <div className="space-y-3">
                      {activeMissions.length === 0 ? (
                        <Card className="p-6 text-center border-dashed">
                          <p className="text-muted-foreground mb-3">{t('missions.noActive')}</p>
                          <Link href="/mission-details">
                            <Button variant="outline" size="sm">
                              {t('missions.activate')}
                            </Button>
                          </Link>
                        </Card>
                      ) : (
                        <>
                          {activeMissions.slice(0, 3).map((mission: any) => (
                            <QuestCard
                              key={mission.id}
                              title={mission.title}
                              description={mission.description}
                              category={mission.category}
                              xpReward={mission.xpReward}
                              progress={mission.progress}
                              maxProgress={mission.maxProgress}
                              completed={mission.completed}
                              legendary={mission.legendary}
                              href={mission.href}
                              onComplete={() => handleCompleteQuest(mission.id, mission.xpReward)}
                            />
                          ))}
                        </>
                      )}
                      <Link href="/mission-details">
                        <Button variant="outline" className="w-full" data-testid="button-view-all-quests">
                          {t('missions.viewAll')}
                        </Button>
                      </Link>
                    </div>
                  </CollapsibleSection>
                  
                  {/* Today's Activity section - hidden until ready
                  <CollapsibleSection
                    title={t('activity.title')}
                    icon={<Activity className="w-5 h-5 text-chart-2" />}
                    defaultOpen={true}
                  >
                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                      <ActivityMetric
                        title={t('activityMetrics.steps.title')}
                        value={activityData?.steps ?? 0}
                        goal={(activityData?.stepsGoal ?? 10000).toLocaleString()}
                        unit={t('activity.steps').toLowerCase()}
                        icon={Footprints}
                        progress={Math.min(100, Math.round(((activityData?.steps ?? 0) / (activityData?.stepsGoal ?? 10000)) * 100))}
                        color="text-chart-1"
                        explanation={t('activityMetrics.steps.explanation')}
                        simpleExplanation={t('activityMetrics.steps.explanation')}
                        href="/activity?type=steps"
                      />
                      <ActivityMetric
                        title={t('activityMetrics.sleep.title')}
                        value={activityData?.sleepHours ?? 0}
                        goal={`${activityData?.sleepGoal ?? 8}h`}
                        unit={t('activity.sleep').toLowerCase()}
                        icon={MoonIcon}
                        progress={Math.min(100, Math.round(((activityData?.sleepHours ?? 0) / (activityData?.sleepGoal ?? 8)) * 100))}
                        color="text-chart-2"
                        explanation={t('activityMetrics.sleep.explanation')}
                        simpleExplanation={t('activityMetrics.sleep.simpleExplanation')}
                        href="/activity?type=sleep"
                      />
                      <ActivityMetric
                        title={t('activityMetrics.heartRate.title')}
                        value={activityData?.heartRate ?? 0}
                        goal="60-100"
                        unit="bpm"
                        icon={Heart}
                        progress={activityData?.heartRate ? (activityData.heartRate >= 60 && activityData.heartRate <= 100 ? 100 : 50) : 0}
                        color="text-destructive"
                        explanation={t('activityMetrics.heartRate.explanation')}
                        simpleExplanation={t('activityMetrics.heartRate.simpleExplanation')}
                        href="/activity?type=heartRate"
                      />
                      <ActivityMetric
                        title={t('activityMetrics.calories.title')}
                        value={activityData?.calories ?? 0}
                        goal={(activityData?.caloriesGoal ?? 2000).toLocaleString()}
                        unit="cal"
                        icon={Flame}
                        progress={Math.min(100, Math.round(((activityData?.calories ?? 0) / (activityData?.caloriesGoal ?? 2000)) * 100))}
                        color="text-chart-3"
                        explanation={t('activityMetrics.calories.explanation')}
                        simpleExplanation={t('activityMetrics.calories.explanation')}
                        href="/activity?type=calories"
                      />
                    </div>
                  </CollapsibleSection>
                  */}
                </div>
                
                <CollapsibleSection
                  title={t('medications.title')}
                  icon={<Pill className="w-5 h-5 text-primary" />}
                  defaultOpen={true}
                  className="mt-6"
                  badge={
                    medications.length > 0 ? (
                      <Badge variant="secondary" className="ml-2 font-bold text-xs">
                        {medications.length}
                      </Badge>
                    ) : null
                  }
                >
                  {medications.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {medications.slice(0, 4).map((med: any) => (
                          <MedicationTracker
                            key={med.id}
                            medicationId={med.id}
                            name={med.name}
                            dosage={med.dosage}
                            scheduledTimes={med.scheduledTimes || []}
                            notes={med.notes}
                            frequency={med.frequency}
                            adherencePercent={med.adherencePercent ?? 100}
                            explanation={med.explanation || t('medications.defaultExplanation')}
                            simpleExplanation={med.simpleExplanation || t('medications.defaultSimpleExplanation')}
                          />
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMedicationModal(true)}
                        className="w-full"
                        data-testid="button-add-medication"
                      >
                        <Pill className="w-4 h-4 mr-2" />
                        {t('medications.addMedication', 'Add Medication')}
                      </Button>
                    </div>
                  ) : (
                    <Card className="p-6 text-center bg-muted/30 border-dashed">
                      <Pill className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">
                        {t('medications.noMedications', 'No medications tracked yet')}
                      </p>
                      <Button
                        onClick={() => setShowAddMedicationModal(true)}
                        className="bg-gradient-to-r from-primary to-chart-2 font-bold"
                        data-testid="button-add-first-medication"
                      >
                        <Pill className="w-4 h-4 mr-2" />
                        {t('medications.addFirstMedication', 'Add Your First Medication')}
                      </Button>
                    </Card>
                  )}
                </CollapsibleSection>
                
                {!isNewUser && (
                  <CollapsibleSection
                    title={t('healthScience.title', 'Health Science')}
                    icon={<BookOpen className="w-5 h-5 text-chart-3" />}
                    defaultOpen={false}
                    className="mt-6"
                  >
                    <HealthScienceSection category="activity" />
                  </CollapsibleSection>
                )}
              </>
            )}
            
            <p className="text-xs text-muted-foreground text-center pb-4 italic">
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{t('dialogs.privacyPolicy')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.privacyDescription')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>{t('dialogs.privacyContent1')}</p>
              <p>{t('dialogs.privacyContent2')}</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAccessibilityPolicy} onOpenChange={setShowAccessibilityPolicy}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Inclusion & Accessibility Statement</DialogTitle>
            <DialogDescription>
              Our commitment to making Loretta accessible to everyone.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Loretta is designed with accessibility in mind, supporting screen readers and keyboard navigation.</p>
              <p>We continuously work to improve our accessibility standards.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
