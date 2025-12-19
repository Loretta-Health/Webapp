import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, BookOpen, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MedicalTermProps {
  term: string;
  explanation: string;
  simpleExplanation?: string;
  category?: 'medication' | 'metric' | 'condition' | 'procedure';
  learnMoreUrl?: string;
  children?: React.ReactNode;
  className?: string;
}

const medicalDictionary: Record<string, { explanation: string; simpleExplanation: string; category: 'medication' | 'metric' | 'condition' | 'procedure' }> = {
  'Omeprazole': {
    explanation: 'A proton pump inhibitor (PPI) that reduces stomach acid production by blocking the enzyme in the stomach wall that produces acid.',
    simpleExplanation: 'A medicine that helps reduce stomach acid to prevent heartburn and protect your stomach lining.',
    category: 'medication'
  },
  'bpm': {
    explanation: 'Beats per minute - the standard measurement of heart rate, indicating how many times your heart contracts in one minute.',
    simpleExplanation: 'How many times your heart beats in one minute. Normal resting is 60-100 bpm.',
    category: 'metric'
  },
  'Heart Rate': {
    explanation: 'The number of heart contractions per minute. Resting heart rate between 60-100 bpm is considered normal for adults.',
    simpleExplanation: 'How fast your heart is pumping. Lower is usually healthier when resting.',
    category: 'metric'
  },
  'Calories': {
    explanation: 'A unit of energy. In nutrition, calories measure the energy food provides to your body for daily activities and metabolism.',
    simpleExplanation: 'The energy your body gets from food. You need enough to stay active but not too many.',
    category: 'metric'
  },
  'Risk Score': {
    explanation: 'A calculated health assessment based on various factors like lifestyle, vital signs, and medical history to predict potential health risks.',
    simpleExplanation: 'A number that shows your health risk level. Lower scores mean better health!',
    category: 'metric'
  },
  'Blood Pressure': {
    explanation: 'The force of blood pushing against artery walls. Measured as systolic (heart beats) over diastolic (heart rests). Normal is around 120/80 mmHg.',
    simpleExplanation: 'How hard your blood pushes against your blood vessels. Like water pressure in a hose.',
    category: 'metric'
  },
  'Sleep Quality': {
    explanation: 'A measure of how restorative your sleep is, considering factors like deep sleep phases, interruptions, and sleep efficiency.',
    simpleExplanation: 'How well you sleep, not just how long. Good sleep helps your body heal and your mind stay sharp.',
    category: 'metric'
  },
  'Steps': {
    explanation: 'The total number of steps taken. 10,000 steps daily is a common goal, roughly equivalent to 5 miles of walking.',
    simpleExplanation: 'Walking is one of the best exercises! More steps means you are staying active and healthy.',
    category: 'metric'
  },
  'mg': {
    explanation: 'Milligrams - a unit of measurement for medication dosage. 1000 milligrams equals 1 gram.',
    simpleExplanation: 'A tiny measurement for medicine doses. Helps make sure you get exactly the right amount.',
    category: 'medication'
  }
};

export default function MedicalTerm({
  term,
  explanation,
  simpleExplanation,
  category = 'metric',
  learnMoreUrl,
  children,
  className = ''
}: MedicalTermProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const categoryColors = {
    medication: 'bg-chart-2/20 text-chart-2 border-chart-2',
    metric: 'bg-chart-4/20 text-chart-4 border-chart-4',
    condition: 'bg-destructive/20 text-destructive border-destructive',
    procedure: 'bg-chart-3/20 text-chart-3 border-chart-3'
  };
  
  const categoryLabels = {
    medication: 'Medication',
    metric: 'Health Metric',
    condition: 'Condition',
    procedure: 'Procedure'
  };
  
  return (
    <>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50 hover:border-primary transition-colors ${className}`}
            onClick={() => setShowDialog(true)}
            data-testid={`medical-term-${term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {children || term}
            <HelpCircle className="w-3 h-3 text-muted-foreground inline" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3" data-testid="medical-term-tooltip">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${categoryColors[category]}`}>
                {categoryLabels[category]}
              </Badge>
            </div>
            <p className="text-sm font-semibold">{term}</p>
            <p className="text-xs text-muted-foreground">
              {simpleExplanation || explanation}
            </p>
            <p className="text-xs text-primary font-semibold">Click for more info</p>
          </div>
        </TooltipContent>
      </Tooltip>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" data-testid="medical-term-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {term}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Badge variant="outline" className={`${categoryColors[category]}`}>
              {categoryLabels[category]}
            </Badge>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">Simple Explanation</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {simpleExplanation || 'A health term used by doctors and healthcare providers.'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">Detailed Explanation</h4>
                <p className="text-sm text-muted-foreground">
                  {explanation}
                </p>
              </div>
            </div>
            
            {learnMoreUrl && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(learnMoreUrl, '_blank')}
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function getMedicalTermInfo(term: string) {
  return medicalDictionary[term] || null;
}

export { medicalDictionary };
