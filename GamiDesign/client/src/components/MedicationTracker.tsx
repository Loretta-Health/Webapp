import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Check, Clock, Flame } from 'lucide-react';
import MedicalTerm from './MedicalTerm';

interface MedicationTrackerProps {
  name: string;
  dosage: string;
  timing: string;
  frequency: string;
  taken?: boolean;
  streak?: number;
  explanation?: string;
  simpleExplanation?: string;
  onTake?: () => void;
  className?: string;
}

export default function MedicationTracker({
  name,
  dosage,
  timing,
  frequency,
  taken = false,
  streak = 0,
  explanation = 'A medication prescribed by your healthcare provider.',
  simpleExplanation = 'Medicine that helps keep you healthy.',
  onTake,
  className = ''
}: MedicationTrackerProps) {
  const [isTaken, setIsTaken] = useState(taken);
  const [showAnimation, setShowAnimation] = useState(false);
  
  const handleTake = () => {
    if (!isTaken) {
      setIsTaken(true);
      setShowAnimation(true);
      onTake?.();
      setTimeout(() => setShowAnimation(false), 1000);
    }
  };
  
  return (
    <Card className={`relative overflow-hidden ${className}`} data-testid="medication-tracker">
      {streak > 0 && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="font-black text-xs">
            <Flame className="w-3 h-3 mr-1 fill-chart-3 text-chart-3" />
            {streak} days
          </Badge>
        </div>
      )}
      
      {showAnimation && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 z-10 pointer-events-none animate-bounce-in">
          <Check className="w-16 h-16 text-primary" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isTaken ? 'bg-primary' : 'bg-muted'
          } transition-all`}>
            <Pill className={`w-6 h-6 ${isTaken ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          
          <div className="flex-1">
            <h4 className="font-bold text-foreground mb-1" data-testid="medication-name">
              <MedicalTerm 
                term={name}
                explanation={explanation}
                simpleExplanation={simpleExplanation}
                category="medication"
              />
            </h4>
            <p className="text-sm text-muted-foreground mb-1">{dosage}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timing}</span>
              <span>•</span>
              <span className="capitalize">{frequency}</span>
            </div>
          </div>
        </div>
        
        <Button
          size="sm"
          className="w-full font-bold"
          variant={isTaken ? 'secondary' : 'default'}
          onClick={handleTake}
          disabled={isTaken}
          data-testid="button-take-medication"
        >
          {isTaken ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Taken Today!
            </>
          ) : (
            'Mark as Taken'
          )}
        </Button>
      </div>
    </Card>
  );
}
