import { useState, useEffect } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Zap, 
  Check, 
  Sparkles,
  Heart,
  Brain,
  Shield,
  Clock,
  Pill,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from '@/components/MascotCharacter';
import { useMedicationProgress } from '@/hooks/useMedicationProgress';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const colorClasses = {
  primary: {
    card: 'bg-gradient-to-br from-primary/10 via-card to-card border-primary/20',
    iconBg: 'bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/30',
    badge: 'bg-primary/20 text-primary border-primary/30',
    stepComplete: 'bg-gradient-to-br from-primary to-chart-2 text-white shadow-lg shadow-primary/30'
  }
};

export default function MedicationDetails() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const medicationId = params.get('id') || 'morning-medication';
  const { user } = useAuth();
  const userId = user?.id;
  
  const { getMedication, logDose, getProgress } = useMedicationProgress();
  const medication = getMedication(medicationId);
  const progress = getProgress(medicationId);
  
  const [showCelebration, setShowCelebration] = useState(false);
  
  const addXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('POST', `/api/gamification/${userId}/xp`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
    },
  });
  
  if (!medication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Medication not found</p>
          <Link href="/my-dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const progressPercent = (progress.taken / progress.total) * 100;
  const nextDose = medication.takenToday.find(d => !d.taken);
  
  const handleLogDose = () => {
    if (nextDose) {
      const { success, xpEarned } = logDose(medicationId, nextDose.id);
      
      if (success && xpEarned > 0) {
        addXPMutation.mutate(xpEarned);
      }
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };
  
  const benefits = [
    { icon: Heart, text: 'Maintains health condition' },
    { icon: Brain, text: 'Supports body function' },
    { icon: Shield, text: 'Prevents complications' },
    { icon: Zap, text: 'Keeps you feeling well' },
  ];
  
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
          <Link href="/my-dashboard">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">Medication Tracker</h1>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${colorClasses.primary.card} rounded-xl p-6 border`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={`${colorClasses.primary.iconBg} w-16 h-16 rounded-full flex items-center justify-center`}>
              <Pill className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-foreground mb-1" data-testid="medication-name">
                {medication.name}
              </h2>
              <p className="text-muted-foreground mb-2">{medication.dosage}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className={colorClasses.primary.badge}>
                  <Clock className="w-3 h-3 mr-1" />
                  {medication.timing}
                </Badge>
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  +{medication.xpPerDose} XP per dose
                </Badge>
                {medication.streak > 0 && (
                  <Badge variant="secondary">
                    <Flame className="w-3 h-3 mr-1 text-chart-3" />
                    {medication.streak} day streak
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-foreground">Today's Progress</span>
              <span className="text-muted-foreground">{progress.taken}/{progress.total} doses</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
          
          <Button
            className="w-full bg-gradient-to-r from-primary to-chart-2 font-black text-lg py-6"
            onClick={handleLogDose}
            disabled={progress.isComplete}
            data-testid="button-log-dose"
          >
            {progress.isComplete ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                All Doses Taken Today!
              </>
            ) : (
              <>
                <Pill className="w-5 h-5 mr-2" />
                Log Dose {progress.taken + 1} of {progress.total}
              </>
            )}
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-black text-foreground mb-3">Dose Log</h3>
            <div className="space-y-3">
              {medication.takenToday.map((dose, index) => (
                <motion.div
                  key={dose.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    dose.taken 
                      ? colorClasses.primary.stepComplete 
                      : 'bg-muted/50'
                  }`}
                  data-testid={`dose-${dose.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    dose.taken ? 'bg-white/20' : 'bg-muted'
                  }`}>
                    {dose.taken ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className={dose.taken ? 'text-white' : 'text-muted-foreground'}>
                        {dose.id}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`font-bold ${dose.taken ? 'text-white' : 'text-foreground'}`}>
                      Dose {dose.id}
                    </span>
                    {dose.time && (
                      <span className={`text-sm ml-2 ${dose.taken ? 'text-white/80' : 'text-muted-foreground'}`}>
                        Taken at {dose.time}
                      </span>
                    )}
                  </div>
                  {dose.taken && (
                    <Badge className="bg-white/20 text-white border-0">
                      +{medication.xpPerDose} XP
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5">
            <h3 className="text-lg font-black text-foreground mb-3">About This Medication</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {medication.explanation || medication.simpleExplanation}
            </p>
            
            <h4 className="font-bold text-foreground mb-3">Benefits of Adherence</h4>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 border-chart-3/30 bg-gradient-to-r from-chart-3/5 to-transparent">
            <div className="flex items-start gap-3">
              <MascotCharacter pose="celebrate" size="sm" />
              <div>
                <p className="font-bold text-foreground mb-1">Community Tip</p>
                <p className="text-sm text-muted-foreground">
                  Set a daily alarm or use a pill organizer to help you remember to take your medications at the same time each day. Consistency is key!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Medical Disclaimer</p>
                <p className="text-xs text-muted-foreground">
                  Loretta is not a diagnostic tool and does not provide medical advice. Always consult your healthcare provider about your medications. Never change your medication regimen without professional guidance.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
