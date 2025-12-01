import { useState, useMemo } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Zap, 
  Droplets, 
  Check, 
  Sparkles,
  Heart,
  Brain,
  Leaf,
  Clock,
  Target,
  ChevronRight,
  Dumbbell,
  Flame,
  Activity,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from '@/components/MascotCharacter';

interface MissionStep {
  id: number;
  completed: boolean;
  time?: string;
}

interface MissionData {
  id: number;
  title: string;
  frequency: string;
  description: string;
  xpReward: number;
  totalSteps: number;
  icon: LucideIcon;
  color: string;
  details: string;
  benefits: { icon: LucideIcon; text: string }[];
  initialSteps: MissionStep[];
  alternativeMissions: { id: number; title: string; xp: number; icon: string }[];
  communityTip: string;
  stepLabel: string;
}

const colorClasses: Record<string, { card: string; iconBg: string; badge: string; stepComplete: string }> = {
  'chart-1': {
    card: 'bg-gradient-to-br from-chart-1/10 via-card to-card border-chart-1/20',
    iconBg: 'bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg shadow-chart-1/30',
    badge: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
    stepComplete: 'bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-lg shadow-chart-1/30'
  },
  'chart-2': {
    card: 'bg-gradient-to-br from-chart-2/10 via-card to-card border-chart-2/20',
    iconBg: 'bg-gradient-to-br from-chart-2 to-emerald-500 shadow-lg shadow-chart-2/30',
    badge: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    stepComplete: 'bg-gradient-to-br from-chart-2 to-emerald-500 text-white shadow-lg shadow-chart-2/30'
  }
};

