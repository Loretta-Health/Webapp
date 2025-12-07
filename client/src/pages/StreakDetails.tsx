import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  Flame, 
  Zap,
  Trophy,
  Star,
  Calendar,
  Target,
  Gift,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

const milestones = [
  { days: 7, xp: 100, title: 'Week Warrior', icon: Star, achieved: true },
  { days: 14, xp: 250, title: 'Fortnight Fighter', icon: Target, achieved: true },
  { days: 21, xp: 400, title: 'Three Week Champion', icon: Trophy, achieved: false },
  { days: 30, xp: 500, title: 'Monthly Master', icon: Crown, achieved: false },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StreakDetails() {
  const [currentStreak] = useState(14);
  const [longestStreak] = useState(21);
  const maxStreak = 30;
  
  const progressPercent = (currentStreak / maxStreak) * 100;
  const daysRemaining = maxStreak - currentStreak;
  
  const last7Days = Array.from({ length: 7 }, (_, i) => ({
    day: weekDays[(new Date().getDay() - 6 + i + 7) % 7],
    completed: i < 6,
    isToday: i === 6,
  }));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-chart-3/5 to-chart-1/5">
      <div className="bg-gradient-to-r from-chart-3 via-chart-1 to-chart-3 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-white fill-white" />
            <h1 className="text-lg font-black text-white">Streak Challenge</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-card to-chart-3/10 border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-3 via-chart-1 to-chart-3" />
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <motion.div 
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center shadow-lg shadow-chart-3/30">
                <div className="text-center">
                  <Flame className="w-10 h-10 text-white fill-white mx-auto mb-1" />
                  <span className="text-4xl font-black text-white">{currentStreak}</span>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-white text-chart-3 font-black shadow-md">DAYS</Badge>
              </div>
            </motion.div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-foreground mb-2">
                Amazing Streak!
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                Only <span className="font-black text-chart-3">{daysRemaining} days</span> until you reach your 30-day goal!
              </p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-muted-foreground">Progress to 30-day streak</span>
                  <span className="font-black text-chart-3">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-4" />
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-foreground">{longestStreak}</p>
                  <p className="text-xs text-muted-foreground">Longest Streak</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">500</p>
                  <p className="text-xs text-muted-foreground">XP Reward</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-0 shadow-xl">
          <h3 className="text-xl font-black text-foreground mb-4">This Week</h3>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center"
              >
                <p className="text-xs font-bold text-muted-foreground mb-2">{day.day}</p>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  day.completed 
                    ? 'bg-gradient-to-br from-chart-3 to-chart-1' 
                    : day.isToday 
                      ? 'bg-primary/20 border-2 border-primary border-dashed'
                      : 'bg-muted'
                }`}>
                  {day.completed ? (
                    <Flame className="w-5 h-5 text-white fill-white" />
                  ) : day.isToday ? (
                    <span className="text-xs font-black text-primary">Today</span>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6 border-0 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-foreground">Milestones</h3>
            <Badge variant="secondary" className="font-bold">
              <Gift className="w-3 h-3 mr-1" />
              2/4 Unlocked
            </Badge>
          </div>
          
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const isNext = !milestone.achieved && milestones[index - 1]?.achieved;
              
              return (
                <motion.div
                  key={milestone.days}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-4 transition-all ${
                    milestone.achieved 
                      ? 'bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-chart-3/30' 
                      : isNext
                        ? 'border-primary/50 border-dashed'
                        : 'opacity-60'
                  }`}
                  data-testid={`milestone-${milestone.days}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        milestone.achieved 
                          ? 'bg-gradient-to-br from-chart-3 to-chart-1' 
                          : 'bg-muted'
                      }`}>
                        <Icon className={`w-7 h-7 ${milestone.achieved ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-black text-lg ${milestone.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {milestone.title}
                          </h4>
                          {milestone.achieved && (
                            <Badge className="bg-chart-3 text-white font-bold text-xs">Achieved</Badge>
                          )}
                          {isNext && (
                            <Badge variant="outline" className="text-primary border-primary font-bold text-xs">Next Goal</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Maintain a {milestone.days}-day streak
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={`font-black ${milestone.achieved ? 'bg-chart-1 text-white' : 'bg-muted text-muted-foreground'}`}>
                          <Zap className="w-3 h-3 mr-1" />
                          +{milestone.xp} XP
                        </Badge>
                        {!milestone.achieved && currentStreak < milestone.days && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {milestone.days - currentStreak} days to go
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-chart-3/10 to-chart-1/10 border-0">
          <div className="flex items-center gap-3">
            <img src={mascotImage} alt="Health Mascot" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold text-foreground">Keep Going!</p>
              <p className="text-sm text-muted-foreground">
                Consistency is key to building healthy habits. You're doing amazing - don't break your streak!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
