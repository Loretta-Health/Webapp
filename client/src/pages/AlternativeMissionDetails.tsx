import { useState } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Zap, 
  Check, 
  Sparkles,
  Heart,
  Brain,
  Leaf,
  Droplets,
  RefreshCw,
  Dumbbell,
  Flame,
  Activity,
  Footprints,
  Moon,
  Wind,
  Clock,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from '@/components/MascotCharacter';
import { useMissions } from '@/hooks/useMissions';

interface AlternativeMissionData {
  id: string;
  title: string;
  icon: string;
  frequency: string;
  description: string;
  xpReward: number;
  totalSteps: number;
  color: string;
  details: string;
  benefits: { icon: LucideIcon; text: string }[];
  communityTip: string;
  stepLabel: string;
  replacesId: string;
  replacesTitle: string;
}

const colorClasses: Record<string, { card: string; iconBg: string; badge: string; button: string }> = {
  'chart-1': {
    card: 'bg-gradient-to-br from-chart-1/10 via-card to-card border-chart-1/20',
    iconBg: 'bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg shadow-chart-1/30',
    badge: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
    button: 'bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90'
  },
  'chart-2': {
    card: 'bg-gradient-to-br from-chart-2/10 via-card to-card border-chart-2/20',
    iconBg: 'bg-gradient-to-br from-chart-2 to-emerald-500 shadow-lg shadow-chart-2/30',
    badge: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    button: 'bg-gradient-to-r from-chart-2 to-emerald-500 hover:from-chart-2/90 hover:to-emerald-500/90'
  },
  'chart-3': {
    card: 'bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20',
    iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90'
  },
  'chart-4': {
    card: 'bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90'
  }
};

