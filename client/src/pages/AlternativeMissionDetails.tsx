import { useState, useMemo } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
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
  Undo2,
  XCircle,
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
  },
  '3001': {
    id: 'indoor-walk-short',
    title: 'Walk Around Your Home',
    icon: '🏠',
    frequency: 'daily',
    description: 'Take a 5-minute walk around your home - perfect for bad weather days.',
    xpReward: 30,
    totalSteps: 5,
    color: 'chart-1',
    details: 'When the weather outside is not ideal, you can still get your steps in by walking around your home. Move from room to room, take the stairs if you have them.',
    benefits: [
      { icon: Footprints, text: 'Keeps you moving' },
      { icon: Heart, text: 'Gentle cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Leaf, text: 'No weather worries' },
    ],
    communityTip: 'Try walking while listening to a podcast or your favorite music!',
    stepLabel: 'Minute',
    replacesId: 'activity-steps',
    replacesTitle: '5 minute outdoor walk'
  },
  '3002': {
    id: 'march-in-place-short',
    title: 'March in Place',
    icon: '🚶',
    frequency: 'daily',
    description: 'March in place for 3 minutes - easy indoor activity.',
    xpReward: 25,
    totalSteps: 3,
    color: 'chart-2',
    details: 'Marching in place is a simple but effective way to get your blood flowing without needing any space or equipment.',
    benefits: [
      { icon: Activity, text: 'Easy to do anywhere' },
      { icon: Heart, text: 'Gets heart pumping' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Zap, text: 'Boosts energy' },
    ],
    communityTip: 'Lift your knees high and swing your arms for more intensity!',
    stepLabel: 'Minute',
    replacesId: 'activity-steps',
    replacesTitle: '5 minute outdoor walk'
  },
  '3003': {
    id: 'light-indoor-exercises',
    title: 'Light Indoor Exercises',
    icon: '🏃',
    frequency: 'daily',
    description: 'Do light indoor exercises for a few minutes.',
    xpReward: 25,
    totalSteps: 3,
    color: 'chart-3',
    details: 'A mix of simple exercises you can do indoors: arm circles, leg lifts, toe touches, and gentle twists.',
    benefits: [
      { icon: Activity, text: 'Full body movement' },
      { icon: Heart, text: 'Improves circulation' },
      { icon: Brain, text: 'Refreshes your mind' },
      { icon: Leaf, text: 'Gentle on joints' },
    ],
    communityTip: 'Start slowly and increase intensity as you warm up.',
    stepLabel: 'Exercise',
    replacesId: 'activity-steps',
    replacesTitle: '5 minute outdoor walk'
  },
  '4001': {
    id: 'indoor-walk-long',
    title: 'Walk Around Your Home',
    icon: '🏠',
    frequency: 'daily',
    description: 'Take a 10-minute walk around your home - perfect for bad weather days.',
    xpReward: 45,
    totalSteps: 10,
    color: 'chart-1',
    details: 'When outdoor walking is not possible, walking around your home is a great alternative. Use hallways, walk up and down stairs, or create a path through different rooms.',
    benefits: [
      { icon: Footprints, text: 'Same step benefits' },
      { icon: Heart, text: 'Good cardio' },
      { icon: Brain, text: 'Mental refresh' },
      { icon: Leaf, text: 'Weather-proof' },
    ],
    communityTip: 'Put on comfortable shoes even indoors for better support!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '4002': {
    id: 'march-in-place-long',
    title: 'March in Place',
    icon: '🚶',
    frequency: 'daily',
    description: 'March in place for 5 minutes - easy indoor cardio.',
    xpReward: 40,
    totalSteps: 5,
    color: 'chart-2',
    details: 'Marching in place gets your heart rate up and your legs moving without needing to go outside. Great for any weather!',
    benefits: [
      { icon: Activity, text: 'No equipment needed' },
      { icon: Heart, text: 'Elevates heart rate' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Zap, text: 'Quick energy boost' },
    ],
    communityTip: 'Add arm movements for a full-body workout!',
    stepLabel: 'Minute',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  },
  '4003': {
    id: 'indoor-stretching-routine',
    title: 'Indoor Stretching Routine',
    icon: '🧘',
    frequency: 'daily',
    description: 'Do a gentle indoor stretching routine.',
    xpReward: 35,
    totalSteps: 5,
    color: 'chart-3',
    details: 'A calming stretching routine you can do in any room. Focus on major muscle groups: neck, shoulders, back, legs.',
    benefits: [
      { icon: Activity, text: 'Improves flexibility' },
      { icon: Heart, text: 'Relaxes muscles' },
      { icon: Brain, text: 'Reduces tension' },
      { icon: Leaf, text: 'Promotes calm' },
    ],
    communityTip: 'Hold each stretch for 15-30 seconds and breathe deeply.',
    stepLabel: 'Stretch',
    replacesId: 'walking',
    replacesTitle: 'Take a 10-minute walk'
  }
};

