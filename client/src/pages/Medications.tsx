import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
  Pill, 
  Check, 
  Clock, 
  Flame,
  Zap,
  Sun,
  Moon,
  Sunset,
  Sparkles,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  timeIcon: typeof Sun;
  taken: boolean;
  xpReward: number;
}

export default function Medications() {
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: 'Morning Medication', dosage: 'Omeprazole 20mg', time: 'Before breakfast', timeIcon: Sun, taken: false, xpReward: 25 },
    { id: '2', name: 'Afternoon Medication', dosage: 'Vitamin D 1000IU', time: 'With lunch', timeIcon: Sunset, taken: false, xpReward: 15 },
    { id: '3', name: 'Evening Medication', dosage: 'Melatonin 5mg', time: 'Before bed', timeIcon: Moon, taken: false, xpReward: 20 },
  ]);
  
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(14);
  
  const takenCount = medications.filter(m => m.taken).length;
  const allTaken = takenCount === medications.length;
  const progressPercent = (takenCount / medications.length) * 100;
  
  const handleToggleMedication = (id: string) => {
    setMedications(prev => prev.map(med => {
      if (med.id === id && !med.taken) {
        setTotalXpEarned(curr => curr + med.xpReward);
        return { ...med, taken: true };
      }
      return med;
    }));
    
    const updatedMeds = medications.map(m => m.id === id ? { ...m, taken: true } : m);
    if (updatedMeds.every(m => m.taken)) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };
  
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
            <Pill className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Medication Tracker</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-0 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-foreground">Today's Medications</h2>
              <p className="text-muted-foreground">Track your daily medication routine</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-black">
                <Flame className="w-3 h-3 mr-1 fill-chart-3 text-chart-3" />
                {streak} day streak
              </Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-muted-foreground">{takenCount}/{medications.length} medications taken</span>
              <span className="font-black text-primary">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
          
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mb-6 p-4 bg-gradient-to-r from-chart-3/20 to-chart-1/20 rounded-xl border-2 border-chart-3/30 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-foreground">All Medications Taken!</h3>
                  <p className="text-muted-foreground">You earned {totalXpEarned} XP today. Great job staying healthy!</p>
                </div>
                <img src={mascotImage} alt="Mascot" className="w-16 h-16 object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-4">
            {medications.map((medication, index) => {
              const TimeIcon = medication.timeIcon;
              return (
                <motion.div
                  key={medication.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-4 transition-all cursor-pointer hover-elevate ${
                      medication.taken 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => !medication.taken && handleToggleMedication(medication.id)}
                    data-testid={`medication-card-${medication.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          medication.taken 
                            ? 'bg-primary border-primary' 
                            : 'border-border hover:border-primary'
                        }`}
                        data-testid={`checkbox-medication-${medication.id}`}
                      >
                        {medication.taken && <Check className="w-5 h-5 text-white" />}
                      </div>
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        medication.taken ? 'bg-primary' : 'bg-muted'
                      }`}>
                        <Pill className={`w-6 h-6 ${medication.taken ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${medication.taken ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          data-testid={`medication-name-${medication.id}`}>
                          {medication.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <TimeIcon className="w-3 h-3" />
                          <span>{medication.time}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={`font-black ${medication.taken ? 'bg-primary/20 text-primary' : 'bg-chart-1 text-white'}`}>
                          <Zap className="w-3 h-3 mr-1" />
                          +{medication.xpReward} XP
                        </Badge>
                        {medication.taken && (
                          <p className="text-xs text-primary font-bold mt-1">Completed</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-card to-chart-3/5 border-0 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-foreground">Daily Bonus</h3>
              <p className="text-muted-foreground">
                {allTaken 
                  ? "You've earned your daily medication bonus!" 
                  : "Take all medications to earn a 50 XP bonus!"}
              </p>
            </div>
            <Badge className={`font-black text-lg px-4 py-2 ${allTaken ? 'bg-chart-3 text-white' : 'bg-muted text-muted-foreground'}`}>
              <Zap className="w-4 h-4 mr-1" />
              +50 XP
            </Badge>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-chart-2/10 border-0">
          <div className="flex items-center gap-3">
            <img src={mascotImage} alt="Health Mascot" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold text-foreground">Community Tip</p>
              <p className="text-sm text-muted-foreground">
                Taking medications at the same time each day helps build a healthy routine and improves effectiveness.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
