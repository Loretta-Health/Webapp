import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Plus, Loader2, Clock, X, Calendar } from 'lucide-react';
import { useMedicationProgress, type CreateMedicationInput } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScheduledTime {
  day?: string;
  time: string;
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
  });

  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledTime[]>([{ day: 'monday', time: '08:00' }]);

  const frequencyOptions = [
    { value: 'daily', label: language === 'en' ? 'Daily' : 'Täglich' },
    { value: 'weekly', label: language === 'en' ? 'Weekly' : 'Wöchentlich' },
    { value: 'as-needed', label: language === 'en' ? 'As needed' : 'Bei Bedarf' },
  ];

  const daysOfWeek = [
    { value: 'monday', en: 'Monday', de: 'Montag' },
    { value: 'tuesday', en: 'Tuesday', de: 'Dienstag' },
    { value: 'wednesday', en: 'Wednesday', de: 'Mittwoch' },
    { value: 'thursday', en: 'Thursday', de: 'Donnerstag' },
    { value: 'friday', en: 'Friday', de: 'Freitag' },
    { value: 'saturday', en: 'Saturday', de: 'Samstag' },
    { value: 'sunday', en: 'Sunday', de: 'Sonntag' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return;
    }

    let scheduledTimes: string[] = [];
    let dosesPerDay = 0;

    if (formData.frequency === 'daily') {
      scheduledTimes = formData.scheduledTimes;
      dosesPerDay = scheduledTimes.length;
    } else if (formData.frequency === 'weekly') {
      scheduledTimes = weeklySchedule.map(s => `${s.day}:${s.time}`);
      dosesPerDay = scheduledTimes.length;
    } else {
      scheduledTimes = [];
      dosesPerDay = 0;
    }

    const dataToSubmit = {
      ...formData,
      scheduledTimes,
      dosesPerDay,
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
      });
      setWeeklySchedule([{ day: 'monday', time: '08:00' }]);
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

  const addWeeklyTime = () => {
    setWeeklySchedule([...weeklySchedule, { day: 'monday', time: '12:00' }]);
  };

  const removeWeeklyTime = (index: number) => {
    if (weeklySchedule.length <= 1) return;
    setWeeklySchedule(weeklySchedule.filter((_, i) => i !== index));
  };

  const updateWeeklyTime = (index: number, field: 'day' | 'time', value: string) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setWeeklySchedule(newSchedule);
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
            <Label htmlFor="dosage">{language === 'en' ? 'Dosage (optional)' : 'Dosierung (optional)'}</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder={language === 'en' ? 'e.g., 2000 IU or 500mg' : 'z.B., 2000 IE oder 500mg'}
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

          {formData.frequency === 'daily' && (
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
                {formData.scheduledTimes.map((time, index) => {
                  const [hours, minutes] = time.split(':');
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-muted-foreground w-16">
                          {language === 'en' ? `Dose ${index + 1}` : `Dosis ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={hours}
                            onValueChange={(h) => updateTime(index, `${h}:${minutes}`)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-lg font-bold">:</span>
                          <Select
                            value={minutes}
                            onValueChange={(m) => updateTime(index, `${hours}:${m}`)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['00', '15', '30', '45'].map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? `${formData.scheduledTimes.length} dose${formData.scheduledTimes.length > 1 ? 's' : ''} per day`
                  : `${formData.scheduledTimes.length} Dosis${formData.scheduledTimes.length > 1 ? 'en' : ''} pro Tag`}
              </p>
            </div>
          )}

          {formData.frequency === 'weekly' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'en' ? 'Weekly Schedule' : 'Wochenplan'}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWeeklyTime}
                  className="h-8 px-3"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === 'en' ? 'Add' : 'Hinzufügen'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {weeklySchedule.map((schedule, index) => {
                  const [hours, minutes] = schedule.time.split(':');
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 flex flex-wrap items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <Select
                          value={schedule.day}
                          onValueChange={(day) => updateWeeklyTime(index, 'day', day)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map(day => (
                              <SelectItem key={day.value} value={day.value}>
                                {language === 'en' ? day.en : day.de}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">{language === 'en' ? 'at' : 'um'}</span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={hours}
                            onValueChange={(h) => updateWeeklyTime(index, 'time', `${h}:${minutes}`)}
                          >
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-lg font-bold">:</span>
                          <Select
                            value={minutes}
                            onValueChange={(m) => updateWeeklyTime(index, 'time', `${hours}:${m}`)}
                          >
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['00', '15', '30', '45'].map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {weeklySchedule.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWeeklyTime(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' 
                  ? `${weeklySchedule.length} dose${weeklySchedule.length > 1 ? 's' : ''} per week`
                  : `${weeklySchedule.length} Dosis${weeklySchedule.length > 1 ? 'en' : ''} pro Woche`}
              </p>
            </div>
          )}

          {formData.frequency === 'as-needed' && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'This medication can be taken as needed without a fixed schedule.'
                  : 'Dieses Medikament kann bei Bedarf ohne festen Zeitplan eingenommen werden.'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {language === 'en' ? 'Notes (optional)' : 'Hinweise (optional)'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'en' 
                ? 'e.g., For blood pressure, take with food, avoid grapefruit...'
                : 'z.B., Für Blutdruck, mit Essen einnehmen, Grapefruit vermeiden...'}
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
              disabled={isCreating || !formData.name}
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
