import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { 
  Trophy, 
  Users, 
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
  ChevronDown
} from 'lucide-react';
import { Link, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { type CommunityType } from '@/components/CommunitySelector';
import { trackEvent, trackPageView, ClarityEvents } from '@/lib/clarity';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import { getApiUrl } from "@/lib/queryClient";

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
  profilePhoto?: string | null;
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
  rare: 'from-[#013DC4] to-[#0150FF]',
  epic: 'from-purple-500 to-[#CDB6EF]',
  legendary: 'from-amber-500 to-yellow-400',
};

const rarityBgColors = {
  common: 'bg-emerald-500/10',
  rare: 'bg-[#013DC4]/10',
  epic: 'bg-purple-500/10',
  legendary: 'bg-amber-500/10',
};

const rarityBorderColors = {
  common: 'border-emerald-500/30',
  rare: 'border-[#013DC4]/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/30',
};

const rarityProgressBgColors = {
  common: 'bg-emerald-500/20',
  rare: 'bg-[#013DC4]/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-amber-500/20',
};

export default function LeaderboardPage() {
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const { user } = useAuth();
  useSwipeBack({ backPath: '/my-dashboard' });
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialCommunity = urlParams.get('community') as CommunityType | null;
  const initialTab = urlParams.get('tab') as 'leaderboard' | 'achievements' | null;
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>(initialTab === 'achievements' ? 'achievements' : 'leaderboard');
  
  useEffect(() => {
    trackPageView('leaderboard');
    trackEvent(ClarityEvents.LEADERBOARD_VIEWED);
  }, []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityType>(initialCommunity || 'loretta');
  const [userGamification, setUserGamification] = useState<{ xp: number; level: number; currentStreak: number } | null>(null);
  const [userProfilePhoto, setUserProfilePhoto] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchAchievements();
      fetchUserGamification();
      fetchFriends();
      fetchInviteCode();
      fetchUserProfile();
    }
  }, [user]);
  
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(getApiUrl('/api/profile'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfilePhoto(data?.profilePhoto || null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchUserGamification = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(getApiUrl('/api/gamification'), {
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

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const response = await fetch(getApiUrl('/api/friends'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data: Friend[] = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchInviteCode = async () => {
    try {
      const response = await fetch(getApiUrl('/api/friends/invite-code'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setInviteCode(data.inviteCode);
      }
    } catch (err) {
      console.error('Failed to fetch invite code:', err);
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
      const response = await fetch(getApiUrl('/api/achievements/user'), {
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
      const response = await fetch(getApiUrl('/api/teams/me'), {
        credentials: 'include',
      });
      const data = await response.json();
      setTeams(data);
      
      if (initialCommunity && initialCommunity !== 'loretta' && initialCommunity !== 'friends') {
        const matchingTeam = data.find((t: Team) => t.id === initialCommunity);
        if (matchingTeam) {
          setSelectedTeamId(matchingTeam.id);
          setSelectedCommunity('loretta');
        } else if (data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      } else if (data.length > 0) {
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
      const response = await fetch(getApiUrl(`/api/teams/${teamId}/members`), {
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
      isOwner: member.role === 'owner',
      profilePhoto: member.profilePhoto,
    }));
  };

  const displayEntries = getLeaderboardEntries();

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-white/10 safe-area-top">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-4 sm:pt-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton 
              href="/my-dashboard" 
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              iconClassName="text-gray-600 dark:text-gray-300"
              data-testid="button-back-dashboard" 
            />
            <div className="flex items-center gap-2">
              <img src={logomarkViolet} alt="Loretta" className="w-8 h-8" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('leaderboard.title')}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('leaderboard.achievementsUnlocked', { count: unlockedCount, total: totalCount })}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Tab Buttons */}
        <GlassCard className="p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold transition-all min-h-[48px] active:scale-95 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              {t('leaderboard.tabs.leaderboard')}
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold transition-all min-h-[48px] active:scale-95 ${
                activeTab === 'achievements'
                  ? 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Award className="w-4 h-4" />
              {t('leaderboard.tabs.achievements')}
            </button>
          </div>
        </GlassCard>

        {activeTab === 'leaderboard' && (
          <GlassCard className="overflow-hidden">
            {/* Section Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10 space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('leaderboard.teamRankings')}</h3>
                <Badge className="hidden sm:inline-flex bg-[#013DC4]/10 text-[#013DC4] border-0 text-xs">
                  {displayEntries.length} {displayEntries.length === 1 ? 'member' : 'members'}
                </Badge>
              </div>
              {/* Community Selector */}
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value as CommunityType)}
                className="block w-full bg-white dark:bg-gray-800 border border-[#013DC4]/20 rounded-xl px-4 py-3 text-sm font-semibold text-[#013DC4] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30"
              >
                <option value="loretta">{t('leaderboard.lorettaCommunity', 'Loretta Community')}</option>
                <option value="friends">{t('leaderboard.myFriends', 'My Friends')} ({(Array.isArray(friends) ? friends.length : 0) + 1})</option>
              </select>
            </div>
            
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-4">
            {/* Team Selector */}
            {selectedCommunity === 'loretta' && teams.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] active:scale-95 ${
                      selectedTeamId === team.id
                        ? 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {team.name}
                  </button>
                ))}
              </div>
            )}

            {/* Leaderboard Content */}
            {selectedCommunity === 'friends' ? (
              <div className="space-y-3">
                {loadingFriends || !userGamification ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#013DC4]" />
                  </div>
                ) : (
                  <>
                    {(() => {
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
                        ...friendsList.map(f => ({ ...f, isCurrentUser: false, profilePhoto: f.profilePhoto })),
                      ].sort((a, b) => b.xp - a.xp);
                      
                      return allParticipants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                            participant.isCurrentUser
                              ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border-2 border-[#013DC4]/30 shadow-lg'
                              : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                          }`}
                        >
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-base ${
                            index < 3 ? `${getRankBg(index + 1)} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            #{index + 1}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            {participant.profilePhoto && (
                              <AvatarImage src={participant.profilePhoto} alt={participant.username} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white font-bold">
                              {participant.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold flex items-center gap-2 truncate ${participant.isCurrentUser ? 'text-[#013DC4]' : 'text-gray-900 dark:text-white'}`}>
                              {participant.username}
                              {index === 0 && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                              {participant.isCurrentUser && (
                                <span className="text-xs bg-[#013DC4]/10 text-[#013DC4] px-2 py-0.5 rounded-full flex-shrink-0">{t('leaderboard.you')}</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                              <span className="font-medium">{participant.xp.toLocaleString()} XP</span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {participant.currentStreak}
                              </span>
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            Lv.{participant.level}
                          </div>
                        </motion.div>
                      ));
                    })()}
                    
                    <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('leaderboard.inviteFriends.title')}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {t('leaderboard.inviteFriends.message')}
                      </p>
                      {inviteCode && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                          <code className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-mono text-xs sm:text-sm break-all max-w-full overflow-hidden text-gray-700 dark:text-gray-300">
                            {window.location.origin}/join/{inviteCode}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
                            }}
                            className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white font-medium rounded-xl text-sm hover:opacity-90 transition-opacity"
                          >
                            {t('leaderboard.inviteFriends.copy')}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : loadingTeams ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('leaderboard.noTeams.title')}</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('leaderboard.noTeams.message')}
                </p>
                <Link href="/invite">
                  <button className="px-6 py-3 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white font-bold rounded-xl flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                    {t('leaderboard.noTeams.createTeam')}
                  </button>
                </Link>
              </div>
            ) : loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
              </div>
            ) : displayEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('leaderboard.waitingMembers.title')}</h4>
                <p className="text-gray-500 dark:text-gray-400">
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
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      entry.isCurrentUser
                        ? 'bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border-2 border-[#013DC4]/30 shadow-lg'
                        : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-base ${
                      entry.rank <= 3 ? `${getRankBg(entry.rank)} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      #{entry.rank}
                    </div>
                    
                    <Avatar className="w-10 h-10">
                      {entry.profilePhoto && (
                        <AvatarImage src={entry.profilePhoto} alt={entry.name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white font-bold">
                        {entry.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold flex items-center gap-2 truncate ${entry.isCurrentUser ? 'text-[#013DC4]' : 'text-gray-900 dark:text-white'}`}>
                        {entry.name}
                        {entry.isOwner && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        {entry.isCurrentUser && (
                          <span className="text-xs bg-[#013DC4]/10 text-[#013DC4] px-2 py-0.5 rounded-full flex-shrink-0">{t('leaderboard.you')}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                        <span className="font-medium">{entry.xp.toLocaleString()} XP</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak}
                        </span>
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      Lv.{entry.level}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            </div>
          </GlassCard>
        )}

        {activeTab === 'achievements' && (
          <GlassCard className="overflow-hidden">
            {/* Section Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-amber-500/5 to-yellow-500/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('leaderboard.tabs.achievements')}</h3>
                <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">
                  {unlockedCount}/{totalCount}
                </Badge>
              </div>
            </div>
            
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-4">
            {/* Achievement Progress */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('leaderboard.achievements.progress')}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{unlockedCount} / {totalCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="h-2 bg-gray-200 dark:bg-gray-700 mb-4" />

            {loadingAchievements ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
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
                      <div 
                        className={`p-4 rounded-3xl transition-all ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-r from-emerald-500/15 to-green-500/10 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                            : shouldHighlight
                              ? 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 shadow-xl'
                              : 'backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-white/30 dark:border-white/5 opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center shrink-0 shadow-lg ${
                            !shouldHighlight ? 'grayscale' : ''
                          }`}>
                            <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            {achievement.unlocked && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-bold ${achievement.unlocked ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{achievement.title}</p>
                              {achievement.unlocked && (
                                <Badge className="bg-emerald-500 text-white border-0 text-xs font-bold">
                                  UNLOCKED
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`text-xs capitalize ${
                                  achievement.rarity === 'legendary' ? 'border-amber-500 text-amber-500' :
                                  achievement.rarity === 'epic' ? 'border-purple-500 text-purple-500' :
                                  achievement.rarity === 'rare' ? 'border-[#013DC4] text-[#013DC4]' :
                                  'border-emerald-500 text-emerald-500'
                                }`}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{achievement.description}</p>
                            
                            {achievement.unlocked ? (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                {t('leaderboard.achievements.unlocked', { date: achievement.unlockedDate })}
                              </p>
                            ) : achievement.progress !== undefined && achievement.maxProgress !== undefined ? (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  <span>{t('leaderboard.achievements.progress')}</span>
                                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className={`h-1.5 ${rarityProgressBgColors[achievement.rarity]} ${hasNoProgress ? '[&>div]:bg-gray-400' : ''}`}
                                />
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('leaderboard.achievements.notUnlocked')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
