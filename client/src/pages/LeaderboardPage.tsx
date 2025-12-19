import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home,
  Award,
  Target,
  Flame,
  Crown,
  Star,
  Zap,
  Heart,
  Shield,
  Sun,
  Moon,
  Loader2,
  Plus,
  UserPlus
} from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import CommunitySelector, { CommunityType } from '@/components/CommunitySelector';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  username: string;
  xp: number;
  level: number;
  currentStreak: number;
  consentGiven: boolean;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
  change?: number;
  isCurrentUser?: boolean;
  isOwner?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'target' | 'flame' | 'crown' | 'star' | 'zap' | 'heart' | 'shield' | 'award';
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
}

interface FlatAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  maxProgress: number;
  xpReward: number;
  category: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

function formatRelativeDate(dateString: string | null, t: (key: string, options?: Record<string, unknown>) => string): string | undefined {
  if (!dateString) return undefined;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('leaderboard.relativeDates.today');
  if (diffDays === 1) return t('leaderboard.relativeDates.yesterday');
  if (diffDays < 7) return t('leaderboard.relativeDates.daysAgo', { count: diffDays });
  if (diffDays < 14) return t('leaderboard.relativeDates.weekAgo');
  if (diffDays < 30) return t('leaderboard.relativeDates.weeksAgo', { count: Math.floor(diffDays / 7) });
  if (diffDays < 60) return t('leaderboard.relativeDates.monthAgo');
  return t('leaderboard.relativeDates.monthsAgo', { count: Math.floor(diffDays / 30) });
}

function mapFlatToAchievement(flat: FlatAchievement, t: (key: string, options?: Record<string, unknown>) => string): Achievement {
  return {
    id: flat.id,
    title: flat.title,
    description: flat.description,
    icon: flat.icon as Achievement['icon'],
    unlocked: flat.unlocked,
    rarity: flat.rarity as Achievement['rarity'],
    unlockedDate: formatRelativeDate(flat.unlockedAt, t),
    progress: flat.progress,
    maxProgress: flat.maxProgress,
  };
}

const iconMap = {
  target: Target,
  flame: Flame,
  crown: Crown,
  star: Star,
  zap: Zap,
  heart: Heart,
  shield: Shield,
  award: Award,
};

const rarityColors = {
  common: 'from-emerald-500 to-green-400',
  rare: 'from-primary to-chart-2',
  epic: 'from-chart-4 to-purple-500',
  legendary: 'from-chart-3 to-yellow-500',
};

const rarityBgColors = {
  common: 'bg-emerald-500/10',
  rare: 'bg-primary/10',
  epic: 'bg-chart-4/10',
  legendary: 'bg-chart-3/10',
};

const rarityBorderColors = {
  common: 'border-emerald-500/30',
  rare: 'border-primary/30',
  epic: 'border-chart-4/30',
  legendary: 'border-chart-3/30',
};

const rarityProgressBgColors = {
  common: 'bg-emerald-500/20',
  rare: 'bg-primary/20',
  epic: 'bg-chart-4/20',
  legendary: 'bg-chart-3/20',
};

