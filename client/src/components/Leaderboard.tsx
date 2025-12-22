import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, TrendingUp, TrendingDown, Users, Home } from 'lucide-react';
import type { CommunityType } from './CommunitySelector';
import { useTranslation } from 'react-i18next';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  change?: number;
  isCurrentUser?: boolean;
  isFamily?: boolean;
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  currentUserRank?: number;
  className?: string;
  communityType?: CommunityType;
}


export default function Leaderboard({
  entries = [],
  currentUserRank = 4,
  className = '',
  communityType = 'loretta'
}: LeaderboardProps) {
  const { t } = useTranslation('dashboard');
  const displayEntries = entries;
  const getRankBadge = (rank: number) => {
    return `#${rank}`;
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-chart-3';
    if (rank === 2) return 'text-muted-foreground';
    if (rank === 3) return 'text-chart-3/70';
    return 'text-foreground';
  };
  
  return (
    <Card className={className} data-testid="leaderboard">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-chart-3" />
            <h3 className="text-2xl font-black text-foreground">Leaderboard</h3>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {communityType === 'friends' ? <Home className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {communityType === 'friends' ? t('community.friends') : t('community.lorettaCommunity')}
          </Badge>
        </div>
        
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime" data-testid="tab-alltime">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-2">
            {displayEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">{t('leaderboard.noEntries', 'No rankings yet')}</p>
                <p className="text-sm">{t('leaderboard.noEntriesHint', 'Complete activities to appear on the leaderboard!')}</p>
              </div>
            ) : (
              displayEntries.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    entry.isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/30 hover-elevate'
                  } ${entry.rank <= 3 ? 'shadow-md' : ''}`}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className={`w-12 h-12 rounded-full bg-card flex items-center justify-center font-black text-lg ${getRankColor(entry.rank)}`}>
                    {getRankBadge(entry.rank)}
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
                      entry.change > 0 ? 'text-primary' : entry.change < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`} data-testid={`rank-change-${entry.rank}`}>
                      {entry.change > 0 ? <TrendingUp className="w-4 h-4" /> : entry.change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                      <span>{Math.abs(entry.change)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="text-center py-8 text-muted-foreground">
            Monthly rankings coming soon!
          </TabsContent>
          
          <TabsContent value="alltime" className="text-center py-8 text-muted-foreground">
            All-time rankings coming soon!
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
