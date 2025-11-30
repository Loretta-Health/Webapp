import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  QrCode,
  Share2,
  Copy,
  Check,
  Users,
  Sparkles,
  Gift,
  Zap,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

export default function Invite() {
  const [inviteCode, setInviteCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LORETTA-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  });
  
  const [copied, setCopied] = useState(false);
  const [invitesSent, setInvitesSent] = useState(3);
  const [invitesJoined, setInvitesJoined] = useState(1);
  
  const inviteUrl = `${window.location.origin}/join?code=${inviteCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Loretta',
          text: 'I invite you to join Loretta - a gamified health tracking app that makes staying healthy fun!',
          url: inviteUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err);
        }
      }
    } else {
      handleCopy();
    }
  };
  
  const regenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LORETTA-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Invite Friends</h1>
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
              <h2 className="text-2xl font-black text-foreground mb-2">Share Your QR Code</h2>
              <p className="text-muted-foreground">
                Friends can scan this to join Loretta
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
              <QRCodeSVG
                value={inviteUrl}
                size={200}
                level="H"
                includeMargin={false}
                data-testid="qr-code"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="text-center font-mono font-bold text-lg"
                  data-testid="invite-code-display"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={regenerateCode}
                  data-testid="button-regenerate-code"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                  data-testid="button-copy-link"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-chart-2"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-2 border-chart-3/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-foreground">Referral Rewards</p>
                  <p className="text-sm text-muted-foreground">Earn XP for each friend who joins!</p>
                </div>
              </div>
              <Badge className="bg-chart-3 text-white font-black">
                <Zap className="w-3 h-3 mr-1" />
                +100 XP
              </Badge>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border-0 shadow-xl">
            <h3 className="text-lg font-black text-foreground mb-4">Your Invite Stats</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-chart-2/10">
                <p className="text-3xl font-black text-primary" data-testid="invites-sent">{invitesSent}</p>
                <p className="text-sm text-muted-foreground">Invites Sent</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-3/10 to-chart-1/10">
                <p className="text-3xl font-black text-chart-3" data-testid="invites-joined">{invitesJoined}</p>
                <p className="text-sm text-muted-foreground">Friends Joined</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total XP Earned from Referrals</span>
                <span className="font-black text-primary">+{invitesJoined * 100} XP</span>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
            <div className="flex items-center gap-3">
              <img src={mascotImage} alt="Health Mascot" className="w-12 h-12 object-contain" />
              <div>
                <p className="font-bold text-foreground">Community Tip</p>
                <p className="text-sm text-muted-foreground">
                  Invite friends and family to join your health journey together. You can compare progress on the leaderboard!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-chart-3" />
              Milestone Rewards
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Invite 3 friends</span>
                <Badge variant="secondary">+250 XP</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm">Invite 5 friends</span>
                <Badge variant="secondary">+500 XP</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-chart-3/20 to-chart-1/20">
                <span className="text-sm font-bold">Invite 10 friends</span>
                <Badge className="bg-gradient-to-r from-chart-3 to-chart-1 text-white">+1000 XP + Badge</Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