const alternativeMissionsDatabase: Record<string, AlternativeMissionData> = {
  'sip-water': {
    id: 'sip-water',
    title: 'Sip Water Slowly',
    icon: '💧',
    frequency: 'daily',
    description: 'Drink 4 glasses of water at your own pace - a gentler hydration goal.',
    xpReward: 30,
    totalSteps: 4,
    color: 'chart-2',
    details: 'When you\'re feeling low, staying hydrated is still important but can feel overwhelming. This gentler alternative lets you hydrate at your own pace.',
    benefits: [
      { icon: Droplets, text: 'Hydrates your body' },
      { icon: Leaf, text: 'Gentle pace' },
      { icon: Brain, text: 'Promotes relaxation' },
      { icon: Heart, text: 'Supports wellbeing' },
    ],
    communityTip: 'Keep a water bottle nearby. Small sips throughout the day add up!',
    stepLabel: 'Glass',
    replacesId: 'water-glasses',
    replacesTitle: 'Drink 8 glasses of water'
  },
  'gentle-stretching': {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    icon: '🧘',
    frequency: 'daily',
    description: 'Do 5 minutes of gentle stretching - a calming alternative to intense exercise.',
    xpReward: 50,
    totalSteps: 5,
    color: 'chart-3',
    details: 'When you\'re not feeling up for jumping jacks, gentle stretching is a wonderful way to get your body moving without the intensity.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    communityTip: 'Focus on your breathing while stretching. Even 5 minutes can make a big difference.',
    stepLabel: 'Minute',
    replacesId: 'jumping-jacks',
    replacesTitle: 'Complete 10 jumping jacks'
  },
  'short-walk': {
    id: 'short-walk',
    title: 'Short Walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Take a 5-minute easy walk - move at your own comfortable pace.',
    xpReward: 45,
    totalSteps: 5,
    color: 'chart-1',
    details: 'A shorter, gentler walk is perfect when you\'re not feeling up for a full 10-minute walk. Any movement is beneficial!',
    benefits: [
      { icon: Footprints, text: 'Easy movement' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'Fresh air' },
    ],
    communityTip: 'A short walk around your home or office counts too. Every step matters!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  'rest-breathe': {
    id: 'rest-breathe',
    title: 'Rest & Breathe',
    icon: '💨',
    frequency: 'daily',
    description: 'Take 3 slow, deep breaths - the gentlest form of mindfulness.',
    xpReward: 25,
    totalSteps: 3,
    color: 'chart-4',
    details: 'When a full breathing exercise feels like too much, just take 3 slow breaths. It\'s the simplest way to center yourself.',
    benefits: [
      { icon: Wind, text: 'Calms your mind' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Takes only seconds' },
    ],
    communityTip: 'Breathe in for 4 counts, out for 4 counts. That\'s all you need.',
    stepLabel: 'Breath',
    replacesId: 'deep-breathing',
    replacesTitle: 'Practice deep breathing'
  },
  'quiet-rest': {
    id: 'quiet-rest',
    title: 'Quiet Rest',
    icon: '🌙',
    frequency: 'daily',
    description: 'Take 3 minutes of quiet rest - just be still and breathe.',
    xpReward: 40,
    totalSteps: 3,
    color: 'chart-2',
    details: 'Sometimes meditation feels like too much. Quiet rest means simply sitting still without any pressure to clear your mind.',
    benefits: [
      { icon: Moon, text: 'Peaceful pause' },
      { icon: Heart, text: 'Calms your body' },
      { icon: Brain, text: 'Mental rest' },
      { icon: Leaf, text: 'No pressure' },
    ],
    communityTip: 'Find a comfortable spot, close your eyes if you want, and just be. That\'s it.',
    stepLabel: 'Minute',
    replacesId: 'meditation',
    replacesTitle: 'Meditate for 5 minutes'
  },
  '101': {
    id: 'sip-water',
    title: 'Sip Water Slowly',
    icon: '💧',
    frequency: 'daily',
    description: 'Drink 4 glasses of water at your own pace.',
    xpReward: 30,
    totalSteps: 4,
    color: 'chart-2',
    details: 'A gentler hydration goal for when you\'re not feeling your best.',
    benefits: [
      { icon: Droplets, text: 'Hydrates your body' },
      { icon: Leaf, text: 'Gentle pace' },
      { icon: Brain, text: 'Promotes relaxation' },
      { icon: Heart, text: 'Supports wellbeing' },
    ],
    communityTip: 'Keep a water bottle nearby. Small sips add up!',
    stepLabel: 'Glass',
    replacesId: 'water-glasses',
    replacesTitle: 'Drink 8 glasses of water'
  },
  '102': {
    id: 'sip-water',
    title: 'Sip Water Slowly',
    icon: '💧',
    frequency: 'daily',
    description: 'Drink 4 glasses of water at your own pace.',
    xpReward: 30,
    totalSteps: 4,
    color: 'chart-1',
    details: 'A gentler hydration goal for when you\'re not feeling your best.',
    benefits: [
      { icon: Droplets, text: 'Natural hydration' },
      { icon: Zap, text: 'No pressure' },
      { icon: Leaf, text: 'Take your time' },
      { icon: Heart, text: 'Self-care first' },
    ],
    communityTip: 'Keep a water bottle nearby. Small sips add up!',
    stepLabel: 'Glass',
    replacesId: 'water-glasses',
    replacesTitle: 'Drink 8 glasses of water'
  },
  '201': {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    icon: '🧘',
    frequency: 'daily',
    description: 'Do 5 minutes of gentle stretching instead.',
    xpReward: 50,
    totalSteps: 5,
    color: 'chart-2',
    details: 'A calming alternative to intense exercise when you need something gentler.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    communityTip: 'Focus on your breathing while stretching.',
    stepLabel: 'Minute',
    replacesId: 'jumping-jacks',
    replacesTitle: 'Complete 10 jumping jacks'
  },
  '202': {
    id: 'short-walk',
    title: 'Short Walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Take a 5-minute easy walk - move at your own comfortable pace.',
    xpReward: 45,
    totalSteps: 5,
    color: 'chart-1',
    details: 'A shorter, gentler walk is perfect when you\'re not feeling up for a full 10-minute walk. Any movement is beneficial!',
    benefits: [
      { icon: Footprints, text: 'Easy movement' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'Fresh air' },
    ],
    communityTip: 'A short walk around your home or office counts too. Every step matters!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '301': {
    id: 'quiet-rest',
    title: 'Quiet Rest',
    icon: '🌙',
    frequency: 'daily',
    description: 'Take 3 minutes of quiet rest - just be still and breathe.',
    xpReward: 40,
    totalSteps: 3,
    color: 'chart-3',
    details: 'Sometimes meditation feels like too much. Quiet rest means simply sitting still without any pressure to clear your mind.',
    benefits: [
      { icon: Moon, text: 'Peaceful pause' },
      { icon: Heart, text: 'Calms your body' },
      { icon: Brain, text: 'Mental rest' },
      { icon: Leaf, text: 'No pressure' },
    ],
    communityTip: 'Find a comfortable spot, close your eyes if you want, and just be. That\'s it.',
    stepLabel: 'Minute',
    replacesId: 'meditation',
    replacesTitle: 'Meditate for 5 minutes'
  },
  '302': {
    id: 'short-walk',
    title: 'Short Walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Take a 5-minute easy walk - move at your own comfortable pace.',
    xpReward: 45,
    totalSteps: 5,
    color: 'chart-4',
    details: 'A shorter, gentler walk is perfect when you\'re not feeling up for a full 10-minute walk.',
    benefits: [
      { icon: Footprints, text: 'Easy movement' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'Fresh air' },
    ],
    communityTip: 'A short walk around your home or office counts too. Every step matters!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '401': {
    id: 'short-walk',
    title: 'Short Walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Take a 5-minute easy walk instead of a longer walk.',
    xpReward: 45,
    totalSteps: 5,
    color: 'chart-3',
    details: 'A shorter, gentler walk is perfect when you\'re not feeling up for a full 10-minute walk.',
    benefits: [
      { icon: Footprints, text: 'Easy movement' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'Fresh air' },
    ],
    communityTip: 'A short walk around your home or office counts too!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '402': {
    id: 'short-walk',
    title: 'Short Walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Take a 5-minute easy walk instead of a longer walk.',
    xpReward: 45,
    totalSteps: 5,
    color: 'chart-2',
    details: 'A shorter, gentler walk is perfect when you\'re not feeling up for a full 10-minute walk.',
    benefits: [
      { icon: Footprints, text: 'Easy movement' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'Fresh air' },
    ],
    communityTip: 'A short walk around your home or office counts too!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '501': {
    id: 'rest-breathe',
    title: 'Rest & Breathe',
    icon: '💨',
    frequency: 'daily',
    description: 'Take 3 slow, deep breaths - the gentlest form of mindfulness.',
    xpReward: 25,
    totalSteps: 3,
    color: 'chart-1',
    details: 'When a full breathing exercise feels like too much, just take 3 slow breaths. It\'s the simplest way to center yourself.',
    benefits: [
      { icon: Wind, text: 'Calms your mind' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Takes only seconds' },
    ],
    communityTip: 'Breathe in for 4 counts, out for 4 counts. That\'s all you need.',
    stepLabel: 'Breath',
    replacesId: 'deep-breathing',
    replacesTitle: 'Practice deep breathing'
  },
  '502': {
    id: 'rest-breathe',
    title: 'Rest & Breathe',
    icon: '💨',
    frequency: 'daily',
    description: 'Take 3 slow, deep breaths - the gentlest form of mindfulness.',
    xpReward: 25,
    totalSteps: 3,
    color: 'chart-3',
    details: 'When a full breathing exercise feels like too much, just take 3 slow breaths.',
    benefits: [
      { icon: Wind, text: 'Calms your mind' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Takes only seconds' },
    ],
    communityTip: 'Breathe in for 4 counts, out for 4 counts. That\'s all you need.',
    stepLabel: 'Breath',
    replacesId: 'deep-breathing',
    replacesTitle: 'Practice deep breathing'
  },
  '601': {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    icon: '🧘',
    frequency: 'daily',
    description: 'Do 5 minutes of gentle stretching - a calming alternative.',
    xpReward: 50,
    totalSteps: 5,
    color: 'chart-2',
    details: 'Gentle stretching is a wonderful way to get your body moving without intensity.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    communityTip: 'Focus on your breathing while stretching. Even 5 minutes can make a big difference.',
    stepLabel: 'Minute',
    replacesId: 'jumping-jacks',
    replacesTitle: 'Complete 10 jumping jacks'
  },
  '602': {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    icon: '🧘',
    frequency: 'daily',
    description: 'Do 5 minutes of gentle stretching - a calming alternative.',
    xpReward: 50,
    totalSteps: 5,
    color: 'chart-4',
    details: 'Gentle stretching is a wonderful way to get your body moving without intensity.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    communityTip: 'Focus on your breathing while stretching.',
    stepLabel: 'Minute',
    replacesId: 'jumping-jacks',
    replacesTitle: 'Complete 10 jumping jacks'
  }
};

export default function AlternativeMissionDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const altId = params.get('id') || '101';
  const originalMissionId = params.get('original') || '1';
  
  const { activateAlternativeMission, isActivatingAlternative, missions } = useMissions();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReplaced, setIsReplaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const missionData = alternativeMissionsDatabase[altId];
  
  if (!missionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Mission not found</p>
          <Link href="/my-dashboard">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const colors = colorClasses[missionData.color] || colorClasses['chart-1'];
  
  const alreadyActive = missions.some(m => m.missionKey === missionData.id || m.id === missionData.id);
  
  const handleReplaceMission = async () => {
    setError(null);
    try {
      // Use missionData.id instead of altId to ensure we pass the database mission key
      const missionKey = missionData.id;
      await activateAlternativeMission(missionData.replacesId, missionKey);
      setShowSuccess(true);
      setIsReplaced(true);
      
      setTimeout(() => {
        navigate('/my-dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to activate alternative mission';
      if (errorMessage.includes('low mood')) {
        setError('Alternative missions are only available when you check in with a low mood today. Try checking in first!');
      } else {
        setError(errorMessage);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-card rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-black text-foreground mb-2">Mission Replaced!</h3>
              <p className="text-muted-foreground">
                "{missionData.title}" is now your active mission
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="sticky top-0 z-40 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/mission-details?id=${originalMissionId}`}>
            <Button size="icon" variant="ghost">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">Alternative Mission</h1>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-6 ${colors.card}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors.iconBg} text-3xl`}>
                {missionData.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-foreground">
                    {missionData.title}
                  </h2>
                </div>
                <Badge className={colors.badge}>
                  {missionData.frequency}
                </Badge>
                <p className="text-muted-foreground mt-2">
                  {missionData.description}
                </p>
              </div>
              
              <MascotCharacter 
                size="sm" 
                pose="encourage"
                speech="Try this!"
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary fill-primary" />
                <span className="font-black text-primary">
                  +{missionData.xpReward} XP per step
                </span>
              </div>
              <Badge variant="outline" className="font-bold">
                {missionData.totalSteps} {missionData.stepLabel}s total
              </Badge>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>Replaces: <strong className="text-foreground">{missionData.replacesTitle}</strong> (for today only)</span>
              </div>
            </div>
            
            {error && (
              <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <Button
              size="lg"
              className={`w-full font-black text-white ${colors.button} ${isReplaced || alreadyActive || isActivatingAlternative ? '' : 'animate-pulse-glow'}`}
              disabled={isReplaced || alreadyActive || isActivatingAlternative}
              onClick={handleReplaceMission}
            >
              {isReplaced ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Activated for Today!
                </>
              ) : alreadyActive ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Already Active
                </>
              ) : isActivatingAlternative ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Activate for Today
                </>
              )}
            </Button>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-black text-foreground mb-3">About This Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              {missionData.details}
            </p>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-black text-foreground mb-4">Benefits</h3>
            <div className="grid grid-cols-2 gap-3">
              {missionData.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-chart-2/10 to-transparent rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2/20 to-chart-2/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-chart-2" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-black text-foreground mb-4">How It Works</h3>
            <div className="space-y-3">
              {Array.from({ length: missionData.totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-foreground">{missionData.stepLabel} #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Zap className="w-4 h-4 fill-primary" />
                    <span className="text-sm font-bold">+{missionData.xpReward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 bg-gradient-to-r from-chart-2/10 to-primary/10 border-chart-2/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-black text-foreground mb-1">Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  {missionData.communityTip}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">Medical Disclaimer</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                Loretta is not a diagnostic tool. Always consult your healthcare provider before starting any new exercise or wellness routine.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