export default function AlternativeMissionDetails() {
  const { t } = useTranslation('pages');
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const altId = params.get('id') || '101';
  const originalMissionId = params.get('original') || '1';
  
  const { activateAlternativeMission, isActivatingAlternative, missions, logMissionStep, undoMissionStep, deactivateMission } = useMissions();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReplaced, setIsReplaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  
  const missionData = alternativeMissionsDatabase[altId];
  
  if (!missionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('alternativeMission.notFound')}</p>
          <Link href="/my-dashboard">
            <Button className="mt-4">{t('alternativeMission.goBack')}</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const colors = colorClasses[missionData.color] || colorClasses['chart-1'];
  
  const activeMission = missions.find(m => m.missionKey === missionData.id);
  const alreadyActive = !!activeMission;
  const currentProgress = activeMission?.progress || 0;
  const maxProgress = missionData.totalSteps;
  const isCompleted = currentProgress >= maxProgress;
  const progressPercent = (currentProgress / maxProgress) * 100;
  
  const handleReplaceMission = async () => {
    setError(null);
    try {
      const missionKey = missionData.id;
      await activateAlternativeMission(missionData.replacesId, missionKey);
      setShowSuccess(true);
      setIsReplaced(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to activate alternative mission';
      if (errorMessage.includes('low mood')) {
        setError(t('alternativeMission.lowMoodRequired'));
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleLogStep = () => {
    if (activeMission && currentProgress < maxProgress) {
      logMissionStep(activeMission.id);
    }
  };

  const handleUndoStep = () => {
    if (activeMission && currentProgress > 0) {
      undoMissionStep(activeMission.id);
    }
  };

  const handleDeactivate = () => {
    if (activeMission) {
      deactivateMission(activeMission.id);
      navigate(`/mission-details?id=${originalMissionId}`);
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
            
            {!alreadyActive ? (
              <Button
                size="lg"
                className={`w-full font-black text-white ${colors.button} ${isActivatingAlternative ? '' : 'animate-pulse-glow'}`}
                disabled={isActivatingAlternative}
                onClick={handleReplaceMission}
              >
                {isActivatingAlternative ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    {t('alternativeMission.activating')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {t('alternativeMission.activateForToday')}
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">{t('alternativeMission.progress')}</span>
                  <span className="text-muted-foreground">{currentProgress}/{maxProgress} {missionData.stepLabel}s</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className={`flex-1 font-black text-white ${colors.button}`}
                    disabled={isCompleted}
                    onClick={handleLogStep}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        {t('alternativeMission.completed')}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2 fill-current" />
                        {t('alternativeMission.logStep')}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={currentProgress === 0}
                    onClick={handleUndoStep}
                    title={t('alternativeMission.undoStep')}
                  >
                    <Undo2 className="w-5 h-5" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeactivateConfirm(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('alternativeMission.returnToMain')}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
        
        {showDeactivateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 px-4"
          >
            <Card className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2">{t('alternativeMission.confirmDeactivate')}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t('alternativeMission.confirmDeactivateText')}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeactivateConfirm(false)}
                >
                  {t('alternativeMission.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeactivate}
                >
                  {t('alternativeMission.deactivate')}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
        
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
            <h3 className="text-lg font-black text-foreground mb-4">{t('alternativeMission.todaysProgress')}</h3>
            <div className="space-y-3">
              {Array.from({ length: missionData.totalSteps }).map((_, index) => {
                const stepCompleted = alreadyActive && index < currentProgress;
                return (
                  <motion.div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      stepCompleted 
                        ? 'bg-gradient-to-r from-chart-2/20 to-emerald-500/10 border border-chart-2/30' 
                        : 'bg-muted/30'
                    }`}
                    initial={false}
                    animate={stepCompleted ? { scale: [1, 1.02, 1] } : {}}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      stepCompleted 
                        ? 'bg-gradient-to-br from-chart-2 to-emerald-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {stepCompleted ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <span className={`font-bold ${stepCompleted ? 'text-chart-2' : 'text-foreground'}`}>
                        {missionData.stepLabel} #{index + 1}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${stepCompleted ? 'text-chart-2' : 'text-primary'}`}>
                      <Zap className={`w-4 h-4 ${stepCompleted ? 'fill-chart-2' : 'fill-primary'}`} />
                      <span className="text-sm font-bold">{stepCompleted ? t('alternativeMission.earned') : `+${missionData.xpReward}`} XP</span>
                    </div>
                  </motion.div>
                );
              })}
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
