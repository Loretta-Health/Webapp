import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Check,
  Pencil,
  Save,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useSearch, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';
import { useMissions } from '@/hooks/useMissions';

interface MetricConfig {
  type: string;
  label: string;
  defaultValue: string;
  unit: string;
  goal: string;
  goalValue: number;
  icon: typeof Footprints;
  color: string;
  bgGradient: string;
  aiResponse: string;
  dbField: string;
  inputType: 'number' | 'decimal';
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
    defaultValue: '0',
    unit: 'steps',
    goal: '10,000',
    goalValue: 10000,
    icon: Footprints,
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-chart-2/20',
    aiResponse: "Tracking your steps is a great way to stay active! Regular walking helps boost your energy, improve your mood, and supports overall cardiovascular health. Would you like to start the activity mission?",
    dbField: 'steps',
    inputType: 'number',
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
    defaultValue: '0',
    unit: 'hours',
    goal: '8 hours',
    goalValue: 8,
    icon: Moon,
    color: 'text-chart-2',
    bgGradient: 'from-chart-2/20 to-indigo-500/20',
    aiResponse: "Quality sleep is essential for maintaining your immune system and managing stress levels. Aim for 7-8 hours to help your body recover and improve your focus during the day.",
    dbField: 'sleepHours',
    inputType: 'decimal',
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
    defaultValue: '0',
    unit: 'bpm',
    goal: '60-100 bpm',
    goalValue: 80,
    icon: Heart,
    color: 'text-destructive',
    bgGradient: 'from-destructive/20 to-pink-500/20',
    aiResponse: "A lower resting heart rate generally indicates better cardiovascular fitness. Regular exercise and stress management can help maintain or even lower this number over time.",
    dbField: 'heartRate',
    inputType: 'number',
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
    defaultValue: '0',
    unit: 'kcal',
    goal: '2,000 kcal',
    goalValue: 2000,
    icon: Flame,
    color: 'text-chart-3',
    bgGradient: 'from-chart-3/20 to-orange-500/20',
    aiResponse: "Tracking your calorie expenditure helps you understand your energy output. To reach your daily goal, try adding a short walk or some light exercise later in the day.",
    dbField: 'calories',
    inputType: 'number',
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

interface ActivityData {
  id?: string;
  userId: string;
  date: string;
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  sleepGoal: number;
  heartRate: number;
  calories: number;
  caloriesGoal: number;
  water: number;
  waterGoal: number;
}

export default function ActivityDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const metricType = params.get('type') || 'steps';
  const { user } = useAuth();
  const userId = user?.id;
  
  const { missions, addMission } = useMissions();
  
  const metric = metricsConfig[metricType] || metricsConfig.steps;
  const Icon = metric.icon;
  
  const missionId = `activity-${metricType}`;
  const isMissionAdded = missions.some(m => m.id === missionId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);
  
  const { data: activityData, isLoading, isFetching } = useQuery<ActivityData>({
    queryKey: ['/api/activities', userId, 'today'],
    enabled: !!userId,
  });
  
  const getValueFromData = (data: ActivityData | undefined): string => {
    if (!data) return metric.defaultValue;
    
    switch (metricType) {
      case 'steps':
        return data.steps?.toString() || '0';
      case 'sleep':
        return data.sleepHours?.toString() || '0';
      case 'heartRate':
        return data.heartRate?.toString() || '0';
      case 'calories':
        return data.calories?.toString() || '0';
      default:
        return '0';
    }
  };
  
  const getCurrentValue = (): string => {
    if (optimisticValue !== null) return optimisticValue;
    return getValueFromData(activityData);
  };
  
  const formatDisplayValue = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0';
    
