import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Plus, Loader2 } from 'lucide-react';
import { useMedicationProgress, type CreateMedicationInput } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMedicationModal({ open, onOpenChange }: AddMedicationModalProps) {
  const { t, i18n } = useTranslation('dashboard');
  const language = i18n.language;
  const { createMedication, isCreating } = useMedicationProgress();
  
  const [formData, setFormData] = useState<CreateMedicationInput>({
    name: '',
    dosage: '',
    timing: 'morning',
    frequency: 'daily',
    dosesPerDay: 1,
    xpPerDose: 10,
    explanation: '',
    simpleExplanation: '',
  });

  const timingOptions = [
    { value: 'morning', label: language === 'en' ? 'Morning' : 'Morgens' },
    { value: 'afternoon', label: language === 'en' ? 'Afternoon' : 'Nachmittags' },
    { value: 'evening', label: language === 'en' ? 'Evening' : 'Abends' },
    { value: 'night', label: language === 'en' ? 'Night' : 'Nachts' },
    { value: 'with-food', label: language === 'en' ? 'With food' : 'Mit Essen' },
    { value: 'before-food', label: language === 'en' ? 'Before food' : 'Vor dem Essen' },
    { value: 'after-food', label: language === 'en' ? 'After food' : 'Nach dem Essen' },
  ];

  const frequencyOptions = [
    { value: 'daily', label: language === 'en' ? 'Daily' : 'Täglich' },
    { value: 'twice-daily', label: language === 'en' ? 'Twice daily' : 'Zweimal täglich' },
    { value: 'three-times-daily', label: language === 'en' ? 'Three times daily' : 'Dreimal täglich' },
    { value: 'weekly', label: language === 'en' ? 'Weekly' : 'Wöchentlich' },
    { value: 'as-needed', label: language === 'en' ? 'As needed' : 'Bei Bedarf' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage) {
      return;
    }

    const result = await createMedication(formData);
    
    if (result) {
      setFormData({
        name: '',
        dosage: '',
        timing: 'morning',
        frequency: 'daily',
        dosesPerDay: 1,
        xpPerDose: 10,
        explanation: '',
        simpleExplanation: '',
      });
      onOpenChange(false);
    }
  };

  const handleFrequencyChange = (value: string) => {
    let dosesPerDay = 1;
    if (value === 'twice-daily') dosesPerDay = 2;
    if (value === 'three-times-daily') dosesPerDay = 3;
    
    setFormData({ ...formData, frequency: value, dosesPerDay });
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'en' ? 'When to take' : 'Einnahmezeit'}</Label>
              <Select value={formData.timing} onValueChange={(value) => setFormData({ ...formData, timing: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timingOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'en' ? 'Frequency' : 'Häufigkeit'}</Label>
              <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
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
