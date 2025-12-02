import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Moon, Sun, Menu, X, User, MessageCircle, QrCode } from 'lucide-react';
import { Footprints, Moon as MoonIcon, Heart, Flame } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getUserId } from '@/lib/userId';
import lorettaLogo from '@assets/logos/loretta_logo.png';
import marcPhoto from '@assets/image_1764091454235.png';
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityType, setCommunityType] = useState<CommunityType>('loretta');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const userId = getUserId();
  const { missions, completedCount, totalCount } = useMissions();
  const { medications, getTotalProgress } = useMedicationProgress();
  const medicationProgress = getTotalProgress();
  
  const { data: gamificationData } = useQuery<GamificationData>({
    queryKey: ['/api/gamification', userId],
    enabled: !!userId,
  });

  const { data: riskScoreData } = useQuery<RiskScoreData>({
    queryKey: ['/api/risk-scores', userId, 'latest'],
    enabled: !!userId,
  });

  const { data: allEmotionalCheckins } = useQuery<EmotionalCheckinData[]>({
    queryKey: ['/api/emotional-checkins', userId],
    enabled: !!userId,
  });

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

  const xp = (gamificationData?.xp && gamificationData.xp > 0) ? gamificationData.xp : 327;
  const level = (gamificationData?.level && gamificationData.level > 1) ? gamificationData.level : 14;
  const streak = (gamificationData?.currentStreak && gamificationData.currentStreak > 0) ? gamificationData.currentStreak : 59;
  const lives = gamificationData?.lives ?? 4;
  const nextLevelXP = 1400;
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCompleteQuest = (xpReward: number) => {
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
          bg-gradient-to-b from-sidebar via-sidebar to-primary/10
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
                <MascotCharacter size="sm" pose="celebrate" className="hidden sm:block" />
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
                      score={68}
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
                            {allEmotionalCheckins.map((checkin) => {
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
                        timing={med.timing}
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
          </div>
        </div>
      </main>
      
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
        userId={userId}
        onCheckInComplete={handleCheckInComplete}
      />
    </div>
  );
}
