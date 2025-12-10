import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Users, Moon, Sun, Menu, X, User, MessageCircle, QrCode, Shield, Accessibility, LogOut, Loader2, Sparkles, ClipboardList, Check } from 'lucide-react';
import { Footprints, Moon as MoonIcon, Heart, Flame } from 'lucide-react';
import { Link, useLocation, Redirect } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import lorettaLogo from '@assets/logos/loretta_logo.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

import MascotCharacter from '@/components/MascotCharacter';
import XPProgress from '@/components/XPProgress';
import StreakCounter from '@/components/StreakCounter';
import LivesIndicator from '@/components/LivesIndicator';
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
import { useMissions } from '@/hooks/useMissions';
import { useMedicationProgress } from '@/hooks/useMedicationProgress';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
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

export default function MyDashboard() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityType, setCommunityType] = useState<CommunityType>('loretta');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAccessibilityPolicy, setShowAccessibilityPolicy] = useState(false);
  const { user, isLoading: isAuthLoading, logoutMutation } = useAuth();
  const userId = user?.id;
  const { missions, completedCount, totalCount, completeMission } = useMissions();
  const { medications, getTotalProgress } = useMedicationProgress();
  const medicationProgress = getTotalProgress();
  const { progress: onboardingProgress, isConsentComplete, isQuestionnaireComplete } = useOnboardingProgress();
  
  const { data: gamificationData } = useQuery<GamificationData>({
    queryKey: ['/api/gamification', userId],
    enabled: !!userId && !!user,
  });

  const { data: riskScoreData } = useQuery<RiskScoreData>({
    queryKey: ['/api/risk-scores', userId, 'latest'],
    enabled: !!userId && !!user,
  });

  const { data: allEmotionalCheckins } = useQuery<EmotionalCheckinData[]>({
    queryKey: ['/api/emotional-checkins', userId],
    enabled: !!userId && !!user,
  });

  const { data: preferencesData } = useQuery<{ consentGiven: boolean; consentDate: string | null }>({
    queryKey: ['/api/preferences', userId],
    enabled: !!userId && !!user,
  });

  const { data: profileData } = useQuery<{ firstName: string | null; lastName: string | null; dateOfBirth: string | null }>({
    queryKey: ['/api/profile', userId],
    enabled: !!userId && !!user,
  });

  const { data: questionnaireData } = useQuery<{ category: string; answers: Record<string, string> }[]>({
    queryKey: ['/api/questionnaires', userId],
    enabled: !!userId && !!user,
  });

  const { data: activityData } = useQuery<ActivityData>({
    queryKey: ['/api/activities', userId, 'today'],
    enabled: !!userId && !!user,
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
      return apiRequest('POST', `/api/gamification/${userId}/checkin`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
    },
  });

  const addXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('POST', `/api/gamification/${userId}/xp`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
    },
  });

  const xp = gamificationData?.xp ?? 0;
  const level = gamificationData?.level ?? 1;
  const streak = gamificationData?.currentStreak ?? 0;
  const lives = gamificationData?.lives ?? 5;
  const nextLevelXP = level * 100 + 200;
  
  const isNewUser = !allSetupComplete;
  const showSetupChecklist = !allSetupComplete;
  const displayName = profileData?.firstName || user?.firstName || user?.username || 'Friend';
  
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
    queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
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
      dateStr = `at ${time}`;
    } else if (isYesterday(date)) {
      dateStr = `yesterday at ${time}`;
    } else {
      dateStr = `on ${format(date, 'MMM d')} at ${time}`;
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
          <p className="text-muted-foreground">Loading...</p>
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
          bg-gradient-to-b from-sidebar via-sidebar to-primary/10
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
            <p className="text-xs lg:text-sm text-muted-foreground">
              {isNewUser ? 'New Member' : `Level ${level} Health Explorer`}
            </p>
          </div>
          
          <Separator />
          
          <XPProgress currentXP={xp % nextLevelXP} nextLevelXP={nextLevelXP} level={level} />
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <StreakCounter days={streak} size="md" showLabel={false} />
            <LivesIndicator current={lives} max={5} size="md" />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase">Today's Progress</h3>
            <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="font-bold text-sidebar-foreground">+{xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quests</span>
                <span className="font-bold text-sidebar-foreground">{completedCount}/{totalCount} Done</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Achievements</span>
                <span className="font-bold text-sidebar-foreground">{gamificationData?.achievements?.length || 0} Total</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase mb-2 lg:mb-3">My Community</h3>
            <CommunitySelector value={communityType} onChange={setCommunityType} />
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-3">
            <h3 className="text-xs lg:text-sm font-bold text-sidebar-foreground uppercase">Navigation</h3>
            <Link href="/profile">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50"
                data-testid="button-profile"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mr-2">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">My Profile</span>
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
                <span className="font-bold">Health Navigator</span>
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
                <span className="font-bold">Leaderboard</span>
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
              <span className="font-bold text-muted-foreground">Sign Out</span>
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
              Privacy Policy
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground justify-start p-0 h-auto"
              onClick={() => setShowAccessibilityPolicy(true)}
              data-testid="button-accessibility"
            >
              <Accessibility className="w-3 h-3 mr-1" />
              Inclusion & Accessibility
            </Button>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-primary via-primary to-chart-2 text-white p-3 lg:p-4 flex items-center justify-between gap-2 lg:gap-4 shadow-lg">
          <div className="flex items-center gap-2 lg:gap-4">
            <Button 
              size="icon" 
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <TreasureChest canOpen={!isNewUser} />
            <EnergyBar current={isNewUser ? 100 : 85} max={100} className="flex-1 max-w-[120px] lg:max-w-xs" />
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
            {!isNewUser && (
              <Badge variant="secondary" className="font-bold text-xs lg:text-sm" data-testid="user-rank">
                Level {level}
              </Badge>
            )}
            <Button 
              size="icon" 
              variant="ghost"
              onClick={toggleDarkMode}
              data-testid="button-theme-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
            </Button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 rounded-xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black text-foreground mb-1">
                    {isNewUser ? `Welcome, ${displayName}!` : `Welcome back, ${displayName}!`}
                  </h1>
                  <p className="text-sm lg:text-lg text-muted-foreground">
                    {isNewUser ? "Let's get you started on your health journey!" : "You've made great progress today! Keep it up!"}
                  </p>
                </div>
                <MascotCharacter size="sm" pose={isNewUser ? "encourage" : "celebrate"} className="hidden sm:block" />
              </div>
            </div>
            
            {showSetupChecklist && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5">
                <div className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-black text-foreground">Setup Checklist</h2>
                        <Badge variant="secondary" className="font-bold">
                          {completedStepsCount}/{setupSteps.length} Complete
                        </Badge>
                      </div>
                      <div className="mb-4">
                        <Progress value={setupProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {setupProgress === 100 ? 'All done! Your dashboard is ready.' : 'Complete these steps to unlock your full dashboard experience'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Link href="/welcome">
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
                                Accept Privacy & Consent
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {consentComplete ? 'Completed' : 'Review and accept our privacy practices'}
                              </p>
                            </div>
                            {consentComplete ? (
                              <Badge className="bg-chart-2 text-white border-0">Done</Badge>
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
                                Set Up Your Profile
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {profileComplete ? 'Completed' : 'Add your details to personalize your experience'}
                              </p>
                            </div>
                            {profileComplete ? (
                              <Badge className="bg-chart-3 text-white border-0">Done</Badge>
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
                                Complete Health Questionnaire
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {questionnaireComplete ? 'Completed' : 'Answer questions to get your personalized risk score'}
                              </p>
                            </div>
                            {questionnaireComplete ? (
                              <Badge className="bg-primary text-white border-0">Done</Badge>
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
                              Do Your First Check-In
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {firstCheckInComplete ? 'Completed' : 'Start tracking how you feel each day'}
                            </p>
                          </div>
                          {firstCheckInComplete ? (
                            <Badge className="bg-destructive text-white border-0">Done</Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive">+15 XP</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-4 italic">
                        {allSetupComplete 
                          ? 'Great job! You\'ve completed all setup steps.' 
                          : 'Complete all steps to unlock the leaderboard and start competing with your community!'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {showLeaderboard ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <Leaderboard communityType={communityType} />
                <div className="space-y-4 lg:space-y-6">
                  <h2 className="text-xl lg:text-2xl font-black text-foreground">Your Achievements</h2>
                  <div className="grid grid-cols-1 gap-3 lg:gap-4">
                    <AchievementBadge
                      title="First Steps"
                      description="Complete your first daily check-in"
                      icon="target"
                      unlocked={streak >= 1}
                      rarity="common"
                      unlockedDate={streak >= 1 ? "Recently" : undefined}
                    />
                    <AchievementBadge
                      title="Week Warrior"
                      description="Maintain a 7-day streak"
                      icon="flame"
                      unlocked={streak >= 7}
                      rarity="rare"
                      unlockedDate={streak >= 7 ? "Recently" : undefined}
                      progress={streak >= 7 ? undefined : streak}
                      maxProgress={streak >= 7 ? undefined : 7}
                    />
                    <AchievementBadge
                      title="Health Champion"
                      description="Reach level 15"
                      icon="crown"
                      unlocked={level >= 15}
                      progress={level >= 15 ? undefined : level}
                      maxProgress={level >= 15 ? undefined : 15}
                      rarity="epic"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="lg:col-span-2">
                    <RiskScoreCard
                      score={riskScoreData?.overallScore ?? 50}
                      trend="stable"
                      message={riskScoreData ? "Based on your health profile" : "Complete your health questionnaire to get your personalized score"}
                    />
                  </div>
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
                              Mood Journal
                            </p>
                            <span className="text-xs text-muted-foreground">{allEmotionalCheckins.length} entries</span>
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
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-3 lg:space-y-4">
                    <h2 className="text-lg lg:text-xl font-black text-foreground flex items-center gap-2">
                      <Flame className="w-5 h-5 text-primary" />
                      Your Quests
                    </h2>
                    {missions.slice(0, 3).map((mission: any) => (
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
                    <Link href="/mission-details">
                      <Button variant="outline" className="w-full" data-testid="button-view-all-quests">
                        View All Quests
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="space-y-3 lg:space-y-4">
                    <h2 className="text-lg lg:text-xl font-black text-foreground flex items-center gap-2">
                      Activity & Health
                    </h2>
                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                      <ActivityMetric
                        title="Steps"
                        value={activityData?.steps ?? 0}
                        goal={(activityData?.stepsGoal ?? 10000).toLocaleString()}
                        unit="steps"
                        icon={Footprints}
                        progress={Math.min(100, Math.round(((activityData?.steps ?? 0) / (activityData?.stepsGoal ?? 10000)) * 100))}
                        color="text-chart-1"
                        explanation="Total steps taken today"
                        simpleExplanation="Walking is great exercise!"
                        href="/activity?type=steps"
                      />
                      <ActivityMetric
                        title="Sleep"
                        value={activityData?.sleepHours ?? 0}
                        goal={`${activityData?.sleepGoal ?? 8}h`}
                        unit="hours"
                        icon={MoonIcon}
                        progress={Math.min(100, Math.round(((activityData?.sleepHours ?? 0) / (activityData?.sleepGoal ?? 8)) * 100))}
                        color="text-chart-2"
                        explanation="Hours of sleep last night"
                        simpleExplanation="Good sleep helps your body recover"
                        href="/activity?type=sleep"
                      />
                      <ActivityMetric
                        title="Heart Rate"
                        value={activityData?.heartRate ?? 0}
                        goal="60-100"
                        unit="bpm"
                        icon={Heart}
                        progress={activityData?.heartRate ? (activityData.heartRate >= 60 && activityData.heartRate <= 100 ? 100 : 50) : 0}
                        color="text-destructive"
                        explanation="Your resting heart rate"
                        simpleExplanation="Lower is usually healthier when resting"
                        href="/activity?type=heartRate"
                      />
                      <ActivityMetric
                        title="Calories"
                        value={activityData?.calories ?? 0}
                        goal={(activityData?.caloriesGoal ?? 2000).toLocaleString()}
                        unit="cal"
                        icon={Flame}
                        progress={Math.min(100, Math.round(((activityData?.calories ?? 0) / (activityData?.caloriesGoal ?? 2000)) * 100))}
                        color="text-chart-3"
                        explanation="Calories burned today"
                        simpleExplanation="Energy you've used"
                        href="/activity?type=calories"
                      />
                    </div>
                    
                    {medications.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground">Medications</h3>
                        {medications.slice(0, 2).map((med: any) => (
                          <MedicationTracker
                            key={med.id}
                            medicationId={med.id}
                            name={med.name}
                            dosage={med.dosage}
                            timing={med.timing}
                            frequency={med.frequency}
                            explanation={med.explanation || "Medication tracking helps ensure consistent dosing"}
                            simpleExplanation={med.simpleExplanation || "Take as prescribed"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {!isNewUser && (
                  <>
                    <Separator />
                    <HealthScienceSection category="activity" />
                  </>
                )}
              </>
            )}
            
            <div className="flex justify-center gap-3 lg:gap-4 py-4">
              <Button
                variant={showLeaderboard ? "default" : "outline"}
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2"
                data-testid="button-show-leaderboard"
              >
                <Users className="w-4 h-4" />
                Leaderboard
              </Button>
              <Button
                variant={!showLeaderboard ? "default" : "outline"}
                onClick={() => setShowLeaderboard(false)}
                className="flex items-center gap-2"
                data-testid="button-show-dashboard"
              >
                <Heart className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center pb-4 italic">
              Loretta is not a diagnostic tool. Always consult healthcare professionals for medical advice.
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
      
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Privacy Policy</DialogTitle>
            <DialogDescription>
              Your privacy matters to us. Review how we handle your data.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>We collect health data to provide personalized insights and improve your wellness journey.</p>
              <p>Your data is encrypted and never shared with third parties without your explicit consent.</p>
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
