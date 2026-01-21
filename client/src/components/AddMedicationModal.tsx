import { useState, useEffect } from 'react';
import { Dialog, SwipeableDialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/swipeable-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pill, Plus, Loader2, Clock, X, Calendar, Pencil } from 'lucide-react';
import { useMedicationProgress, type CreateMedicationInput } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

interface MedicationToEdit {
  id: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes?: string | null;
  frequency: string;
  dosesPerDay: number;
}

interface AddMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationToEdit?: MedicationToEdit | null;
}

interface ScheduledTime {
  day?: string;
  time: string;
}

export default function AddMedicationModal({ open, onOpenChange, medicationToEdit }: AddMedicationModalProps) {
  const { i18n } = useTranslation('dashboard');
  const language = i18n.language;
  const { createMedication, updateMedication, isCreating, isUpdating } = useMedicationProgress();
  const isEditMode = !!medicationToEdit;
  
  const [formData, setFormData] = useState<CreateMedicationInput>({
    name: '',
    dosage: '',
    scheduledTimes: ['08:00'],
    notes: '',
    frequency: 'daily',
    dosesPerDay: 1,
  });

  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledTime[]>([{ day: 'monday', time: '08:00' }]);

  useEffect(() => {
    if (medicationToEdit && open) {
      const freq = medicationToEdit.frequency || 'daily';
      
      if (freq === 'weekly') {
        const parsed = medicationToEdit.scheduledTimes.map(s => {
          const parts = s.split(':');
          return { day: parts[0], time: parts.slice(1).join(':') };
        });
        setWeeklySchedule(parsed.length > 0 ? parsed : [{ day: 'monday', time: '08:00' }]);
        setFormData({
          name: medicationToEdit.name,
          dosage: medicationToEdit.dosage || '',
          scheduledTimes: [],
          notes: medicationToEdit.notes || '',
          frequency: freq,
          dosesPerDay: medicationToEdit.dosesPerDay,
        });
      } else {
        setFormData({
          name: medicationToEdit.name,
          dosage: medicationToEdit.dosage || '',
          scheduledTimes: medicationToEdit.scheduledTimes.length > 0 ? medicationToEdit.scheduledTimes : ['08:00'],
          notes: medicationToEdit.notes || '',
          frequency: freq,
          dosesPerDay: medicationToEdit.dosesPerDay,
        });
      }
    } else if (!open) {
      setFormData({
        name: '',
        dosage: '',
        scheduledTimes: ['08:00'],
        notes: '',
        frequency: 'daily',
        dosesPerDay: 1,
      });
      setWeeklySchedule([{ day: 'monday', time: '08:00' }]);
    }
  }, [medicationToEdit, open]);

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

    let result;
    if (isEditMode && medicationToEdit) {
      result = await updateMedication(medicationToEdit.id, dataToSubmit);
    } else {
      result = await createMedication(dataToSubmit);
    }
    
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
      <SwipeableDialogContent 
        onSwipeClose={() => onOpenChange(false)}
        className="sm:max-w-md max-h-[90vh] bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-lg shadow-[#013DC4]/30">
              {isEditMode ? <Pencil className="w-7 h-7 text-white" /> : <Pill className="w-7 h-7 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-black bg-gradient-to-r from-[#013DC4] to-[#0150FF] bg-clip-text text-transparent">
                {isEditMode 
                  ? (language === 'en' ? 'Edit Medication' : 'Medikament bearbeiten')
                  : (language === 'en' ? 'Add Medication' : 'Medikament hinzufügen')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {isEditMode
                  ? (language === 'en' 
                      ? 'Update the details for this medication.'
                      : 'Aktualisieren Sie die Details für dieses Medikament.')
                  : (language === 'en' 
                      ? 'Add a medication to track.'
                      : 'Fügen Sie ein Medikament zum Verfolgen hinzu.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {language === 'en' ? 'Medication Name' : 'Medikamentenname'}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'en' ? 'e.g., Vitamin D3' : 'z.B., Vitamin D3'}
              required
              className="bg-white/70 dark:bg-gray-800/70 border-white/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#013DC4]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage" className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {language === 'en' ? 'Dosage' : 'Dosierung'}
            </Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder={language === 'en' ? 'e.g., 2000 IU or 500mg' : 'z.B., 2000 IE oder 500mg'}
              className="bg-white/70 dark:bg-gray-800/70 border-white/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#013DC4]/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {language === 'en' ? 'Frequency' : 'Häufigkeit'}
            </Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger className="bg-white/70 dark:bg-gray-800/70 border-white/50 dark:border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.frequency === 'daily' && (
            <div className="space-y-3 p-4 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-[#013DC4]" />
                  {language === 'en' ? 'Scheduled Times' : 'Geplante Zeiten'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addTime}
                  className="h-8 px-3 rounded-xl bg-[#013DC4]/10 hover:bg-[#013DC4]/20 text-[#013DC4] font-semibold"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {language === 'en' ? 'Add' : 'Hinzufügen'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.scheduledTimes.map((time, index) => {
                  const [hours, minutes] = time.split(':');
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 shadow-sm">
                        <span className="text-sm font-semibold text-[#013DC4] w-16">
                          {language === 'en' ? `Dose ${index + 1}` : `Dosis ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={hours}
                            onValueChange={(h) => updateTime(index, `${h}:${minutes}`)}
                          >
                            <SelectTrigger className="w-18 h-8 rounded-lg bg-white/70 border-[#013DC4]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-lg font-bold text-[#013DC4]">:</span>
                          <Select
                            value={minutes}
                            onValueChange={(m) => updateTime(index, `${hours}:${m}`)}
                          >
                            <SelectTrigger className="w-18 h-8 rounded-lg bg-white/70 border-[#013DC4]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
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
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {language === 'en' 
                  ? `${formData.scheduledTimes.length} dose${formData.scheduledTimes.length > 1 ? 's' : ''} per day`
                  : `${formData.scheduledTimes.length} Dosis${formData.scheduledTimes.length > 1 ? 'en' : ''} pro Tag`}
              </p>
            </div>
          )}

          {formData.frequency === 'weekly' && (
            <div className="space-y-3 p-4 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-[#013DC4]" />
                  {language === 'en' ? 'Weekly Schedule' : 'Wochenplan'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addWeeklyTime}
                  className="h-8 px-3 rounded-xl bg-[#013DC4]/10 hover:bg-[#013DC4]/20 text-[#013DC4] font-semibold"
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
                      <div className="flex-1 flex flex-wrap items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 shadow-sm">
                        <Select
                          value={schedule.day}
                          onValueChange={(day) => updateWeeklyTime(index, 'day', day)}
                        >
                          <SelectTrigger className="w-32 h-8 rounded-lg bg-white/70 border-[#013DC4]/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {daysOfWeek.map(day => (
                              <SelectItem key={day.value} value={day.value}>
                                {language === 'en' ? day.en : day.de}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-gray-400 font-medium">{language === 'en' ? 'at' : 'um'}</span>
                        <div className="flex items-center gap-1">
                          <Select
                            value={hours}
                            onValueChange={(h) => updateWeeklyTime(index, 'time', `${h}:${minutes}`)}
                          >
                            <SelectTrigger className="w-16 h-8 rounded-lg bg-white/70 border-[#013DC4]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-lg font-bold text-[#013DC4]">:</span>
                          <Select
                            value={minutes}
                            onValueChange={(m) => updateWeeklyTime(index, 'time', `${hours}:${m}`)}
                          >
                            <SelectTrigger className="w-16 h-8 rounded-lg bg-white/70 border-[#013DC4]/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
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
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {language === 'en' 
                  ? `${weeklySchedule.length} dose${weeklySchedule.length > 1 ? 's' : ''} per week`
                  : `${weeklySchedule.length} Dosis${weeklySchedule.length > 1 ? 'en' : ''} pro Woche`}
              </p>
            </div>
          )}

          {formData.frequency === 'as-needed' && (
            <div className="p-4 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10 rounded-2xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'en' 
                  ? 'This medication can be taken as needed without a fixed schedule.'
                  : 'Dieses Medikament kann bei Bedarf ohne festen Zeitplan eingenommen werden.'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {language === 'en' ? 'Notes (optional)' : 'Hinweise (optional)'}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={language === 'en' 
                ? 'e.g., For blood pressure, take with food...'
                : 'z.B., Für Blutdruck, mit Essen einnehmen...'}
              rows={2}
              className="bg-white/70 dark:bg-gray-800/70 border-white/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#013DC4]/30"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl h-12 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
            >
              {language === 'en' ? 'Cancel' : 'Abbrechen'}
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] font-bold text-white shadow-lg shadow-[#013DC4]/30 hover:shadow-xl hover:shadow-[#013DC4]/40 transition-all"
              disabled={isCreating || isUpdating || !formData.name}
            >
              {(isCreating || isUpdating) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode 
                    ? (language === 'en' ? 'Saving...' : 'Speichern...')
                    : (language === 'en' ? 'Adding...' : 'Hinzufügen...')}
                </>
              ) : isEditMode ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Save Changes' : 'Änderungen speichern'}
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
      </SwipeableDialogContent>
    </Dialog>
  );
}
