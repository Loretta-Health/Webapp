import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Crown, Flame, Loader2, ChevronDown } from 'lucide-react';
import type { CommunityType } from './CommunitySelector';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { getApiUrl } from "@/lib/queryClient";

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
  profilePhoto?: string | null;
}

interface Friend {
  id: string;
  username: string;
  xp: number;
  level: number;
  currentStreak: number;
  profilePhoto?: string | null;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level?: number;
  streak?: number;
  isCurrentUser?: boolean;
  profilePhoto?: string | null;
}

interface LeaderboardProps {
  className?: string;
  communityType?: CommunityType;
  maxEntries?: number;
}

export default function Leaderboard({
  className = '',
  communityType: initialCommunityType = 'loretta',
  maxEntries = 5
}: LeaderboardProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityType>(initialCommunityType);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [userGamification, setUserGamification] = useState<{ xp: number; level: number; currentStreak: number } | null>(null);
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    setSelectedCommunity(initialCommunityType);
  }, [initialCommunityType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, gamificationRes, friendsRes, profileRes] = await Promise.all([
        fetch(getApiUrl('/api/teams/me'), { credentials: 'include' }),
        fetch(getApiUrl('/api/gamification'), { credentials: 'include' }),
        fetch(getApiUrl('/api/friends'), { credentials: 'include' }),
        fetch(getApiUrl('/api/profile'), { credentials: 'include' }),
      ]);

      if (gamificationRes.ok) {
        const gamData = await gamificationRes.json();
        setUserGamification({
          xp: gamData.xp || 0,
          level: gamData.level || 1,
          currentStreak: gamData.currentStreak || 0,
        });
      }
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfilePhoto(profileData?.profilePhoto || null);
      }

      if (friendsRes.ok) {
        const friendsData: Friend[] = await friendsRes.json();
        setFriends(friendsData);
      }

      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        if (teams.length > 0) {
          const membersRes = await fetch(getApiUrl(`/api/teams/${teams[0].id}/members`), {
            credentials: 'include',
          });
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            setTeamMembers(membersData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const getLorettaEntries = (): LeaderboardEntry[] => {
    if (!Array.isArray(teamMembers)) return [];
    
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
      profilePhoto: member.profilePhoto,
    }));
  };

  const getFriendsEntries = (): LeaderboardEntry[] => {
    const friendsList = Array.isArray(friends) ? friends : [];
    const allParticipants = [
      ...(user && userGamification ? [{
        id: user.id,
        username: user.username,
        xp: userGamification.xp,
        level: userGamification.level,
        currentStreak: userGamification.currentStreak,
        isCurrentUser: true,
        profilePhoto: userProfilePhoto,
      }] : []),
      ...friendsList.map(f => ({ ...f, username: f.username, isCurrentUser: false, profilePhoto: f.profilePhoto })),
    ].sort((a, b) => b.xp - a.xp);
    
    return allParticipants.map((participant, index) => ({
      rank: index + 1,
      name: participant.username,
      xp: participant.xp,
      level: participant.level,
      streak: participant.currentStreak,
      isCurrentUser: participant.isCurrentUser,
      profilePhoto: participant.profilePhoto,
    }));
  };

  const getContextualEntries = (allEntries: LeaderboardEntry[]): LeaderboardEntry[] => {
    if (allEntries.length === 0) return [];
    
    const userIndex = allEntries.findIndex(e => e.isCurrentUser);
    if (userIndex === -1) return allEntries.slice(0, 3);
    
    const result: LeaderboardEntry[] = [];
    
    if (userIndex > 0) {
      result.push(allEntries[userIndex - 1]);
    }
    
    result.push(allEntries[userIndex]);
    
    if (userIndex < allEntries.length - 1) {
      result.push(allEntries[userIndex + 1]);
    }
    
    return result;
  };

  const allEntries = selectedCommunity === 'friends' 
    ? getFriendsEntries()
    : getLorettaEntries();
  
  const totalMembers = allEntries.length;
  const displayEntries = getContextualEntries(allEntries);
  
  return (
    <div className={className} data-testid="leaderboard">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Badge className="hidden sm:inline-flex bg-[#013DC4]/10 text-[#013DC4] border-0 text-xs">
          {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
        </Badge>
        <div className="relative flex-1 sm:flex-none">
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value as CommunityType)}
            className="w-full sm:w-auto appearance-none bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border border-[#013DC4]/20 rounded-xl px-3 py-2 sm:py-1.5 pr-8 text-xs font-semibold text-[#013DC4] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 cursor-pointer"
          >
            <option value="loretta">{t('community.lorettaCommunity', 'Loretta Community')}</option>
            <option value="friends">{t('community.friends', 'My Friends')} ({(Array.isArray(friends) ? friends.length : 0) + 1})</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#013DC4] pointer-events-none" />
        </div>
      </div>
      
      <div className="space-y-3">
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
          displayEntries.map((entry, index) => (
            <motion.div
              key={`${entry.name}-${entry.rank}`}
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
                {entry.profilePhoto && (
                  <AvatarImage src={entry.profilePhoto} alt={entry.name} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white font-bold text-xs sm:text-sm">
                  {entry.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm sm:text-base truncate flex items-center gap-2 ${entry.isCurrentUser ? 'text-[#013DC4]' : 'text-gray-900 dark:text-white'}`}>
                  {entry.name}
                  {entry.rank === 1 && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  {entry.isCurrentUser && (
                    <span className="text-[10px] sm:text-xs bg-[#013DC4]/10 text-[#013DC4] px-2 py-0.5 rounded-full flex-shrink-0">{t('leaderboard.you', 'You')}</span>
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
    </div>
  );
}