    if (metricType === 'steps' || metricType === 'calories') {
      return numValue.toLocaleString();
    }
    return value;
  };
  
  useEffect(() => {
    if (!isEditing && optimisticValue === null) {
      setInputValue(getValueFromData(activityData));
    }
  }, [activityData, metricType, isEditing, optimisticValue]);
  
  useEffect(() => {
    if (activityData && optimisticValue !== null) {
      const serverValue = getValueFromData(activityData);
      if (serverValue === optimisticValue) {
        setOptimisticValue(null);
      }
    }
  }, [activityData]);
  
  const saveActivityMutation = useMutation({
    mutationFn: async (value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) throw new Error('Invalid number');
      
      const updateData: Record<string, number> = {};
      
      switch (metricType) {
        case 'steps':
          updateData.steps = Math.round(numValue);
          break;
        case 'sleep':
          updateData.sleepHours = numValue;
          break;
        case 'heartRate':
          updateData.heartRate = Math.round(numValue);
          break;
        case 'calories':
          updateData.calories = Math.round(numValue);
          break;
      }
      
      return apiRequest('PATCH', `/api/activities/${userId}`, updateData);
    },
    onMutate: async (value: string) => {
      setOptimisticValue(value);
      setIsEditing(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId] });
    },
    onError: () => {
      setOptimisticValue(null);
    },
  });
  
  const handleSave = () => {
    saveActivityMutation.mutate(inputValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInputValue(getCurrentValue());
      setIsEditing(false);
    }
  };
  
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
  
  const currentValue = getCurrentValue();
  const displayValue = formatDisplayValue(currentValue);
  
  const getPersonalizedAiResponse = (): string => {
    const numValue = parseFloat(currentValue);
    if (isNaN(numValue) || numValue === 0) {
      return metric.aiResponse;
    }
    
    switch (metricType) {
      case 'steps':
        if (numValue >= 10000) {
          return `Amazing work! You've hit ${displayValue} steps today - that's meeting your daily goal! Consistent walking like this is fantastic for your cardiovascular health and energy levels. Keep up the great momentum!`;
        } else if (numValue >= 5000) {
          return `Great progress! ${displayValue} steps is a solid amount of movement for today! It shows you're making an effort to stay active. A short walk later could help you reach that 10,000 step goal!`;
        } else {
          return `You've taken ${displayValue} steps so far. Every step counts! Try to incorporate some short walks throughout your day to boost your activity level. Would you like to start the activity mission?`;
        }
      case 'sleep':
        if (numValue >= 8) {
          return `Excellent! ${numValue} hours of sleep is right on target! Getting enough rest is crucial for your immune system, mental clarity, and overall well-being. Keep maintaining this healthy sleep schedule!`;
        } else if (numValue >= 6) {
          return `You got ${numValue} hours of sleep last night. While this is reasonable, aiming for 7-8 hours would help your body recover better and improve your focus during the day.`;
        } else {
          return `${numValue} hours of sleep is less than recommended. Try to prioritize rest tonight - quality sleep is essential for your health, mood, and cognitive function.`;
        }
      case 'heartRate':
        if (numValue >= 60 && numValue <= 100) {
          return `Your resting heart rate of ${numValue} bpm is within the healthy range! A lower resting heart rate generally indicates better cardiovascular fitness. Regular exercise and stress management can help maintain this.`;
        } else if (numValue < 60) {
          return `Your heart rate of ${numValue} bpm is below 60. This can be normal for athletes, but if you're experiencing any symptoms, consider consulting with your healthcare provider.`;
        } else {
          return `Your heart rate of ${numValue} bpm is above the typical resting range. Consider relaxation techniques and monitor how you're feeling. Consult a healthcare provider if this persists.`;
        }
      case 'calories':
        const calorieGoal = metric.goalValue;
        if (numValue >= calorieGoal) {
          return `You've burned ${displayValue} calories - exceeding your daily goal! This level of energy expenditure supports weight management and overall fitness. Great job staying active!`;
        } else if (numValue >= calorieGoal * 0.7) {
          return `You've burned ${displayValue} calories so far today! This is a good level of energy expenditure. A short walk or light exercise could help you reach your daily goal.`;
        } else {
          return `You've burned ${displayValue} calories today. Try adding some activity to increase your energy expenditure - every bit of movement helps!`;
        }
      default:
        return metric.aiResponse;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className={`bg-gradient-to-r ${metric.bgGradient} border-b border-border p-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
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
              
              {isEditing ? (
                <div className="flex items-center gap-2 my-2">
                  <Input
                    type="number"
                    step={metric.inputType === 'decimal' ? '0.1' : '1'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-32 text-center text-2xl font-black"
                    autoFocus
                    data-testid="manual-entry-input"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saveActivityMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-save-value"
                  >
                    {saveActivityMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-5xl font-black text-foreground" data-testid="metric-value">
                        {displayValue}
                      </span>
                    )}
                    <span className="text-xl text-muted-foreground">{metric.unit}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="ml-2"
                    data-testid="button-edit-value"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Goal: {metric.goal}</span>
                {parseFloat(currentValue) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {Math.round((parseFloat(currentValue) / metric.goalValue) * 100)}%
                  </Badge>
                )}
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
              {getPersonalizedAiResponse()}
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
