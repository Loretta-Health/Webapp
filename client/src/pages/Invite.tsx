import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ChevronRight, 
  Share2,
  Copy,
  Check,
  Users,
  Sparkles,
  Gift,
  Zap,
  Plus,
  Crown,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
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
}

interface TeamInvite {
  id: string;
  teamId: string;
  inviteCode: string;
  createdBy: string;
  expiresAt?: string;
  usedBy?: string;
}

export default function Invite() {
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamDetails(selectedTeam.id);
    }
  }, [selectedTeam]);
  
  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/teams/user/${user?.id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeam(data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setLoading(false);
    }
  };
  
  const fetchTeamDetails = async (teamId: string) => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/teams/${teamId}/members`, { credentials: 'include' }),
        fetch(`/api/teams/${teamId}/invites`, { credentials: 'include' }),
      ]);
      
      const members = await membersRes.json();
      const invites = await invitesRes.json();
      
      setTeamMembers(members);
      setTeamInvites(invites.filter((inv: TeamInvite) => !inv.usedBy));
    } catch (err) {
      console.error('Failed to fetch team details:', err);
    }
  };
  
  const createTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    
    setCreatingTeam(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create team');
      
      const team = await response.json();
      setTeams([...teams, team]);
      setSelectedTeam(team);
      setCreateDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      
      toast({
        title: 'Team Created!',
        description: `${team.name} is ready. Invite your friends and family!`,
      });
      
      fetchTeamDetails(team.id);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setCreatingTeam(false);
    }
  };
  
  const createInvite = async () => {
    if (!selectedTeam || !user) return;
    
    setCreatingInvite(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error('Failed to create invite');
      
      const invite = await response.json();
      setTeamInvites([...teamInvites, invite]);
      
      toast({
        title: 'Invite Created!',
        description: 'Share the link or QR code with your friend',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create invite',
        variant: 'destructive',
      });
    } finally {
      setCreatingInvite(false);
    }
  };
  
  const deleteInvite = async (inviteId: string) => {
    try {
      await fetch(`/api/invites/${inviteId}`, { 
        method: 'DELETE',
        credentials: 'include',
      });
      setTeamInvites(teamInvites.filter(inv => inv.id !== inviteId));
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete invite',
        variant: 'destructive',
      });
    }
  };
  
  const getInviteUrl = (inviteCode: string) => {
    return `${window.location.origin}/team-invite?code=${inviteCode}`;
  };
  
  const handleCopy = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(inviteCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleShare = async (inviteCode: string, teamName: string) => {
    const url = getInviteUrl(inviteCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${teamName} on Loretta`,
          text: `You've been invited to join ${teamName} on Loretta!`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy(inviteCode);
        }
      }
    } else {
      handleCopy(inviteCode);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">My Teams</h1>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Team</DialogTitle>
                <DialogDescription>
                  Create a team to invite family or friends to track health together
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g., My Family, Gym Buddies"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamDesc">Description (optional)</Label>
                  <Input
                    id="teamDesc"
                    placeholder="What's this team about?"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTeam} disabled={!newTeamName.trim() || creatingTeam}>
                  {creatingTeam ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Team
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4 space-y-6">
        {teams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-black mb-2">No Teams Yet</h2>
              <p className="text-muted-foreground mb-4">
                Create a team to invite family or friends and compare progress on the leaderboard!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </Card>
          </motion.div>
        ) : (
          <>
            {teams.length > 1 && (
              <Tabs value={selectedTeam?.id} onValueChange={(id) => {
                const team = teams.find(t => t.id === id);
                if (team) setSelectedTeam(team);
              }}>
                <TabsList className="w-full">
                  {teams.map(team => (
                    <TabsTrigger key={team.id} value={team.id} className="flex-1">
                      {team.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            
            {selectedTeam && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-0 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-black">{selectedTeam.name}</h2>
                        {selectedTeam.description && (
                          <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
                        )}
                      </div>
                      <Badge className="bg-primary">
                        <Users className="w-3 h-3 mr-1" />
                        {teamMembers.length} members
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            {member.role === 'owner' && (
                              <Crown className="w-4 h-4 text-chart-3" />
                            )}
                            <span className="font-medium">{member.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Lvl {member.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              {member.xp} XP
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black">Team Invites</h3>
                      <Button size="sm" onClick={createInvite} disabled={creatingInvite}>
                        {creatingInvite ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            New Invite
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {teamInvites.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No active invites</p>
                        <p className="text-sm">Create an invite to share with friends</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {teamInvites.map((invite) => (
                          <div key={invite.id} className="p-4 rounded-xl border bg-card">
                            <div className="flex justify-center mb-4">
                              <div className="bg-white p-3 rounded-xl">
                                <QRCodeSVG
                                  value={getInviteUrl(invite.inviteCode)}
                                  size={120}
                                  level="H"
                                />
                              </div>
                            </div>
                            
                            <div className="text-center mb-3">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {invite.inviteCode}
                              </code>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleCopy(invite.inviteCode)}
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-4 h-4 mr-1 text-primary" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleShare(invite.inviteCode, selectedTeam.name)}
                              >
                                <Share2 className="w-4 h-4 mr-1" />
                                Share
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteInvite(invite.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </>
            )}
          </>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
