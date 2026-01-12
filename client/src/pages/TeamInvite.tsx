import { useState, useEffect, ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  Users,
  Shield,
  Heart,
  Trophy,
  Flame,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from "@/lib/queryClient";

interface InviteInfo {
  id: string;
  teamId: string;
  inviteCode: string;
  createdBy: string;
  teamName: string;
  inviterUsername: string;
  expiresAt?: string;
}

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

export default function TeamInvite() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('code');
  
  useEffect(() => {
    if (!inviteCode) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }
    
    fetchInviteInfo();
  }, [inviteCode]);
  
  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/invites/${inviteCode}`));
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Invalid invite');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setInviteInfo(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invite information');
      setLoading(false);
    }
  };
  
  const handleAcceptInvite = async () => {
    if (!user || !inviteInfo || !consentChecked) return;
    
    setJoining(true);
    
    try {
      const response = await fetch(getApiUrl(`/api/invites/${inviteCode}/accept`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          consentGiven: consentChecked,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast({
          title: 'Failed to join team',
          description: data.error || 'Something went wrong',
          variant: 'destructive',
        });
        setJoining(false);
        return;
      }
      
      setJoined(true);
      toast({
        title: 'Welcome to the team!',
        description: `You've successfully joined ${inviteInfo.teamName}`,
      });
      
      setTimeout(() => {
        setLocation('/leaderboard');
      }, 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to accept invite',
        variant: 'destructive',
      });
      setJoining(false);
    }
  };
  
  const handleDecline = () => {
    setLocation('/my-dashboard');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <p className="text-gray-500 font-medium">Loading invite...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-8">
          <GlassCard className="p-8 text-center" glow>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Invite Not Found</h2>
            <p className="text-gray-500 font-medium mb-6">{error}</p>
            <Link href="/my-dashboard">
              <button className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all">
                Go to Dashboard
              </button>
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }
  
  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <GlassCard className="p-8 text-center" glow>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You're In!</h2>
            <p className="text-gray-500 font-medium mb-4">Welcome to {inviteInfo?.teamName}</p>
            <p className="text-sm text-gray-400">Redirecting to leaderboard...</p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] p-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <Link href="/my-dashboard">
            <button className="flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors">
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Team Invite</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6" glow>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#013DC4]/20">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                You're Invited!
              </h2>
              <p className="text-gray-500 font-medium">
                <span className="font-bold text-gray-900 dark:text-white">{inviteInfo?.inviterUsername}</span> invited you to join
              </p>
              <p className="text-xl font-black bg-gradient-to-r from-[#013DC4] to-[#0150FF] bg-clip-text text-transparent mt-2">{inviteInfo?.teamName}</p>
            </div>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Data Sharing Consent</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  By joining this team, you agree to share certain information with team members:
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">XP & Level</p>
                  <p className="text-xs text-gray-500">Your experience points and current level</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center shadow-lg">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Streak</p>
                  <p className="text-xs text-gray-500">Your current check-in streak</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Activity Status</p>
                  <p className="text-xs text-gray-500">Whether you've completed daily activities</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-sm">
              <p className="font-bold text-gray-900 dark:text-white mb-1 text-xs">What's NOT shared:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                <li>Your health questionnaire answers</li>
                <li>Your risk scores or health data</li>
                <li>Your chat conversations</li>
                <li>Your medication information</li>
              </ul>
            </div>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="consent" className="text-sm cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                I understand and agree to share my XP, level, and streak information with team members. I can leave the team and revoke this consent at any time.
              </label>
            </div>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[56px]"
            disabled={!consentChecked || joining}
            onClick={handleAcceptInvite}
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Join Team
              </>
            )}
          </button>
          
          <button
            className="w-full py-3 bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all"
            onClick={handleDecline}
          >
            Decline Invitation
          </button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Team Benefits</p>
                <p className="text-sm text-gray-500 font-medium">
                  Compete on leaderboards, support each other's health journey, and celebrate achievements together!
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
