import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Users, Home, Crown, Flame, Loader2 } from 'lucide-react';
import type { CommunityType } from './CommunitySelector';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level?: number;
  streak?: number;
  change?: number;
  isCurrentUser?: boolean;
  isFamily?: boolean;
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  currentUserRank?: number;
  className?: string;
  communityType?: CommunityType;
  loading?: boolean;
}

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl
      ${glow ? 'shadow-[#013DC4]/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default function Leaderboard({
  entries = [],
  currentUserRank = 4,
  className = '',
  communityType = 'loretta',
  loading = false
}: LeaderboardProps) {
  const { t } = useTranslation('dashboard');
  const displayEntries = entries;

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700';
    return 'bg-gray-100 dark:bg-gray-800';
  };
  
  return (
    <GlassCard className={`overflow-hidden ${className}`} data-testid="leaderboard">
      <div className="p-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('sidebar.leaderboard', 'Leaderboard')}</h3>
          <Badge className="bg-[#013DC4]/10 text-[#013DC4] border-0 text-xs">
            {communityType === 'friends' ? <Home className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
            {communityType === 'friends' ? t('community.friends') : t('community.lorettaCommunity')}
          </Badge>
        </div>
      </div>
      
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#013DC4]" />
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-500 dark:text-gray-400">{t('leaderboard.noEntries', 'No rankings yet')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('leaderboard.noEntriesHint', 'Complete activities to appear on the leaderboard!')}</p>
          </div>
        ) : (
          displayEntries.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all ${
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border-2 border-[#013DC4]/30 shadow-lg'
                  : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
              }`}
              data-testid={`leaderboard-entry-${entry.rank}`}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                entry.rank <= 3 ? `${getRankBg(entry.rank)} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                #{entry.rank}
              </div>
              
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white font-bold text-xs sm:text-sm">
                  {entry.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm sm:text-base truncate flex items-center gap-2 ${entry.isCurrentUser ? 'text-[#013DC4]' : 'text-gray-900 dark:text-white'}`}>
                  {entry.name}
                  {entry.rank === 1 && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  {entry.isCurrentUser && (
                    <span className="text-[10px] sm:text-xs bg-[#013DC4]/10 text-[#013DC4] px-2 py-0.5 rounded-full flex-shrink-0">You</span>
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                  <span className="font-medium">{entry.xp.toLocaleString()} XP</span>
                  {entry.streak !== undefined && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {entry.streak}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
