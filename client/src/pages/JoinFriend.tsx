import { useState, useEffect, ReactNode } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { UserPlus, Check, X, Loader2, Users } from 'lucide-react';
import { Link } from 'wouter';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { authenticatedFetch } from "@/lib/queryClient";

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: ReactNode; 
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

export default function JoinFriend() {
  const { t } = useTranslation('pages');
  const { code } = useParams<{ code: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  useSwipeBack({ backPath: '/leaderboard' });
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_friends'>('loading');
  const [friendUsername, setFriendUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      localStorage.setItem('loretta_pending_friend_invite', code || '');
      navigate('/auth');
      return;
    }

    if (user && code) {
      acceptInvite();
    }
  }, [user, authLoading, code]);

  const acceptInvite = async () => {
    try {
      const response = await authenticatedFetch(`/api/friends/accept/${code}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFriendUsername(data.friendUsername);
        localStorage.removeItem('loretta_pending_friend_invite');
      } else {
        if (data.error === 'Already friends with this user') {
          setStatus('already_friends');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to accept invite');
        }
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <GlassCard className="max-w-md w-full p-8 text-center" glow>
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#013DC4]/20">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('joinFriend.loading.title')}</h2>
            <p className="text-gray-500 font-medium">{t('joinFriend.loading.message')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('joinFriend.success.title')}</h2>
            <p className="text-gray-500 font-medium mb-6">
              {t('joinFriend.success.message', { username: friendUsername })}
            </p>
            <Link href="/leaderboard">
              <button className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                {t('joinFriend.success.viewLeaderboard')}
              </button>
            </Link>
          </>
        )}

        {status === 'already_friends' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('joinFriend.alreadyFriends.title')}</h2>
            <p className="text-gray-500 font-medium mb-6">{t('joinFriend.alreadyFriends.message')}</p>
            <Link href="/leaderboard">
              <button className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all">
                {t('joinFriend.alreadyFriends.viewLeaderboard')}
              </button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <X className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('joinFriend.error.title')}</h2>
            <p className="text-gray-500 font-medium mb-6">{errorMessage}</p>
            <BackButton 
              href="/leaderboard" 
              className="w-full py-4 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl"
              data-testid="button-back" 
            />
          </>
        )}
      </GlassCard>
    </div>
  );
}