export default function LeaderboardPage() {
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityType>('loretta');
  const [userGamification, setUserGamification] = useState<{ xp: number; level: number; currentStreak: number } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchAchievements();
      fetchUserGamification();
    }
  }, [user]);

  const fetchUserGamification = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/gamification/${user.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserGamification({
          xp: data.xp || 0,
          level: data.level || 1,
          currentStreak: data.currentStreak || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch user gamification:', err);
    }
  };

  const alwaysHighlightedIds = ['first-steps', 'week-warrior', 'community-star', 'wellness-warrior', 'streak-legend'];

  const sortAchievements = (achs: Achievement[]): Achievement[] => {
    return [...achs].sort((a, b) => {
      const aProgress = a.progress || 0;
      const bProgress = b.progress || 0;
      const aHighlighted = alwaysHighlightedIds.includes(a.id);
      const bHighlighted = alwaysHighlightedIds.includes(b.id);
      
      if (aProgress > 0 || bProgress > 0) {
        return bProgress - aProgress;
      }
      
      if (aHighlighted && !bHighlighted) return -1;
      if (!aHighlighted && bHighlighted) return 1;
      
      return 0;
    });
  };

  const fetchAchievements = async () => {
    if (!user?.id) return;
    setLoadingAchievements(true);
    try {
      const response = await fetch(`/api/achievements/user`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data: FlatAchievement[] = await response.json();
        const mapped = data.map(d => mapFlatToAchievement(d, t));
        setAchievements(sortAchievements(mapped));
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoadingAchievements(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/teams/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        credentials: 'include',
      });
      const data = await response.json();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('loretta_theme', newMode ? 'dark' : 'light');
  };

  const getLeaderboardEntries = (): LeaderboardEntry[] => {
    const sortedMembers = [...teamMembers]
      .filter(m => m.consentGiven)
      .sort((a, b) => b.xp - a.xp);
    
    return sortedMembers.map((member, index) => ({
      rank: index + 1,
      name: member.username,
      xp: member.xp,
      level: member.level,
      streak: member.currentStreak,
      isCurrentUser: member.userId === user?.id,
      isOwner: member.role === 'owner',
    }));
  };

  const displayEntries = getLeaderboardEntries();

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-chart-3';
    if (rank === 2) return 'text-muted-foreground';
    if (rank === 3) return 'text-chart-3/70';
    return 'text-foreground';
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/my-dashboard">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black text-foreground">{t('leaderboard.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('leaderboard.achievementsUnlocked', { count: unlockedCount, total: totalCount })}</p>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={toggleDarkMode}
            data-testid="button-theme-toggle"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="leaderboard" className="font-bold" data-testid="tab-leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              {t('leaderboard.tabs.leaderboard')}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="font-bold" data-testid="tab-achievements">
              <Award className="w-4 h-4 mr-2" />
              {t('leaderboard.tabs.achievements')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card className="p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-chart-3" />
                    <h3 className="text-2xl font-black text-foreground">{t('leaderboard.teamRankings')}</h3>
                  </div>
                  <CommunitySelector 
                    value={selectedCommunity} 
                    onChange={setSelectedCommunity}
                    friendsCount={1}
                    className="w-auto min-w-[180px]"
                  />
                </div>
                {selectedCommunity === 'loretta' && teams.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {teams.map(team => (
                      <Button
                        key={team.id}
                        size="sm"
                        variant={selectedTeamId === team.id ? 'default' : 'outline'}
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        {team.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCommunity === 'friends' ? (
                <div className="space-y-3">
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border-2 border-primary shadow-md"
                      data-testid="leaderboard-entry-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center font-black text-lg text-chart-3">
                        #1
                      </div>
                      
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-white font-bold">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="font-bold flex items-center gap-2 text-primary">
                          {user.username}
                          <Crown className="w-4 h-4 text-chart-3" />
                          <Badge variant="secondary" className="text-xs">{t('leaderboard.you')}</Badge>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-3">
                          <span>{(userGamification?.xp || 0).toLocaleString()} XP</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-chart-3" />
                            {t('leaderboard.dayStreak', { count: userGamification?.currentStreak || 0 })}
                          </span>
                        </p>
                      </div>
                      
                      <Badge className="bg-primary/20 text-primary">
                        {t('leaderboard.lvl', { level: userGamification?.level || 1 })}
                      </Badge>
                    </motion.div>
                  )}
                  
                  <div className="text-center py-8 border-t border-border mt-4">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <h4 className="text-md font-bold mb-2">{t('leaderboard.noFriends.title')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('leaderboard.noFriends.message')}
                    </p>
                    <Link href="/invite">
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('leaderboard.noFriends.inviteFriends')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : loadingTeams ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-bold mb-2">{t('leaderboard.noTeams.title')}</h4>
                  <p className="text-muted-foreground mb-4">
                    {t('leaderboard.noTeams.message')}
                  </p>
                  <Link href="/invite">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('leaderboard.noTeams.createTeam')}
                    </Button>
                  </Link>
                </div>
              ) : loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : displayEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-bold mb-2">{t('leaderboard.waitingMembers.title')}</h4>
                  <p className="text-muted-foreground">
                    {t('leaderboard.waitingMembers.message')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayEntries.map((entry, index) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                        entry.isCurrentUser
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted/30 hover:bg-muted/50'
                      } ${entry.rank <= 3 ? 'shadow-md' : ''}`}
                      data-testid={`leaderboard-entry-${entry.rank}`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-card flex items-center justify-center font-black text-lg ${getRankColor(entry.rank)}`}>
                        #{entry.rank}
                      </div>
                      
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-white font-bold">
                          {entry.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className={`font-bold flex items-center gap-2 ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {entry.name}
                          {entry.isOwner && (
                            <Crown className="w-4 h-4 text-chart-3" />
                          )}
                          {entry.isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">{t('leaderboard.you')}</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-3">
                          <span>{entry.xp.toLocaleString()} XP</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-chart-3" />
                            {t('leaderboard.dayStreak', { count: entry.streak })}
                          </span>
                        </p>
                      </div>
                      
                      <Badge className="bg-primary/20 text-primary">
                        {t('leaderboard.lvl', { level: entry.level })}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            {loadingAchievements ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-3/5 border-chart-3/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('leaderboard.achievements.progress')}</p>
                    <p className="text-2xl font-black text-foreground">{t('leaderboard.achievements.ofTotal', { count: unlockedCount, total: totalCount })}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-yellow-500 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="mt-3 h-2" />
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const IconComponent = iconMap[achievement.icon] || Award;
                  const shouldHighlight = achievement.unlocked || alwaysHighlightedIds.includes(achievement.id);
                  const hasNoProgress = (achievement.progress || 0) === 0;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`p-4 ${rarityBgColors[achievement.rarity]} border ${rarityBorderColors[achievement.rarity]} ${
                          !shouldHighlight ? 'opacity-70' : ''
                        }`}
                        data-testid={`achievement-${achievement.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center shrink-0 ${
                            !shouldHighlight ? 'grayscale' : ''
                          }`}>
                            <IconComponent className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-foreground">{achievement.title}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs capitalize ${
                                  achievement.rarity === 'legendary' ? 'border-chart-3 text-chart-3' :
                                  achievement.rarity === 'epic' ? 'border-chart-4 text-chart-4' :
                                  achievement.rarity === 'rare' ? 'border-primary text-primary' :
                                  'border-emerald-500 text-emerald-500'
                                }`}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                            
                            {achievement.unlocked ? (
                              <p className="text-xs text-chart-2 font-medium mt-2 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {t('leaderboard.achievements.unlocked', { date: achievement.unlockedDate })}
                              </p>
                            ) : achievement.progress !== undefined && achievement.maxProgress !== undefined ? (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>{t('leaderboard.achievements.progress')}</span>
                                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className={`h-1.5 ${rarityProgressBgColors[achievement.rarity]} ${hasNoProgress ? '[&>div]:bg-muted-foreground/40' : ''}`}
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">{t('leaderboard.achievements.notUnlocked')}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
