import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Flame, Zap, Trophy, Target, TrendingUp, Sparkles } from 'lucide-react';
import MascotCharacter from './MascotCharacter';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface DailyCheckInProps {
  streak: number;
  xpReward?: number;
  dayNumber?: number;
  completed?: boolean;
  onStart?: () => void;
  className?: string;
}

interface WeeklyStats {
  completedDays: boolean[];
  daysCompleted: number;
  totalDays: number;
}

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const upcomingRewards = [
  { day: 21, reward: '100 XP Bonus', icon: Zap },
  { day: 30, reward: 'Gold Badge', icon: Trophy },
];

export default function DailyCheckIn({
  streak,
  xpReward = 50,
  dayNumber = 1,
  completed = false,
  onStart,
  className = ''
}: DailyCheckInProps) {
  // Fetch weekly check-in stats from the database
  const { data: weeklyStats } = useQuery<WeeklyStats>({
    queryKey: ['/api/emotional-checkins/weekly-stats'],
    staleTime: 30000, // Refresh every 30 seconds
  });

  const completedDays = weeklyStats?.completedDays || [false, false, false, false, false, false, false];
  const daysCompleted = weeklyStats?.daysCompleted || 0;
  
  // Calculate today's index (Monday = 0, Sunday = 6)
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <Card className={`relative overflow-hidden ${className}`} data-testid="daily-checkin">
      <div className="absolute top-0 right-0">
        <Badge 
          className="rounded-tl-none rounded-br-none bg-gradient-to-r from-chart-3 to-destructive text-white font-black px-4 py-2"
          data-testid="streak-badge"
        >
          <Flame className="w-4 h-4 mr-1 fill-white" />
          {streak} Day Streak
        </Badge>
      </div>
      
      <div className="p-6 pt-16 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-foreground mb-1" data-testid="checkin-title">
              Daily Check-In
            </h3>
            <p className="text-sm text-muted-foreground">
              Chat with our health assistant
            </p>
          </div>
          
          <MascotCharacter 
            size="md" 
            pose={completed ? 'celebrate' : 'encourage'}
            speech={completed ? "Well done!" : "Let's go!"}
          />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Day {dayNumber} of your journey
            </span>
            <div className="flex items-center gap-1 text-primary font-bold">
              <Zap className="w-4 h-4 fill-primary" />
              <span>+{xpReward} XP</span>
            </div>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-chart-4 transition-all duration-500"
              style={{ width: `${(dayNumber % 7) * 14.28}%` }}
              data-testid="journey-progress"
            />
          </div>
        </div>
        
        <Button 
          size="lg" 
          className={`w-full font-black text-lg mb-4 ${completed ? '' : 'animate-pulse-glow'}`}
          disabled={completed}
          onClick={onStart}
          data-testid="button-start-checkin"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          {completed ? 'Completed Today!' : 'Start Check-In'}
        </Button>

        {/* Weekly Progress */}
        <div className="bg-gradient-to-r from-primary/5 to-chart-2/5 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">This Week</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-chart-2" />
              <span className="text-xs font-bold text-chart-2">{daysCompleted}/7 days</span>
            </div>
          </div>
          <div className="flex justify-between gap-1">
            {weekDays.map((day, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center gap-1"
                data-testid={`day-indicator-${index}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  completedDays[index] 
                    ? 'bg-gradient-to-br from-primary to-chart-2 text-white shadow-lg shadow-primary/30' 
                    : index === todayIndex 
                      ? 'bg-muted/50 text-muted-foreground border-2 border-dashed border-primary/30'
                      : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {completedDays[index] ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    day
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="flex-1">
          <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Upcoming Rewards</span>
          <div className="space-y-2">
            {upcomingRewards.map((reward, index) => {
              const daysUntil = reward.day - dayNumber;
              const progress = (dayNumber / reward.day) * 100;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover-elevate"
                  data-testid={`reward-${reward.day}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chart-3/20 to-chart-3/10 flex items-center justify-center">
                    <reward.icon className="w-4 h-4 text-chart-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{reward.reward}</p>
                      <span className="text-[10px] text-muted-foreground">{daysUntil} days</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-chart-3 to-chart-1"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Motivation Tip */}
        <div className="mt-3 p-3 bg-gradient-to-r from-chart-2/10 to-primary/10 rounded-lg border border-chart-2/20">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-chart-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Keep it up!</p>
              <p className="text-[10px] text-muted-foreground">Complete 7 more days to unlock the Gold Badge</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
