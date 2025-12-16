import { useState, useEffect } from 'react';
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
  Shield,
  Clock,
  Pill,
  Flame,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from '@/components/MascotCharacter';
import { useMedicationProgress, type MedicationDose } from '@/hooks/useMedicationProgress';
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
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const medicationId = params.get('id') || 'morning-medication';
  const { user } = useAuth();
  const userId = user?.id;
  
  const { medications, logDose, getProgress, deleteMedication, isLogging, isLoading } = useMedicationProgress();
  const medication = medications.find(m => m.id === medicationId);
  const progress = getProgress(medicationId);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }
  
  if (!medication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{t('medicationDetails.notFound')}</p>
          <Link href="/my-dashboard">
            <Button className="mt-4">{t('medicationDetails.backToDashboard')}</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const progressPercent = progress.total > 0 ? (progress.taken / progress.total) * 100 : 0;
  const nextDose = medication.takenToday?.find((d: { id: number; taken: boolean }) => !d.taken);
  
  const handleLogDose = async () => {
    if (nextDose) {
      const { success } = await logDose(medicationId, nextDose.id);
      
      if (success) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteMedication(medicationId);
    if (success) {
      navigate('/my-dashboard');
    }
    setIsDeleting(false);
  };
  
  const benefits = [
    { icon: Heart, text: t('medicationDetails.benefits.maintainsHealth') },
    { icon: Brain, text: t('medicationDetails.benefits.supportsBody') },
    { icon: Shield, text: t('medicationDetails.benefits.preventsComplications') },
    { icon: Zap, text: t('medicationDetails.benefits.keepsWell') },
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
          <h1 className="text-xl font-black text-foreground flex-1">{t('medicationDetails.title')}</h1>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('medicationDetails.deleteConfirm.title', 'Delete Medication')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('medicationDetails.deleteConfirm.description', 'Are you sure you want to delete this medication? This action cannot be undone and all tracking history will be lost.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t('common.cancel', 'Cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.deleting', 'Deleting...')}
                    </>
                  ) : (
                    t('common.delete', 'Delete')
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                  {(medication.scheduledTimes || []).length > 0 
                    ? medication.scheduledTimes.join(', ')
                    : medication.frequency}
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`${(medication.adherencePercent ?? 100) >= 80 ? 'bg-primary/20 text-primary' : (medication.adherencePercent ?? 100) >= 50 ? 'bg-chart-3/20 text-chart-3' : 'bg-destructive/20 text-destructive'}`}
                >
                  {medication.adherencePercent ?? 100}% {t('medicationDetails.adherence', 'Adherence')}
                </Badge>
                {medication.streak > 0 && (
                  <Badge variant="secondary">
                    <Flame className="w-3 h-3 mr-1 text-chart-3" />
                    {t('medicationDetails.dayStreak', { count: medication.streak })}
                  </Badge>
                )}
              </div>
              {medication.notes && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="font-medium">{t('medicationDetails.notes', 'Notes')}:</span>{' '}
                  <span className="text-muted-foreground">{medication.notes}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-foreground">{t('medicationDetails.todaysProgress')}</span>
              <span className="text-muted-foreground">{t('medicationDetails.doses', { taken: progress.taken, total: progress.total })}</span>
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
                {t('medicationDetails.allDosesTaken')}
              </>
            ) : (
              <>
                <Pill className="w-5 h-5 mr-2" />
                {t('medicationDetails.logDose', { current: progress.taken + 1, total: progress.total })}
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
            <h3 className="text-lg font-black text-foreground mb-3">{t('medicationDetails.doseLog')}</h3>
            <div className="space-y-3">
              {(medication.takenToday || []).map((dose: MedicationDose, index: number) => (
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
                      {t('medicationDetails.dose', { id: dose.id })}
                    </span>
                    {dose.time && (
                      <span className={`text-sm ml-2 ${dose.taken ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {t('medicationDetails.takenAt', { time: dose.time })}
                      </span>
                    )}
                  </div>
                  {dose.taken && (
                    <Check className="w-5 h-5 text-white" />
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
            <h3 className="text-lg font-black text-foreground mb-3">{t('medicationDetails.aboutMedication')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {medication.explanation || medication.simpleExplanation}
            </p>
            
            <h4 className="font-bold text-foreground mb-3">{t('medicationDetails.benefitsOfAdherence')}</h4>
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
                <p className="font-bold text-foreground mb-1">{tDashboard('community.communityTip')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('medicationDetails.communityTipContent')}
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
                <p className="font-bold text-foreground mb-1">{t('medicationDetails.medicalDisclaimer')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('medicationDetails.disclaimerText')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
