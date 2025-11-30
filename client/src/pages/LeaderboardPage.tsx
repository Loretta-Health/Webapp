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
  Moon
} from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  change?: number;
  isCurrentUser?: boolean;
  isFamily?: boolean;
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

const lorettaEntries: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah M.', xp: 2450, change: 2 },
  { rank: 2, name: 'John D.', xp: 2380, change: -1 },
  { rank: 3, name: 'Emma W.', xp: 2290, change: 1 },
  { rank: 4, name: 'Marc Lewis', xp: 2150, change: 3, isCurrentUser: true },
  { rank: 5, name: 'Lisa K.', xp: 2080, change: -2 },
  { rank: 6, name: 'Mike R.', xp: 1950, change: 0 },
  { rank: 7, name: 'Anna P.', xp: 1820, change: 1 },
  { rank: 8, name: 'Chris T.', xp: 1740, change: -1 },
];

const familyEntries: LeaderboardEntry[] = [
  { rank: 1, name: 'Marc Lewis', xp: 2150, change: 1, isCurrentUser: true, isFamily: true },
  { rank: 2, name: 'Linda Lewis', xp: 1890, change: 0, isFamily: true },
  { rank: 3, name: 'David Lewis', xp: 1720, change: 2, isFamily: true },
  { rank: 4, name: 'Amy Lewis', xp: 1540, change: -1, isFamily: true },
  { rank: 5, name: 'Tom Lewis', xp: 980, change: 0, isFamily: true },
];

const achievements: Achievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first daily check-in',
    icon: 'target',
    unlocked: true,
    rarity: 'common',
    unlockedDate: '2 days ago',
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    unlocked: true,
    rarity: 'rare',
    unlockedDate: 'Today',
  },
  {
    id: 'health-champion',
    title: 'Health Champion',
    description: 'Reach level 15',
    icon: 'crown',
    unlocked: false,
    rarity: 'epic',
    progress: 12,
    maxProgress: 15,
  },
  {
    id: 'medication-master',
    title: 'Medication Master',
    description: 'Take all medications on time for 30 days',
    icon: 'shield',
    unlocked: false,
    rarity: 'legendary',
    progress: 14,
    maxProgress: 30,
  },
  {
    id: 'hydration-hero',
    title: 'Hydration Hero',
    description: 'Drink 8 glasses of water for 7 days straight',
    icon: 'zap',
    unlocked: true,
    rarity: 'rare',
    unlockedDate: '5 days ago',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete a check-in before 8 AM',
    icon: 'star',
    unlocked: true,
    rarity: 'common',
    unlockedDate: '1 week ago',
  },
  {
    id: 'heart-healthy',
    title: 'Heart Healthy',
    description: 'Complete all heart health missions',
    icon: 'heart',
    unlocked: false,
    rarity: 'epic',
    progress: 3,
    maxProgress: 5,
  },
  {
    id: 'community-star',
    title: 'Community Star',
    description: 'Reach top 3 in the weekly leaderboard',
    icon: 'award',
    unlocked: false,
    rarity: 'legendary',
  },
];

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
  common: 'from-muted-foreground/50 to-muted-foreground/30',
  rare: 'from-primary to-chart-2',
  epic: 'from-chart-4 to-purple-500',
  legendary: 'from-chart-3 to-yellow-500',
};

const rarityBgColors = {
  common: 'bg-muted/50',
  rare: 'bg-primary/10',
  epic: 'bg-chart-4/10',
  legendary: 'bg-chart-3/10',
};

const rarityBorderColors = {
  common: 'border-muted-foreground/20',
  rare: 'border-primary/30',
  epic: 'border-chart-4/30',
  legendary: 'border-chart-3/30',
};

export default function LeaderboardPage() {
  const [communityType, setCommunityType] = useState<'loretta' | 'family'>('loretta');
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('loretta_theme', newMode ? 'dark' : 'light');
  };

  const displayEntries = communityType === 'family' ? familyEntries : lorettaEntries;

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
            <Link href="/dashboard">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black text-foreground">Leaderboard & Achievements</h1>
              <p className="text-sm text-muted-foreground">{unlockedCount}/{totalCount} achievements unlocked</p>
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
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="achievements" className="font-bold" data-testid="tab-achievements">
              <Award className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-chart-3" />
                  <h3 className="text-2xl font-black text-foreground">Weekly Rankings</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={communityType === 'loretta' ? 'default' : 'outline'}
                    onClick={() => setCommunityType('loretta')}
                    data-testid="button-community"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Community
                  </Button>
                  <Button
                    size="sm"
                    variant={communityType === 'family' ? 'default' : 'outline'}
                    onClick={() => setCommunityType('family')}
                    data-testid="button-family"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Family
                  </Button>
                </div>
              </div>

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
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className={`font-bold ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.xp.toLocaleString()} XP
                      </p>
                    </div>
                    
                    {entry.change !== undefined && (
                      <div className={`flex items-center gap-1 text-sm font-bold ${
                        entry.change > 0 ? 'text-chart-2' : entry.change < 0 ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {entry.change > 0 ? <TrendingUp className="w-4 h-4" /> : entry.change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                        <span>{entry.change !== 0 ? Math.abs(entry.change) : '-'}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-3/5 border-chart-3/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Achievement Progress</p>
                    <p className="text-2xl font-black text-foreground">{unlockedCount} of {totalCount}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-yellow-500 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Progress value={(unlockedCount / totalCount) * 100} className="mt-3 h-2" />
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const IconComponent = iconMap[achievement.icon];
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`p-4 ${rarityBgColors[achievement.rarity]} border ${rarityBorderColors[achievement.rarity]} ${
                          !achievement.unlocked ? 'opacity-70' : ''
                        }`}
                        data-testid={`achievement-${achievement.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center shrink-0 ${
                            !achievement.unlocked ? 'grayscale' : ''
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
                                  'border-muted-foreground text-muted-foreground'
                                }`}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                            
                            {achievement.unlocked ? (
                              <p className="text-xs text-chart-2 font-medium mt-2 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Unlocked {achievement.unlockedDate}
                              </p>
                            ) : achievement.progress !== undefined && achievement.maxProgress !== undefined ? (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>Progress</span>
                                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className="h-1.5" 
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Not yet unlocked</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
