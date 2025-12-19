import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { UserPlus, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function JoinFriend() {
  const { t } = useTranslation('pages');
  const { code } = useParams<{ code: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
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
      const response = await fetch(`/api/friends/accept/${code}`, {
        method: 'POST',
        credentials: 'include',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('joinFriend.loading.title')}</h2>
            <p className="text-muted-foreground">{t('joinFriend.loading.message')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('joinFriend.success.title')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('joinFriend.success.message', { username: friendUsername })}
            </p>
            <Link href="/leaderboard">
              <Button className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('joinFriend.success.viewLeaderboard')}
              </Button>
            </Link>
          </>
        )}

        {status === 'already_friends' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('joinFriend.alreadyFriends.title')}</h2>
            <p className="text-muted-foreground mb-6">{t('joinFriend.alreadyFriends.message')}</p>
            <Link href="/leaderboard">
              <Button className="w-full">
                {t('joinFriend.alreadyFriends.viewLeaderboard')}
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('joinFriend.error.title')}</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Link href="/leaderboard">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('joinFriend.error.goBack')}
              </Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
