import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Pill, Check, Clock, Flame, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import MedicalTerm from './MedicalTerm';
import { useMedicationProgress } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

interface MedicationTrackerProps {
  medicationId: string;
  name: string;
  dosage: string;
  scheduledTimes?: string[];
  notes?: string | null;
  frequency: string;
  adherencePercent?: number;
  explanation?: string;
  simpleExplanation?: string;
  className?: string;
}

export default function MedicationTracker({
  medicationId,
  name,
  dosage,
  scheduledTimes = [],
  notes,
  frequency,
  adherencePercent = 100,
  explanation = 'A medication prescribed by your healthcare provider.',
  simpleExplanation = 'Medicine that helps keep you healthy.',
  className = ''
}: MedicationTrackerProps) {
  const { t } = useTranslation('dashboard');
  const { getProgress, getMedication } = useMedicationProgress();
  const progress = getProgress(medicationId);
  const medication = getMedication(medicationId);
  const streak = medication?.streak || 0;
  
  const progressPercent = progress.total > 0 ? (progress.taken / progress.total) * 100 : 0;
  
  return (
    <Link href={`/medication-details?id=${medicationId}`}>
      <Card className={`relative overflow-hidden cursor-pointer hover:border-primary/50 transition-all ${className}`} data-testid="medication-tracker">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              progress.isComplete ? 'bg-primary' : 'bg-muted'
            } transition-all`}>
              <Pill className={`w-6 h-6 ${progress.isComplete ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-foreground truncate" data-testid="medication-name">
                  <MedicalTerm 
                    term={name}
                    explanation={explanation}
                    simpleExplanation={simpleExplanation}
                    category="medication"
                  />
                </h4>
                <Badge 
                  variant="secondary" 
                  className={`font-black text-xs shrink-0 ${adherencePercent >= 80 ? 'bg-primary/20 text-primary' : adherencePercent >= 50 ? 'bg-chart-3/20 text-chart-3' : 'bg-destructive/20 text-destructive'}`}
                >
                  {adherencePercent}%
                </Badge>
                {streak > 0 && (
                  <Badge variant="secondary" className="font-black text-xs shrink-0">
                    <Flame className="w-3 h-3 mr-1 fill-chart-3 text-chart-3" />
                    {streak}
                  </Badge>
                )}
              </div>
              {dosage && <p className="text-sm text-muted-foreground mb-1">{dosage}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{scheduledTimes.length > 0 ? scheduledTimes.join(', ') : frequency}</span>
                {notes && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{notes}</span>
                  </>
                )}
              </div>
            </div>
            
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
          
          {frequency !== 'as-needed' && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {frequency === 'weekly' ? t('medications.thisWeeksProgress', "This week's progress") : t('medications.todaysProgress')}
                </span>
                <span className="font-bold text-foreground">{progress.taken}/{progress.total}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
          
          {frequency !== 'as-needed' && progress.isComplete && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary font-bold">
              <Check className="w-4 h-4" />
              {t('medications.allDosesTaken')}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
