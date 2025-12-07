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
  '101': {
    id: '101',
    title: 'Drink herbal tea',
    icon: '🍵',
    frequency: 'daily',
    description: 'Stay hydrated with calming herbal tea - a delicious alternative to plain water.',
    xpReward: 25,
    totalSteps: 6,
    color: 'chart-2',
    details: 'Herbal teas like chamomile, peppermint, or ginger provide hydration along with additional health benefits. They\'re caffeine-free and can help with relaxation, digestion, and overall wellness.',
    benefits: [
      { icon: Droplets, text: 'Hydrates your body' },
      { icon: Leaf, text: 'Natural antioxidants' },
      { icon: Brain, text: 'Promotes relaxation' },
      { icon: Heart, text: 'Supports digestion' },
    ],
    communityTip: 'Keep a variety of herbal teas at your desk. Peppermint is great for focus, chamomile for relaxation!',
    stepLabel: 'Cup',
    replacesId: '1',
    replacesTitle: 'Drink 8 glasses of water'
  },
  '102': {
    id: '102',
    title: 'Eat water-rich fruits',
    icon: '🍉',
    frequency: 'daily',
    description: 'Get your hydration from delicious fruits like watermelon, oranges, and grapes.',
    xpReward: 20,
    totalSteps: 4,
    color: 'chart-1',
    details: 'Water-rich fruits like watermelon (92% water), strawberries, and oranges are excellent for hydration. They also provide vitamins, fiber, and natural sugars for energy.',
    benefits: [
      { icon: Droplets, text: 'Natural hydration' },
      { icon: Zap, text: 'Natural energy boost' },
      { icon: Leaf, text: 'Rich in vitamins' },
      { icon: Heart, text: 'Fiber for digestion' },
    ],
    communityTip: 'Keep pre-cut fruit in your fridge for easy snacking. Frozen grapes make a refreshing treat!',
    stepLabel: 'Serving',
    replacesId: '1',
    replacesTitle: 'Drink 8 glasses of water'
  },
  '201': {
    id: '201',
    title: 'Do 20 squats',
    icon: '🦵',
    frequency: 'daily',
    description: 'Strengthen your legs and core with 20 squats throughout the day.',
    xpReward: 45,
    totalSteps: 4,
    color: 'chart-2',
    details: 'Squats are a compound exercise that work multiple muscle groups including quads, hamstrings, glutes, and core. They\'re excellent for building lower body strength and improving mobility.',
    benefits: [
      { icon: Dumbbell, text: 'Builds leg strength' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Activity, text: 'Improves mobility' },
      { icon: Heart, text: 'Boosts circulation' },
    ],
    communityTip: 'Do 5 squats every hour. By the end of the day, you\'ll have done 40+ without even trying!',
    stepLabel: 'Set of 5',
    replacesId: '2',
    replacesTitle: 'Complete 10 jumping jacks'
  },
  '202': {
    id: '202',
    title: 'Take a 5-min walk',
    icon: '🚶',
    frequency: 'daily',
    description: 'Get moving with short 5-minute walks throughout your day.',
    xpReward: 35,
    totalSteps: 4,
    color: 'chart-1',
    details: 'Short walking breaks are perfect for those who prefer low-impact exercise. Walking improves mood, boosts creativity, and helps maintain cardiovascular health without the intensity of jumping exercises.',
    benefits: [
      { icon: Footprints, text: 'Low-impact exercise' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Heart, text: 'Heart-healthy' },
      { icon: Wind, text: 'Fresh air boost' },
    ],
    communityTip: 'Walk during phone calls or after meals. It\'s an easy way to add more steps to your day!',
    stepLabel: 'Walk',
    replacesId: '2',
    replacesTitle: 'Complete 10 jumping jacks'
  },
  '301': {
    id: '301',
    title: 'March in place for 5 mins',
    icon: '🚶',
    frequency: '2 times daily',
    description: 'Get your steps in without leaving your spot - perfect for bad weather or small spaces.',
    xpReward: 25,
    totalSteps: 2,
    color: 'chart-3',
    details: 'Marching in place is a great indoor alternative to walking outside. It raises your heart rate, works your legs, and can be done anywhere - even while watching TV or waiting for coffee!',
    benefits: [
      { icon: Footprints, text: 'Indoor-friendly' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy' },
    ],
    communityTip: 'Add arm swings while marching to get an upper body workout too!',
    stepLabel: 'Session',
    replacesId: 'activity-steps',
    replacesTitle: '5 minute outdoor walk'
  },
  '302': {
    id: '302',
    title: 'Climb stairs for 3 mins',
    icon: '🪜',
    frequency: '2 times daily',
    description: 'Take the stairs! A quick stair climb is an excellent cardio workout.',
    xpReward: 30,
    totalSteps: 2,
    color: 'chart-4',
    details: 'Stair climbing is one of the most effective exercises for cardiovascular health and lower body strength. Just 3 minutes of stair climbing can burn more calories than walking on flat ground.',
    benefits: [
      { icon: Flame, text: 'High calorie burn' },
      { icon: Heart, text: 'Cardio boost' },
      { icon: Dumbbell, text: 'Leg strength' },
      { icon: Activity, text: 'Builds endurance' },
    ],
    communityTip: 'Skip the elevator and take the stairs. Your heart and legs will thank you!',
    stepLabel: 'Session',
    replacesId: 'activity-steps',
    replacesTitle: '5 minute outdoor walk'
  },
  '401': {
    id: '401',
    title: 'Read a book before bed',
    icon: '📖',
    frequency: 'Every night',
    description: 'Wind down with 20 minutes of reading instead of screen time.',
    xpReward: 20,
    totalSteps: 1,
    color: 'chart-3',
    details: 'Reading before bed is a proven way to reduce stress and prepare your mind for sleep. Unlike screens, books don\'t emit blue light that disrupts your circadian rhythm.',
    benefits: [
      { icon: Brain, text: 'Reduces stress' },
      { icon: Moon, text: 'Better sleep' },
      { icon: Leaf, text: 'No blue light' },
      { icon: Sparkles, text: 'Expands knowledge' },
    ],
    communityTip: 'Keep a book on your nightstand so it\'s always ready. Fiction works great for relaxation!',
    stepLabel: 'Night',
    replacesId: 'activity-sleep',
    replacesTitle: 'Wind down routine'
  },
  '402': {
    id: '402',
    title: 'Practice meditation',
    icon: '🧘',
    frequency: 'Every night',
    description: 'Calm your mind with 10 minutes of guided meditation before sleep.',
    xpReward: 25,
    totalSteps: 1,
    color: 'chart-2',
    details: 'Meditation before bed helps quiet the mind and release the day\'s tensions. Even just 10 minutes of mindfulness can significantly improve sleep quality and reduce anxiety.',
    benefits: [
      { icon: Brain, text: 'Calms the mind' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Moon, text: 'Deeper sleep' },
      { icon: Leaf, text: 'Reduces anxiety' },
    ],
    communityTip: 'Try apps like Headspace or Calm for guided sleep meditations. Start with just 5 minutes!',
    stepLabel: 'Night',
    replacesId: 'activity-sleep',
    replacesTitle: 'Wind down routine'
  },
  '501': {
    id: '501',
    title: 'Try box breathing',
    icon: '📦',
    frequency: '3 times daily',
    description: 'Use the box breathing technique to calm your nervous system.',
    xpReward: 20,
    totalSteps: 3,
    color: 'chart-1',
    details: 'Box breathing is a powerful technique used by Navy SEALs: breathe in for 4 seconds, hold for 4, exhale for 4, hold for 4. It activates your parasympathetic nervous system for instant calm.',
    benefits: [
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Brain, text: 'Reduces anxiety' },
      { icon: Zap, text: 'Increases focus' },
      { icon: Leaf, text: 'Easy to learn' },
    ],
    communityTip: 'Visualize tracing a square as you breathe: up (inhale), right (hold), down (exhale), left (hold).',
    stepLabel: 'Session',
    replacesId: 'activity-heartRate',
    replacesTitle: 'Deep breathing exercise'
  },
  '502': {
    id: '502',
    title: 'Do gentle stretching',
    icon: '🧘',
    frequency: '3 times daily',
    description: 'Relax your muscles and calm your mind with gentle stretching.',
    xpReward: 15,
    totalSteps: 3,
    color: 'chart-3',
    details: 'Gentle stretching releases muscle tension and promotes relaxation. Focus on your neck, shoulders, and back - common areas where we hold stress.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    communityTip: 'Hold each stretch for 20-30 seconds and breathe deeply. Never bounce!',
    stepLabel: 'Session',
    replacesId: 'activity-heartRate',
    replacesTitle: 'Deep breathing exercise'
  },
  '601': {
    id: '601',
    title: 'Do desk exercises',
    icon: '💪',
    frequency: 'Every 2 hours',
    description: 'Stay active at your desk with simple exercises you can do in your chair.',
    xpReward: 15,
    totalSteps: 4,
    color: 'chart-2',
    details: 'Desk exercises like seated leg raises, chair squats, and desk push-ups help you stay active even during long work sessions. They prevent stiffness and boost circulation.',
    benefits: [
      { icon: Activity, text: 'Prevents stiffness' },
      { icon: Brain, text: 'Improves focus' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Heart, text: 'Better circulation' },
    ],
    communityTip: 'Set a reminder every 2 hours. Even 2 minutes of desk exercises makes a difference!',
    stepLabel: 'Break',
    replacesId: 'activity-calories',
    replacesTitle: 'Active break'
  },
  '602': {
    id: '602',
    title: 'Take the stairs',
    icon: '🪜',
    frequency: 'Every 2 hours',
    description: 'Skip the elevator and take the stairs for a quick energy boost.',
    xpReward: 20,
    totalSteps: 4,
    color: 'chart-4',
    details: 'Taking the stairs is an easy way to add more activity to your day. It\'s a natural HIIT workout that strengthens your legs and gets your heart pumping.',
    benefits: [
      { icon: Flame, text: 'High calorie burn' },
      { icon: Dumbbell, text: 'Leg strength' },
      { icon: Zap, text: 'Energy boost' },
      { icon: Heart, text: 'Cardio workout' },
    ],
    communityTip: 'Challenge yourself: can you take the stairs every time today? Your body will adapt quickly!',
    stepLabel: 'Trip',
    replacesId: 'activity-calories',
    replacesTitle: 'Active break'
  }
};

