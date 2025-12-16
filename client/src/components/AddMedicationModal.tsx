import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Plus, Loader2, Clock, X } from 'lucide-react';
import { useMedicationProgress, type CreateMedicationInput } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMedicationModal({ open, onOpenChange }: AddMedicationModalProps) {
  const { i18n } = useTranslation('dashboard');
  const language = i18n.language;
  const { createMedication, isCreating } = useMedicationProgress();
  
  const [formData, setFormData] = useState<CreateMedicationInput>({
    name: '',
    dosage: '',
    scheduledTimes: ['08:00'],
    notes: '',
    frequency: 'daily',
    dosesPerDay: 1,
    xpPerDose: 10,
    explanation: '',
    simpleExplanation: '',
  });

  const frequencyOptions = [
    { value: 'daily', label: language === 'en' ? 'Daily' : 'Täglich' },
    { value: 'weekly', label: language === 'en' ? 'Weekly' : 'Wöchentlich' },
    { value: 'as-needed', label: language === 'en' ? 'As needed' : 'Bei Bedarf' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage) {
      return;
    }

    const dataToSubmit = {
      ...formData,
      dosesPerDay: formData.scheduledTimes.length,
    };

    const result = await createMedication(dataToSubmit);
    
    if (result) {
      setFormData({
        name: '',
        dosage: '',
        scheduledTimes: ['08:00'],
        notes: '',
        frequency: 'daily',
        dosesPerDay: 1,
        xpPerDose: 10,
        explanation: '',
        simpleExplanation: '',
      });
      onOpenChange(false);
    }
  };

  const addTime = () => {
    const newTimes = [...formData.scheduledTimes, '12:00'];
    setFormData({ ...formData, scheduledTimes: newTimes, dosesPerDay: newTimes.length });
  };

  const removeTime = (index: number) => {
    if (formData.scheduledTimes.length <= 1) return;
    const newTimes = formData.scheduledTimes.filter((_, i) => i !== index);
    setFormData({ ...formData, scheduledTimes: newTimes, dosesPerDay: newTimes.length });
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...formData.scheduledTimes];
    newTimes[index] = value;
    setFormData({ ...formData, scheduledTimes: newTimes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black">
              {language === 'en' ? 'Add Medication' : 'Medikament hinzufügen'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {language === 'en' 
              ? 'Add a medication you want to track. You can edit or remove it later.'
              : 'Fügen Sie ein Medikament hinzu, das Sie verfolgen möchten. Sie können es später bearbeiten oder entfernen.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{language === 'en' ? 'Medication Name' : 'Medikamentenname'} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'en' ? 'e.g., Vitamin D3' : 'z.B., Vitamin D3'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">{language === 'en' ? 'Dosage' : 'Dosierung'} *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder={language === 'en' ? 'e.g., 2000 IU or 500mg' : 'z.B., 2000 IE oder 500mg'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{language === 'en' ? 'Frequency' : 'Häufigkeit'}</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {language === 'en' ? 'Scheduled Times' : 'Geplante Zeiten'}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTime}
                className="h-8 px-3"
              >
                <Plus className="w-3 h-3 mr-1" />
                {language === 'en' ? 'Add Time' : 'Zeit hinzufügen'}
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.scheduledTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-muted-foreground w-16">
                      {language === 'en' ? `Dose ${index + 1}` : `Dosis ${index + 1}`}
                    </span>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="w-32 h-8"
                    />
                  </div>
                  {formData.scheduledTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTime(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? `${formData.scheduledTimes.length} dose${formData.scheduledTimes.length > 1 ? 's' : ''} per day`
                : `${formData.scheduledTimes.length} Dosis${formData.scheduledTimes.length > 1 ? 'en' : ''} pro Tag`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'en' ? 'Special Notes (optional)' : 'Besondere Hinweise (optional)'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'en' 
                ? 'e.g., Take with food, avoid dairy, take on empty stomach...'
                : 'z.B., Mit Essen einnehmen, Milchprodukte vermeiden, auf nüchternen Magen einnehmen...'}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">
              {language === 'en' ? 'What is this medication for? (optional)' : 'Wofür ist dieses Medikament? (optional)'}
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder={language === 'en' 
                ? 'e.g., Helps maintain bone health and immune function'
                : 'z.B., Unterstützt die Knochengesundheit und Immunfunktion'}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {language === 'en' ? 'Cancel' : 'Abbrechen'}
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-primary to-chart-2 font-bold"
              disabled={isCreating || !formData.name || !formData.dosage}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'en' ? 'Adding...' : 'Hinzufügen...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Add Medication' : 'Medikament hinzufügen'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
