import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
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
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface InviteInfo {
  id: string;
  teamId: string;
  inviteCode: string;
  createdBy: string;
  teamName: string;
  inviterUsername: string;
  expiresAt?: string;
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
      const response = await fetch(`/api/invites/${inviteCode}`);
      
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
      const response = await fetch(`/api/invites/${inviteCode}/accept`, {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <div className="bg-gradient-to-r from-destructive via-destructive to-destructive/80 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/my-dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-white" />
              <h1 className="text-lg font-black text-white">Invalid Invite</h1>
            </div>
            <div className="w-16" />
          </div>
        </div>
        
        <div className="max-w-md mx-auto p-4 mt-8">
          <Card className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-black mb-2">Invite Not Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/my-dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }
  
  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-2">You're In!</h2>
          <p className="text-muted-foreground mb-4">Welcome to {inviteInfo?.teamName}</p>
          <p className="text-sm text-muted-foreground">Redirecting to leaderboard...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Team Invite</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-0 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">
                You're Invited!
              </h2>
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground">{inviteInfo?.inviterUsername}</span> invited you to join
              </p>
              <p className="text-xl font-black text-primary mt-2">{inviteInfo?.teamName}</p>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 border-2 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-foreground">Data Sharing Consent</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  By joining this team, you agree to share certain information with team members:
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">XP & Level</p>
                  <p className="text-xs text-muted-foreground">Your experience points and current level</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <Flame className="w-5 h-5 text-chart-3" />
                <div>
                  <p className="font-semibold text-sm">Streak</p>
                  <p className="text-xs text-muted-foreground">Your current check-in streak</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60">
                <Heart className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-semibold text-sm">Activity Status</p>
                  <p className="text-xs text-muted-foreground">Whether you've completed daily activities</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-primary/10 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">What's NOT shared:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your health questionnaire answers</li>
                <li>Your risk scores or health data</li>
                <li>Your chat conversations</li>
                <li>Your medication information</li>
              </ul>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="text-sm cursor-pointer">
              I understand and agree to share my XP, level, and streak information with team members. I can leave the team and revoke this consent at any time.
            </label>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Button
            className="w-full h-14 text-lg font-black bg-gradient-to-r from-primary to-chart-2"
            disabled={!consentChecked || joining}
            onClick={handleAcceptInvite}
          >
            {joining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Join Team
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDecline}
          >
            Decline Invitation
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
            <div className="flex items-center gap-3">
              <img src={mascotImage} alt="Health Mascot" className="w-12 h-12 object-contain" />
              <div>
                <p className="font-bold text-foreground">Team Benefits</p>
                <p className="text-sm text-muted-foreground">
                  Compete on leaderboards, support each other's health journey, and celebrate achievements together!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