export default function AlternativeMissionDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const altId = params.get('id') || '101';
  const originalMissionId = params.get('original') || '1';
  
  const { addMission, removeMission, missions } = useMissions();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReplaced, setIsReplaced] = useState(false);
  
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
  
  const alreadyActive = missions.some(m => m.id === altId);
  
  const handleReplaceMission = () => {
    removeMission(missionData.replacesId);
    
    addMission({
      id: altId,
      title: missionData.title,
      description: missionData.description,
      category: 'daily',
      xpReward: missionData.xpReward,
      progress: 0,
      maxProgress: missionData.totalSteps,
      completed: false,
      href: `/mission-details?id=${altId}`,
      source: 'activity',
    });
    
    setShowSuccess(true);
    setIsReplaced(true);
    
    setTimeout(() => {
      navigate('/my-dashboard');
    }, 1500);
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
                <span>Replaces: <strong className="text-foreground">{missionData.replacesTitle}</strong></span>
              </div>
            </div>
            
            <Button
              size="lg"
              className={`w-full font-black text-white ${colors.button} ${isReplaced || alreadyActive ? '' : 'animate-pulse-glow'}`}
              disabled={isReplaced || alreadyActive}
              onClick={handleReplaceMission}
            >
              {isReplaced ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Replaced!
                </>
              ) : alreadyActive ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Already Active
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Replace Mission
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
