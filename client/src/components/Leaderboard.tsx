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
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-chart-3 flex-shrink-0" />
            <h3 className="text-lg sm:text-2xl font-black text-foreground truncate">Leaderboard</h3>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 max-w-[140px] sm:max-w-none flex-shrink-0">
            {communityType === 'friends' ? <Home className="w-3 h-3 flex-shrink-0" /> : <Users className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate text-xs sm:text-sm">
              {communityType === 'friends' ? t('community.friends') : t('community.lorettaCommunity')}
            </span>
          </Badge>
        </div>
        
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="weekly" className="text-xs sm:text-sm py-2" data-testid="tab-weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm py-2" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime" className="text-xs sm:text-sm py-2" data-testid="tab-alltime">All Time</TabsTrigger>
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
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all ${
                    entry.isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/30 hover-elevate'
                  } ${entry.rank <= 3 ? 'shadow-md' : ''}`}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-card flex items-center justify-center font-black text-sm sm:text-lg flex-shrink-0 ${getRankColor(entry.rank)}`}>
                    {getRankBadge(entry.rank)}
                  </div>
                  
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-chart-2 text-white font-bold text-xs sm:text-sm">
                      {entry.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm sm:text-base truncate ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {entry.name}
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">You</Badge>
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {entry.xp.toLocaleString()} XP
                    </p>
                  </div>
                  
                  {entry.change !== undefined && (
                    <div className={`flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-bold flex-shrink-0 ${
                      entry.change > 0 ? 'text-primary' : entry.change < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`} data-testid={`rank-change-${entry.rank}`}>
                      {entry.change > 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : entry.change < 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" /> : null}
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
