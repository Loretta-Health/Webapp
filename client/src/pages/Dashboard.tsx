import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Moon, Sun, Menu, X, User, MessageCircle, QrCode, Shield, Accessibility, LogOut, LogIn, UserPlus, Loader2, MapPin, MapPinOff } from 'lucide-react';
import { Footprints, Moon as MoonIcon, Heart, Flame } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import lorettaLogo from '@assets/logos/loretta_logo.png';
import marcPhoto from '@assets/image_1764091454235.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

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
import { useGeolocation } from '@/hooks/useGeolocation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityType, setCommunityType] = useState<CommunityType>('loretta');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAccessibilityPolicy, setShowAccessibilityPolicy] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');
  const { user, logoutMutation, loginMutation, registerMutation } = useAuth();
  const { locationEnabled, toggleLocationEnabled, usingDefault, loading: locationLoading } = useGeolocation();

  const { data: riskScoreData } = useQuery<RiskScoreData>({
    queryKey: ['/api/risk-scores/latest'],
    enabled: !!user,
  });
  
  const demoMissions = [
    { id: 'daily-checkin', title: 'Daily Check-In', description: 'Complete your daily health check-in', category: 'daily' as const, xpReward: 50, completed: true, progress: 1, maxProgress: 1, legendary: false, href: '/mission-details?id=daily-checkin' },
    { id: 'medication-morning', title: 'Morning Medication', description: 'Take your morning medication', category: 'daily' as const, xpReward: 25, completed: true, progress: 1, maxProgress: 1, legendary: false, href: '/medications' },
    { id: 'log-activity', title: 'Log Activity', description: 'Record your daily activity', category: 'daily' as const, xpReward: 30, completed: false, progress: 0, maxProgress: 1, legendary: false, href: '/activity' },
    { id: 'weekly-summary', title: 'Weekly Summary', description: 'Review your weekly health summary', category: 'weekly' as const, xpReward: 100, completed: false, progress: 4, maxProgress: 7, legendary: true, href: '/mission-details?id=weekly-summary' },
  ];
  const missions = demoMissions;
  const completedCount = demoMissions.filter(m => m.completed).length;
  const totalCount = demoMissions.length;
  
  const demoMedications = [
    { id: 'med-1', name: 'Metformin', dosage: '500mg', scheduledTimes: ['08:00'], notes: 'With breakfast', frequency: 'daily', explanation: 'Helps control blood sugar levels', simpleExplanation: 'Keeps blood sugar stable' },
    { id: 'med-2', name: 'Lisinopril', dosage: '10mg', scheduledTimes: ['08:00'], notes: 'Every morning', frequency: 'daily', explanation: 'ACE inhibitor for blood pressure control', simpleExplanation: 'Maintains healthy blood pressure' },
    { id: 'med-3', name: 'Atorvastatin', dosage: '20mg', scheduledTimes: ['22:00'], notes: 'At bedtime', frequency: 'daily', explanation: 'Statin medication to lower cholesterol', simpleExplanation: 'Helps keep cholesterol low' },
  ];
  const medications = demoMedications;
  const medicationProgress = { taken: 2, total: 3, percentage: 67 };
  
  const xp = 327;
  const level = 14;
  const streak = 59;
  const lives = 4;
  const nextLevelXP = level * 100 + 200;
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCheckIn = () => {
    // Demo mode - no actual check-in
  };

  const handleCompleteQuest = (xpReward: number) => {
    // Demo mode - no actual XP addition
  };

  const handleCheckInComplete = (emotion: string, xpAwarded: number) => {
    // Demo mode - no actual data update
  };
  
  const demoUserId = 'demo-marc-lewis';
  const demoEmotionalCheckins: EmotionalCheckinData[] = [
    { id: '1', userId: demoUserId, emotion: 'happy', userMessage: 'Feeling great today!', aiResponse: 'Wonderful to hear!', xpAwarded: 15, checkedInAt: new Date().toISOString() },
    { id: '2', userId: demoUserId, emotion: 'calm', userMessage: 'Had a peaceful morning', aiResponse: 'That sounds lovely!', xpAwarded: 15, checkedInAt: new Date(Date.now() - 86400000).toISOString() },
  ];

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
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
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
          {/* Mobile Close Button */}
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
          
          {/* Desktop Logo */}
          <div className="hidden lg:flex justify-center mb-4">
            <img src={lorettaLogo} alt="Loretta" className="h-10 object-contain" data-testid="logo-loretta" />
          </div>
          
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                <img 
                  src={marcPhoto} 
                  alt="Marc Lewis" 
                  className="w-full h-full object-cover"
                  data-testid="img-user-avatar"
                />
              </div>
              <div className="absolute -bottom-0 -right-0 w-6 h-6 lg:w-8 lg:h-8">
                <img 
                  src={mascotImage} 
                  alt="Health Mascot" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>
            </div>
            <h2 className="text-lg lg:text-xl font-black text-sidebar-foreground">Marc Lewis</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">Health Champion</p>
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
                <span className="font-bold text-sidebar-foreground">+250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quests</span>
                <span className="font-bold text-sidebar-foreground">2/4 Done</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Achievements</span>
                <span className="font-bold text-sidebar-foreground">12 Total</span>
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
            <Link href="/leaderboard">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-destructive/10 to-pink-500/5 border-destructive/30 hover:border-destructive/50"
                data-testid="button-achievements"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-destructive to-pink-500 flex items-center justify-center mr-2">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">Achievements</span>
              </Button>
            </Link>
            <Link href="/invite">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm bg-gradient-to-r from-chart-4/10 to-purple-500/5 border-chart-4/30 hover:border-chart-4/50"
                data-testid="button-invite-friends"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-chart-4 to-purple-500 flex items-center justify-center mr-2">
                  <QrCode className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold">Invite Friends</span>
              </Button>
            </Link>
            
            <Separator className="my-2" />
            
            {user ? (
              <div className="space-y-2">
                <Link href="/my-dashboard">
                  <Button 
                    variant="default" 
                    className="w-full justify-start text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    data-testid="button-my-dashboard"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-bold">Go to My Dashboard</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm bg-gradient-to-r from-muted/50 to-muted/30 border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted"
                  onClick={() => {
                    logoutMutation.mutate();
                  }}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted-foreground to-slate-500 flex items-center justify-center mr-2">
                    <LogOut className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold">{logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/30 hover:border-primary/50"
                  onClick={() => {
                    setAuthTab('login');
                    setShowAuthDialog(true);
                  }}
                  data-testid="button-login"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mr-2">
                    <LogIn className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold">Sign In</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm bg-gradient-to-r from-chart-2/10 to-secondary/10 border-chart-2/30 hover:border-chart-2/50"
                  onClick={() => {
                    setAuthTab('register');
                    setShowAuthDialog(true);
                  }}
                  data-testid="button-signup"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-chart-2 to-secondary flex items-center justify-center mr-2">
                    <UserPlus className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold">Sign Up</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 lg:h-16 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border flex items-center justify-between px-3 lg:px-6" data-testid="top-bar">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            {/* Mobile Menu Button */}
            <Button 
              size="icon" 
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <TreasureChest canOpen={true} />
            <EnergyBar current={85} max={100} className="flex-1 max-w-[120px] lg:max-w-xs" />
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
            <Badge variant="secondary" className="font-bold text-xs lg:text-sm" data-testid="user-rank">
              Rank #4
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={toggleLocationEnabled}
                    disabled={locationLoading}
                    data-testid="button-location-toggle"
                    className={locationEnabled && !usingDefault ? 'text-primary' : ''}
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                    ) : locationEnabled && !usingDefault ? (
                      <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                    ) : (
                      <MapPinOff className="w-4 h-4 lg:w-5 lg:h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{locationEnabled && !usingDefault ? 'Using your location' : 'Using default location (Berlin)'}</p>
                  <p className="text-xs text-muted-foreground">Click to {locationEnabled ? 'disable' : 'enable'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {/* Welcome Section with Gradient */}
            <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/5 rounded-xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h1 className="text-2xl lg:text-4xl font-black text-foreground mb-1">
                    Welcome back, Marc!
                  </h1>
                  <p className="text-sm lg:text-lg text-muted-foreground">
                    You've made great progress today! Keep it up!
                  </p>
                </div>
              </div>
            </div>
            
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
                      unlocked
                      rarity="common"
                      unlockedDate="2 days ago"
                    />
                    <AchievementBadge
                      title="Week Warrior"
                      description="Maintain a 7-day streak"
                      icon="flame"
                      unlocked
                      rarity="rare"
                      unlockedDate="Today"
                    />
                    <AchievementBadge
                      title="Health Champion"
                      description="Reach level 15"
                      icon="crown"
                      unlocked={false}
                      progress={14}
                      maxProgress={15}
                      rarity="epic"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Risk Score & Daily Check-in */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="lg:col-span-2">
                    <RiskScoreCard
                      score={user && riskScoreData ? riskScoreData.overallScore : 68}
                      trend="up"
                      message="Elevated due to smoking habits and limited exercise"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <DailyCheckIn
                      streak={streak}
                      dayNumber={streak}
                      xpReward={50}
                      onStart={() => setShowCheckInModal(true)}
                    />
                    
                    {demoEmotionalCheckins && demoEmotionalCheckins.length > 0 && (
                      <Card className="bg-gradient-to-br from-chart-2/20 via-primary/10 to-secondary/20 border-0 shadow-lg overflow-hidden">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              Mood Journal
                            </p>
                            <span className="text-xs text-muted-foreground">{demoEmotionalCheckins.length} entries</span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {demoEmotionalCheckins.map((checkin) => {
                              const data = formatCheckinData(checkin);
                              return (
                                <div key={data.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                                  <span className="text-lg">{data.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {data.emotion}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {data.dateStr}
                                    </p>
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
                
                {/* Daily Missions */}
                <div className="bg-gradient-to-br from-card via-card to-secondary/5 rounded-xl p-4 lg:p-6 border border-card-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl lg:text-2xl font-black text-foreground">Daily Missions</h2>
                    <Badge className="bg-gradient-to-r from-chart-1 to-chart-2 text-white font-black border-0">{completedCount}/{totalCount} Complete</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-4">
                    {missions.map((mission) => (
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
                      />
                    ))}
                  </div>
                  
                  <HealthScienceSection category="activity" />
                </div>
                
                {/* Medications */}
                <div className="bg-gradient-to-br from-card via-card to-chart-3/5 rounded-xl p-4 lg:p-6 border border-card-border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl lg:text-2xl font-black text-foreground">Medications</h2>
                    <Badge className="bg-gradient-to-r from-chart-3 to-chart-1 text-white font-black border-0">
                      {medicationProgress.taken}/{medicationProgress.total} Doses Today
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4">
                    {medications.map((med) => (
                      <MedicationTracker
                        key={med.id}
                        medicationId={med.id}
                        name={med.name}
                        dosage={med.dosage}
                        scheduledTimes={med.scheduledTimes}
                        notes={med.notes}
                        frequency={med.frequency}
                        explanation={med.explanation}
                        simpleExplanation={med.simpleExplanation}
                      />
                    ))}
                  </div>
                  
                  <HealthScienceSection category="medication" />
                </div>
                
                {/* Activity Metrics with Science */}
                <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl p-4 lg:p-6 border border-card-border">
                  <h2 className="text-xl lg:text-2xl font-black text-foreground mb-4">Today's Activity</h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                    <ActivityMetric
                      title="Steps"
                      value={8432}
                      goal="10,000"
                      unit="steps"
                      icon={Footprints}
                      progress={84}
                      trend={12}
                      color="text-chart-1"
                      explanation="The total number of steps taken. 10,000 steps daily is a common goal, roughly equivalent to 5 miles of walking."
                      simpleExplanation="Walking is one of the best exercises! More steps means you're staying active and healthy."
                      href="/activity?type=steps"
                    />
                    <ActivityMetric
                      title="Sleep"
                      value="6.5"
                      goal="8h"
                      unit="hours"
                      icon={MoonIcon}
                      progress={81}
                      trend={-5}
                      color="text-chart-2"
                      explanation="A measure of how restorative your sleep is, considering factors like deep sleep phases, interruptions, and sleep efficiency."
                      simpleExplanation="How well you sleep, not just how long. Good sleep helps your body heal and your mind stay sharp."
                      href="/activity?type=sleep"
                    />
                    <ActivityMetric
                      title="Heart Rate"
                      value={72}
                      goal="<80"
                      unit="bpm"
                      icon={Heart}
                      progress={90}
                      color="text-destructive"
                      explanation="The number of heart contractions per minute. Resting heart rate between 60-100 bpm is considered normal for adults."
                      simpleExplanation="How fast your heart is pumping. Lower is usually healthier when resting."
                      href="/activity?type=heartRate"
                    />
                    <ActivityMetric
                      title="Calories"
                      value={1847}
                      goal="2,200"
                      unit="cal"
                      icon={Flame}
                      progress={84}
                      trend={8}
                      color="text-chart-3"
                      explanation="A unit of energy. In nutrition, calories measure the energy food provides to your body for daily activities and metabolism."
                      simpleExplanation="The energy your body gets from food. You need enough to stay active but not too many."
                      href="/activity?type=calories"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <HealthScienceSection category="heart" />
                    <HealthScienceSection category="sleep" />
                  </div>
                </div>
                
                {/* Nutrition Section */}
                <div className="bg-gradient-to-br from-card via-card to-chart-2/5 rounded-xl p-4 lg:p-6 border border-card-border">
                  <h2 className="text-xl lg:text-2xl font-black text-foreground mb-4">Nutrition</h2>
                  
                  <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-r from-chart-2/10 to-chart-4/10 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">85%</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Great job including fiber in your last meal!</p>
                      <p className="text-sm text-muted-foreground">You're on track with your nutrition goals today.</p>
                    </div>
                  </div>
                  
                  <HealthScienceSection category="nutrition" />
                </div>
                
                {/* Weekly Summary Card with Gradient */}
                <Card className="p-4 lg:p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-chart-2/10 border-0">
                  <div className="text-center space-y-3">
                    <p className="text-sm lg:text-lg font-bold text-muted-foreground">Weekly Summary</p>
                    <p className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">+12% more active</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">than last week</p>
                    <Button 
                      onClick={() => setShowLevelUp(true)}
                      className="mt-4 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 border-0"
                      data-testid="button-test-levelup"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Test Level Up Animation
                    </Button>
                  </div>
                </Card>
              </>
            )}
            
            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Privacy Policy
                </button>
                <span className="hidden sm:inline text-muted-foreground/50">•</span>
                <button
                  onClick={() => setShowAccessibilityPolicy(true)}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Accessibility className="w-3.5 h-3.5" />
                  Inclusion & Accessibility
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
                © 2025 Loretta Health UG. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      </main>
      
      {/* Privacy Policy Dialog - Verbatim from PDF */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="de">Deutsch</TabsTrigger>
              </TabsList>
              
              <TabsContent value="en" className="space-y-4 text-sm text-muted-foreground">
                <div className="text-center border-b border-border pb-3">
                  <h3 className="font-black text-foreground">LORETTA HEALTH UG — GDPR CONSENT & PRIVACY POLICY (EN)</h3>
                  <p className="text-xs mt-1">Last Updated: November 25, 2026 | Effective Date: November 25, 2026</p>
                </div>
                
                <p>This Privacy and Consent Policy explains how Loretta Health UG (haftungsbeschränkt) ("Loretta", "we", "us") processes your personal and health data when you use the Loretta mobile application. Loretta provides wellbeing insights, behavioural support, and analysis of medical information. We do not provide diagnosis or medical treatment.</p>
                
                <p><strong className="text-foreground">You choose what you share and may withdraw consent at any time.</strong></p>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">1. Controller</h4>
                  <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Germany<br/>Email: privacy@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">2. Categories of Data Processed</h4>
                  <p><strong>2.1 Account Data</strong><br/>Name, email, password (encrypted), age, gender identity, language, profile settings.</p>
                  <p><strong>2.2 Health and Wellbeing Data</strong><br/>Self reported symptoms, stress indicators, lifestyle information, and optional identity attributes (ethnicity, sexuality, disability). These fields are always voluntary.</p>
                  <p><strong>2.3 Wearable Data</strong><br/>With your consent, we may process data from Apple Health or Google Fit including: steps, activity, sleep, heart rate, HRV, blood oxygen, ECG (if available), cycle data, and other metrics supported by your device. You may disconnect wearables at any time.</p>
                  <p><strong>2.4 Uploaded Medical Documents</strong><br/>Medical documents are used to generate explanations and are deleted immediately after processing.</p>
                  <p><strong>2.5 Coarse Location</strong><br/>We process only approximate regional location to identify environmental and wellbeing factors. We do not collect precise GPS location.</p>
                  <p><strong>2.6 Technical and Device Data</strong><br/>Operating system, device type, crash logs, app usage logs, IP address (anonymised), and permission settings.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">3. Purposes of Processing</h4>
                  <p><strong>3.1 Service Delivery</strong><br/>To provide personalised insights, document explanations, behaviour support, and health-equity–aware features.</p>
                  <p><strong>3.2 Fairness and Safety</strong><br/>To ensure equitable model performance, reduce bias, and maintain accuracy across demographic groups. Only authorised data scientists and engineers may access limited datasets where necessary.</p>
                  <p><strong>3.3 Research and Development</strong><br/>Pseudonymised data may be used for statistical analysis and model improvement. You may opt out at any time.</p>
                  <p><strong>3.4 Security and Compliance</strong><br/>To monitor system integrity, detect misuse, ensure secure operation, and fulfil regulatory requirements.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">4. Legal Bases</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Explicit consent (Art. 6(1)(a), Art. 9(2)(a))</li>
                    <li>Performance of a contract (Art. 6(1)(b))</li>
                    <li>Legitimate interests for security and product improvement (Art. 6(1)(f))</li>
                    <li>Research/statistics under safeguards (Art. 9(2)(j))</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">5. Special Category and Identity Data</h4>
                  <p>Optional identity attributes are used only to improve fairness, accuracy, and representation. They are not used for advertising, exclusion, or automated decision-making with legal effect.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">6. Sharing of Data</h4>
                  <p>Data may be shared with:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Staleaway (EU-based hosting provider)</li>
                    <li>Google Workspace (email services)</li>
                    <li>Pseudonymised research environments (EU-based)</li>
                    <li>Individuals you choose to share data with</li>
                  </ul>
                  <p className="font-bold text-foreground mt-2">We do not sell your data.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">7. International Transfers</h4>
                  <p>Data is hosted in the EU. If transfers occur, we apply SCCs and supplementary safeguards.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">8. Retention</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Account data: until deleted by the user</li>
                    <li>Wearable and behavioural data: only as long as necessary</li>
                    <li>Medical uploads: deleted immediately</li>
                    <li>Research data: pseudonymised and retained under governance rules</li>
                    <li>Logs: retained for security and stability</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">9. Security Measures</h4>
                  <p>Encryption, pseudonymisation, RBAC, monitoring, secure development environments, auditing, EU-based infrastructure.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">10. Access Restrictions</h4>
                  <p>Only authorised data scientists and engineers may access certain data when required for maintenance or fairness monitoring.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">11. Automated Decision-Making</h4>
                  <p>Loretta does not engage in automated decision-making producing legal or significant effects.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">12. User Rights</h4>
                  <p>You have the right to access, correct, delete, restrict, object, withdraw consent, and request portability. Contact: privacy@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">13. Children</h4>
                  <p>The service is not intended for users under 16.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">14. Updates</h4>
                  <p>We may update this Policy. Significant changes will be communicated.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="de" className="space-y-4 text-sm text-muted-foreground">
                <div className="text-center border-b border-border pb-3">
                  <h3 className="font-black text-foreground">LORETTA HEALTH UG — DATENSCHUTZ- UND EINWILLIGUNGSERKLÄRUNG (DE)</h3>
                  <p className="text-xs mt-1">Letzte Aktualisierung: November 25, 2026 | Gültig ab: November 25, 2026</p>
                </div>
                
                <p>Diese Erklärung beschreibt, wie die Loretta Health UG (haftungsbeschränkt) („Loretta", „wir") personenbezogene und gesundheitsbezogene Daten verarbeitet. Loretta bietet personalisierte Einblicke, Wohlbefindensunterstützung und Erklärungen zu medizinischen Informationen. Wir stellen keine Diagnosen und führen keine medizinischen Behandlungen durch.</p>
                
                <p><strong className="text-foreground">Sie entscheiden, welche Daten Sie teilen, und können Ihre Einwilligung jederzeit widerrufen.</strong></p>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">1. Verantwortlicher</h4>
                  <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Deutschland<br/>E-Mail: privacy@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">2. Verarbeitete Datenkategorien</h4>
                  <p><strong>2.1 Kontodaten</strong><br/>Name, E-Mail, Passwort (verschlüsselt), Alter, Geschlechtsidentität, Spracheinstellungen, Profileinstellungen.</p>
                  <p><strong>2.2 Gesundheits- und Wellnessdaten</strong><br/>Selbst eingegebene Beschwerden, Stressindikatoren, Lebensstilinformatonen sowie freiwillige Identitätsmerkmale (ethnische Zugehörigkeit, sexuelle Orientierung, Behinderung).</p>
                  <p><strong>2.3 Wearable-Daten</strong><br/>Mit Ihrer Einwilligung verarbeiten wir Daten aus Apple Health oder Google Fit: Schritte, Aktivität, Schlaf, Herzfrequenz, HRV, Blutsauerstoff, EKG (falls verfügbar), Zyklusdaten und weitere Gerätemesswerte.</p>
                  <p><strong>2.4 Hochgeladene medizinische Dokumente</strong><br/>Dokumente werden analysiert und anschließend sofort gelöscht.</p>
                  <p><strong>2.5 Grober Standort</strong><br/>Wir verarbeiten nur ungefähre Region für kontextbezogene Hinweise. Keine genaue GPS-Erfassung.</p>
                  <p><strong>2.6 Technische Daten</strong><br/>Geräteinformationen, Absturzberichte, Logdaten, anonymisierte IP-Adresse und Berechtigungseinstellungen.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">3. Zwecke der Verarbeitung</h4>
                  <p><strong>3.1 Bereitstellung des Dienstes</strong><br/>Personalisierte Einblicke, Dokumentenerklärungen, Verhaltensunterstützung, chancengerechte Gesundheitsfunktionen.</p>
                  <p><strong>3.2 Fairness und Sicherheit</strong><br/>Sicherstellung gerechter Modellergebnisse, Vermeidung von Bias. Zugriff nur durch autorisierte Data Scientists und Entwickler.</p>
                  <p><strong>3.3 Forschung und Weiterentwicklung</strong><br/>Pseudonymisierte Daten für statistische Analyse und Modellverbesserung. Nutzer können widersprechen.</p>
                  <p><strong>3.4 Sicherheit und Compliance</strong><br/>Systemintegrität, Missbrauchsvermeidung, sicherer Betrieb, regulatorische Anforderungen.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">4. Rechtsgrundlagen</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ausdrückliche Einwilligung</li>
                    <li>Vertragserfüllung</li>
                    <li>Berechtigtes Interesse für Sicherheit und Verbesserung</li>
                    <li>Forschung/Statistik mit Schutzmaßnahmen</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">5. Besondere Kategorien und Identitätsdaten</h4>
                  <p>Optionale Identitätsmerkmale werden ausschließlich zur Fairnessverbesserung verwendet und niemals für Werbung, Ausschluss oder rechtlich relevante Entscheidungen genutzt.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">6. Weitergabe</h4>
                  <p>Datenweitergabe erfolgt nur an:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Staleaway (EU-Hosting)</li>
                    <li>Google Workspace (E-Mail)</li>
                    <li>Forschungspartner mit pseudonymisierten Daten</li>
                    <li>Personen, mit denen Sie selbst teilen</li>
                  </ul>
                  <p className="font-bold text-foreground mt-2">Kein Datenverkauf.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">7. Internationale Übermittlungen</h4>
                  <p>Daten werden in der EU gespeichert; falls abweichend, werden Standardvertragsklauseln genutzt.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">8. Aufbewahrung</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Kontodaten: bis zur Löschung</li>
                    <li>Wearable- und Verhaltensdaten: nur solange erforderlich</li>
                    <li>Dokumente: sofort gelöscht</li>
                    <li>Forschungsdaten: pseudonymisiert nach Vorgaben</li>
                    <li>Logs: zur Sicherheit begrenzt aufbewahrt</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">9. Sicherheit</h4>
                  <p>Verschlüsselung, Pseudonymisierung, rollenbasierte Zugriffe, Überwachung, sichere Entwicklungsumgebungen, EU-Hosting.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">10. Zugriffsbeschränkungen</h4>
                  <p>Nur autorisierte Data Scientists und Entwickler bei Bedarf.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">11. Automatisierte Entscheidungen</h4>
                  <p>Keine automatisierten Entscheidungen mit rechtlicher Wirkung.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">12. Nutzerrechte</h4>
                  <p>Zugriff, Berichtigung, Löschung, Einschränkung, Widerspruch, Widerruf und Übertragbarkeit. Kontakt: privacy@loretta.care</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">13. Kinder</h4>
                  <p>Nicht für Nutzer unter 16 Jahren bestimmt.</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground">14. Änderungen</h4>
                  <p>Änderungen werden mitgeteilt.</p>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Inclusion & Accessibility Dialog - Verbatim from PDF */}
      <Dialog open={showAccessibilityPolicy} onOpenChange={setShowAccessibilityPolicy}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-primary" />
              Inclusion & Accessibility at Loretta
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>At Loretta, we believe everyone deserves easy, respectful, and reliable access to health and wellbeing support. Our app is built to serve people with different backgrounds, abilities, and levels of health literacy.</p>
              
              <p>To make this possible, we design our experience with inclusion and accessibility at the center:</p>
              
              <ul className="list-disc list-inside space-y-2">
                <li>Clear, simple language is used throughout the app so information is easy to understand.</li>
                <li>Flexible navigation supports different levels of digital experience.</li>
                <li>Accessible color contrast and intuitive layouts are used throughout the app.</li>
                <li>Screen-reader compatibility is currently in development, and we are working toward full accessibility support.</li>
                <li>Respect for your identity is core to our work. You can always choose how you describe yourself.</li>
                <li>Support is available if something is unclear or difficult to use.</li>
              </ul>
              
              <p>If you encounter a barrier or need additional support, please contact us at <a href="mailto:info@loretta.care" className="text-primary font-semibold hover:underline">info@loretta.care</a>.</p>
              
              <p className="font-semibold text-foreground">Your feedback directly helps us improve accessibility for everyone.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 text-center">
            <img src={lorettaLogo} alt="Loretta" className="h-10 mx-auto brightness-0 invert mb-2" />
            <DialogTitle className="text-xl font-black text-white">
              {authTab === 'login' ? 'Welcome Back' : 'Join Loretta'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm">
              {authTab === 'login' ? 'Sign in to your account' : 'Create your personal health companion account'}
            </DialogDescription>
          </div>
          <div className="p-6">
            <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  loginMutation.mutate(loginForm, {
                    onSuccess: () => {
                      setShowAuthDialog(false);
                      setLoginForm({ username: '', password: '' });
                      navigate('/my-dashboard');
                    }
                  });
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-login-username">Username</Label>
                    <Input
                      id="dialog-login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-login-password">Password</Label>
                    <Input
                      id="dialog-login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 text-white font-bold"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setRegisterError('');
                  
                  if (registerForm.password !== registerForm.confirmPassword) {
                    setRegisterError('Passwords do not match');
                    return;
                  }
                  
                  if (registerForm.password.length < 6) {
                    setRegisterError('Password must be at least 6 characters');
                    return;
                  }
                  
                  registerMutation.mutate({
                    username: registerForm.username,
                    password: registerForm.password,
                  }, {
                    onSuccess: () => {
                      setShowAuthDialog(false);
                      setRegisterForm({ username: '', password: '', confirmPassword: '' });
                      navigate('/onboarding');
                    }
                  });
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-register-username">Username</Label>
                    <Input
                      id="dialog-register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-register-password">Password</Label>
                    <Input
                      id="dialog-register-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-register-confirm">Confirm Password</Label>
                    <Input
                      id="dialog-register-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  {registerError && (
                    <p className="text-sm text-red-500">{registerError}</p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary via-primary to-chart-2 hover:opacity-90 text-white font-bold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      
      <LevelUpModal
        open={showLevelUp}
        level={level}
        xpEarned={500}
        badges={['Week Warrior', 'Hydration Hero']}
        unlocks={['New achievement category', 'Bonus XP multiplier', 'Custom avatar accessories']}
        onClose={() => setShowLevelUp(false)}
      />
      
      <EmotionalCheckInModal
        open={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        userId={demoUserId}
        onCheckInComplete={handleCheckInComplete}
      />
    </div>
  );
}
