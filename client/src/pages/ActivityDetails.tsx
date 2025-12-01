import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  Footprints,
  Heart,
  Moon,
  Flame,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Play,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useSearch, useLocation } from 'wouter';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';
import { useMissions } from '@/hooks/useMissions';

interface MetricConfig {
  type: string;
  label: string;
  value: string;
  unit: string;
  goal: string;
  icon: typeof Footprints;
  color: string;
  bgGradient: string;
  aiResponse: string;
  mission: {
    title: string;
    description: string;
    frequency: string;
    xpReward: number;
  };
}

const metricsConfig: Record<string, MetricConfig> = {
  steps: {
    type: 'steps',
    label: 'Steps',
    value: '8,432',
    unit: 'steps',
    goal: '10,000',
    icon: Footprints,
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-chart-2/20',
    aiResponse: "That's great—8,432 steps is a solid amount of movement for today! It shows you're making an effort to stay active, which is wonderful for your overall health. Keeping up with regular steps can help boost your energy and improve your mood. Would you like to start the activity mission?",
    mission: {
      title: '5 minute outdoor walk',
      description: 'Increase your daily activity by taking a brisk 5 minute walk outside.',
      frequency: '2 times daily',
      xpReward: 30,
    }
  },
  sleep: {
    type: 'sleep',
    label: 'Sleep',
    value: '6.5',
    unit: 'hours',
    goal: '8 hours',
    icon: Moon,
    color: 'text-chart-2',
    bgGradient: 'from-chart-2/20 to-indigo-500/20',
    aiResponse: "You got 6.5 hours of sleep last night. While this is reasonable, aiming for 7-8 hours would help your body recover better and improve your focus during the day. Quality sleep is essential for maintaining your immune system and managing stress levels.",
    mission: {
      title: 'Wind down routine',
      description: 'Start a relaxing bedtime routine 30 minutes before sleep - no screens!',
      frequency: 'Every night',
      xpReward: 25,
    }
  },
  heartRate: {
    type: 'heartRate',
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    goal: '60-100 bpm',
    icon: Heart,
    color: 'text-destructive',
    bgGradient: 'from-destructive/20 to-pink-500/20',
    aiResponse: "Your resting heart rate of 72 bpm is within the healthy range! A lower resting heart rate generally indicates better cardiovascular fitness. Regular exercise and stress management can help maintain or even lower this number over time.",
    mission: {
      title: 'Deep breathing exercise',
      description: 'Practice 5 minutes of deep breathing to help lower your heart rate naturally.',
      frequency: '3 times daily',
      xpReward: 20,
    }
  },
  calories: {
    type: 'calories',
    label: 'Calories',
    value: '1,847',
    unit: 'kcal',
    goal: '2,200 kcal',
    icon: Flame,
    color: 'text-chart-3',
    bgGradient: 'from-chart-3/20 to-orange-500/20',
    aiResponse: "You've burned 1,847 calories so far today! This is a good level of energy expenditure. To reach your daily goal of 2,200 calories, try adding a short walk or some light exercise later in the day.",
    mission: {
      title: 'Active break',
      description: 'Take a 10-minute active break with stretching or light movement.',
      frequency: 'Every 2 hours',
      xpReward: 15,
    }
  },
};

const maxProgressMap: Record<string, number> = {
  steps: 2,
  sleep: 1,
  heartRate: 3,
  calories: 4,
};

export default function ActivityDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const metricType = params.get('type') || 'steps';
  
  const { missions, addMission } = useMissions();
  
  const metric = metricsConfig[metricType] || metricsConfig.steps;
  const Icon = metric.icon;
  
  const missionId = `activity-${metricType}`;
  const isMissionAdded = missions.some(m => m.id === missionId);
  
  const [currentTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  });
  
  const handleStartMission = () => {
    if (!isMissionAdded) {
      addMission({
        id: missionId,
        title: metric.mission.title,
        description: metric.mission.description,
        category: 'daily',
        xpReward: metric.mission.xpReward,
        progress: 0,
        maxProgress: maxProgressMap[metricType] || 2,
        completed: false,
        href: `/mission-details?id=${missionId}`,
        source: 'activity',
      });
    }
    navigate(`/mission-details?id=${missionId}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className={`bg-gradient-to-r ${metric.bgGradient} border-b border-border p-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${metric.color}`} />
            <h1 className="text-lg font-black text-foreground">Health Literacy Navigator</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <p className="text-center text-sm text-muted-foreground">Personalized health guidance</p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-6 bg-gradient-to-br ${metric.bgGradient} border-0 shadow-xl`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-white/50 to-white/20 flex items-center justify-center mb-4`}>
                <Icon className={`w-8 h-8 ${metric.color}`} />
              </div>
              <h2 className="text-lg font-bold text-muted-foreground mb-1">{metric.label}</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground" data-testid="metric-value">{metric.value}</span>
                <span className="text-xl text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Goal: {metric.goal}</span>
                <Badge variant="secondary" className="ml-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <img src={mascotImage} alt="Navigator" className="w-8 h-8 object-contain" />
            </div>
          </div>
          <Card className="flex-1 p-4 bg-gradient-to-br from-card to-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{currentTime}</span>
            </div>
            <p className="text-foreground leading-relaxed" data-testid="ai-response">
              {metric.aiResponse}
            </p>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          <div className="w-10" />
          <Card className="flex-1 p-4 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-white font-bold text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    +{metric.mission.xpReward} XP
                  </Badge>
                </div>
                <h3 className="font-black text-lg text-foreground mb-1" data-testid="mission-title">
                  {metric.mission.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {metric.mission.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{metric.mission.frequency}</span>
                </div>
              </div>
            </div>
            
            <Button 
              className={`w-full mt-4 font-black ${isMissionAdded 
                ? 'bg-gradient-to-r from-chart-2 to-emerald-500' 
                : 'bg-gradient-to-r from-primary to-chart-2'
              }`}
              onClick={handleStartMission}
              data-testid="button-start-mission"
            >
              {isMissionAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Continue Mission
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start This Mission
                </>
              )}
            </Button>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-0">
            <div className="flex items-center gap-3">
              <img src={mascotImage} alt="Health Mascot" className="w-12 h-12 object-contain" />
              <div>
                <p className="font-bold text-foreground">Community Tip</p>
                <p className="text-sm text-muted-foreground">
                  Small consistent efforts add up! Even a short 5-minute walk can make a big difference in your daily activity goals.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