const missionsDatabase: Record<string, MissionData> = {
  '1': {
    id: 1,
    title: 'Drink a cup of water',
    frequency: 'daily',
    description: 'Stay hydrated by drinking at least one cup of water to start your day right.',
    xpReward: 30,
    totalSteps: 8,
    icon: Droplets,
    color: 'chart-1',
    details: 'This mission helps you maintain proper hydration levels throughout the day. Drinking water is essential for maintaining bodily functions and overall health.',
    benefits: [
      { icon: Zap, text: 'Improves energy levels' },
      { icon: Brain, text: 'Supports brain function' },
      { icon: Heart, text: 'Maintains kidney function' },
      { icon: Leaf, text: 'Maintains skin health' },
    ],
    initialSteps: [
      { id: 1, completed: true, time: '7:00 AM' },
      { id: 2, completed: true, time: '9:00 AM' },
      { id: 3, completed: true, time: '11:00 AM' },
      { id: 4, completed: true, time: '1:00 PM' },
      { id: 5, completed: true, time: '3:00 PM' },
      { id: 6, completed: false },
      { id: 7, completed: false },
      { id: 8, completed: false },
    ],
    alternativeMissions: [
      { id: 101, title: 'Drink herbal tea', xp: 25, icon: '🍵' },
      { id: 102, title: 'Eat water-rich fruits', xp: 20, icon: '🍉' },
    ],
    communityTip: 'Try keeping a water bottle at your desk as a visual reminder to stay hydrated throughout the day.',
    stepLabel: 'Glass'
  },
  '2': {
    id: 2,
    title: 'Complete 10 jumping jacks',
    frequency: 'daily',
    description: 'Get your blood flowing and heart rate up by doing 10 jumping jacks.',
    xpReward: 50,
    totalSteps: 4,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Jumping jacks are a full-body cardiovascular exercise that increases your heart rate, improves circulation, and helps wake up your muscles. This simple yet effective exercise is perfect for quick energy boosts throughout the day.',
    benefits: [
      { icon: Flame, text: 'Burns calories quickly' },
      { icon: Heart, text: 'Strengthens heart health' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy levels' },
    ],
    initialSteps: [
      { id: 1, completed: true, time: '8:00 AM' },
      { id: 2, completed: true, time: '12:00 PM' },
      { id: 3, completed: true, time: '4:00 PM' },
      { id: 4, completed: true, time: '7:00 PM' },
    ],
    alternativeMissions: [
      { id: 201, title: 'Do 20 squats', xp: 45, icon: '🦵' },
      { id: 202, title: 'Take a 5-min walk', xp: 35, icon: '🚶' },
    ],
    communityTip: 'Try doing your jumping jacks in sets of 10 with short breaks. This helps maintain form and prevents fatigue!',
    stepLabel: 'Set'
  }
};

export default function MissionDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const missionId = params.get('id') || '1';
  
  const missionData = missionsDatabase[missionId] || missionsDatabase['1'];
  const MissionIcon = missionData.icon;
  const colors = colorClasses[missionData.color] || colorClasses['chart-1'];
  
  const [steps, setSteps] = useState<MissionStep[]>(missionData.initialSteps);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / missionData.totalSteps) * 100;
  const nextStep = steps.find(s => !s.completed);
  
  const handleLogCompletion = () => {
    if (nextStep) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      setSteps(prev => prev.map(step => 
        step.id === nextStep.id 
          ? { ...step, completed: true, time: timeString }
          : step
      ));
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };
  
  const isComplete = completedCount >= missionData.totalSteps;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-primary/20 backdrop-blur-sm rounded-full p-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="sticky top-0 z-40 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">Mission Details</h1>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-6 ${colors.card}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors.iconBg}`}>
                <MissionIcon className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-foreground" data-testid="mission-title">
                    {missionData.title}
                  </h2>
                </div>
                <Badge className={colors.badge} data-testid="mission-frequency">
                  {missionData.frequency}
                </Badge>
                <p className="text-muted-foreground mt-2" data-testid="mission-description">
                  {missionData.description}
                </p>
              </div>
              
              <MascotCharacter 
                size="sm" 
                pose={isComplete ? 'celebrate' : 'encourage'}
                speech={isComplete ? "Amazing!" : "You can do it!"}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase">Progress</span>
                <span className="text-sm font-bold text-foreground" data-testid="mission-progress-text">
                  {completedCount} of {missionData.totalSteps} steps
                </span>
              </div>
              
              <div className="relative">
                <Progress value={progressPercent} className="h-4" data-testid="mission-progress-bar" />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                  style={{ left: `calc(${progressPercent}% - 12px)` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                    <MissionIcon className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step.completed
                        ? colors.stepComplete
                        : 'bg-muted/50 text-muted-foreground border-2 border-dashed border-muted-foreground/30'
                    }`}
                    data-testid={`step-indicator-${index}`}
                  >
                    {step.completed ? <Check className="w-4 h-4" /> : index + 1}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary fill-primary" />
                <span className="font-black text-primary" data-testid="mission-xp">
                  +{missionData.xpReward} XP per step
                </span>
              </div>
              
              <Button
                size="lg"
                className={`font-black ${isComplete ? '' : 'animate-pulse-glow'}`}
                disabled={isComplete}
                onClick={handleLogCompletion}
                data-testid="button-log-completion"
              >
                {isComplete ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Completed!
                  </>
                ) : (
                  <>
                    <MissionIcon className="w-5 h-5 mr-2" />
                    Log Completion
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
        
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="main" className="font-bold" data-testid="tab-main-mission">
              Main Mission
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="font-bold" data-testid="tab-alternatives">
              Alternative Missions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="main" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-3">Mission Details</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="mission-details-text">
                  {missionData.details}
                </p>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-4">Benefits</h3>
                <div className="grid grid-cols-2 gap-3">
                  {missionData.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-chart-2/10 to-transparent rounded-lg"
                      data-testid={`benefit-${index}`}
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
              transition={{ delay: 0.2 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-4">Today's Log</h3>
                <div className="space-y-2">
                  {steps.filter(s => s.completed).map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${missionData.color === 'chart-2' ? 'bg-chart-2/5' : 'bg-chart-1/5'}`}
                      data-testid={`log-entry-${index}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.stepComplete}`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-foreground">{missionData.stepLabel} #{step.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{step.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {steps.filter(s => !s.completed).length > 0 && (
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <Target className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">
                        {steps.filter(s => !s.completed).length} more to go...
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-5 bg-gradient-to-r from-chart-2/10 to-primary/10 border-chart-2/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground mb-1">Community Tip</h4>
                    <p className="text-sm text-muted-foreground" data-testid="community-tip">
                      {missionData.communityTip}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="alternatives" className="mt-4 space-y-3">
            {missionData.alternativeMissions.map((alt, index) => (
              <motion.div
                key={alt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="p-4 hover-elevate cursor-pointer transition-all"
                  data-testid={`alternative-mission-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl">
                      {alt.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{alt.title}</h4>
                      <div className="flex items-center gap-1 text-primary">
                        <Zap className="w-4 h-4 fill-primary" />
                        <span className="text-sm font-bold">+{alt.xp} XP</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            ))}
            
            <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Alternative missions earn XP too! Choose what works best for you.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
