import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Pill, Check, Clock, ChevronRight, Loader2, X } from 'lucide-react';
import { Link } from 'wouter';
import MedicalTerm from './MedicalTerm';
import { useMedicationProgress, type MedicationDose } from '@/hooks/useMedicationProgress';
import { useTranslation } from 'react-i18next';

const dayNames: Record<string, { en: string; de: string }> = {
  monday: { en: 'Mon', de: 'Mo' },
  tuesday: { en: 'Tue', de: 'Di' },
  wednesday: { en: 'Wed', de: 'Mi' },
  thursday: { en: 'Thu', de: 'Do' },
  friday: { en: 'Fri', de: 'Fr' },
  saturday: { en: 'Sat', de: 'Sa' },
  sunday: { en: 'Sun', de: 'So' },
};

function formatWeeklySchedule(scheduledTimes: string[], language: string): string {
  if (!scheduledTimes || scheduledTimes.length === 0) return language === 'en' ? 'Weekly' : 'Wöchentlich';
  
  return scheduledTimes.map(schedule => {
    const parts = schedule.split(':');
    if (parts.length < 2) return schedule;
    
    const day = parts[0];
    const time = parts.slice(1).join(':');
    
    const dayName = dayNames[day.toLowerCase()]?.[language === 'de' ? 'de' : 'en'] || day;
    
    return `${dayName} ${time}`;
  }).join(', ');
}

function getScheduledTimeForDose(scheduledTimes: string[], doseIndex: number, frequency: string): string {
  if (!scheduledTimes || scheduledTimes.length === 0) return '';
  
  if (frequency === 'weekly') {
    const schedule = scheduledTimes[doseIndex];
    if (!schedule) return '';
    const parts = schedule.split(':');
    if (parts.length < 2) return schedule;
    return parts.slice(1).join(':');
  }
  
  return scheduledTimes[doseIndex] || '';
}

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
  const { t, i18n } = useTranslation('dashboard');
  const { getProgress, logDose, logMissedDose, medications } = useMedicationProgress();
  const progress = getProgress(medicationId);
  const medication = medications.find(m => m.id === medicationId);
  const takenToday = medication?.takenToday || [];
  
  const [loggingDose, setLoggingDose] = useState<number | null>(null);
  const [markingMissed, setMarkingMissed] = useState<number | null>(null);
  
  const progressPercent = progress.total > 0 ? (progress.taken / progress.total) * 100 : 0;
  
  const handleLogDose = async (e: React.MouseEvent, doseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setLoggingDose(doseId);
    await logDose(medicationId, doseId);
    setLoggingDose(null);
  };

  const handleMarkMissed = async (e: React.MouseEvent, doseId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkingMissed(doseId);
    await logMissedDose(medicationId, doseId);
    setMarkingMissed(null);
  };
  
  return (
    <GlassCard className={`p-3 sm:p-4 ${className}`} data-testid="medication-tracker">
      <Link href={`/medication-details?id=${medicationId}`}>
        <div className="flex items-start gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            progress.isComplete 
              ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30' 
              : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400 shadow-[#CDB6EF]/30'
          }`}>
            {progress.isComplete ? (
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate" data-testid="medication-name">
                <MedicalTerm 
                  term={name}
                  explanation={explanation}
                  simpleExplanation={simpleExplanation}
                  category="medication"
                />
              </h4>
              <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full shrink-0 ${
                adherencePercent >= 80 
                  ? 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-600 dark:text-green-400' 
                  : adherencePercent >= 50 
                    ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-600 dark:text-amber-400' 
                    : 'bg-gradient-to-r from-red-400/20 to-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {adherencePercent}%
              </span>
            </div>
            {dosage && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{dosage}</p>}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-medium">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {frequency === 'as-needed' 
                  ? (i18n.language === 'de' ? 'Bei Bedarf' : 'As needed')
                  : frequency === 'weekly'
                    ? formatWeeklySchedule(scheduledTimes, i18n.language)
                    : scheduledTimes.length > 0 
                      ? scheduledTimes.join(', ') 
                      : (i18n.language === 'de' ? 'Täglich' : 'Daily')}
              </span>
              {notes && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[80px] sm:max-w-[100px]">{notes}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
          </div>
        </div>
      </Link>
      
      {frequency !== 'as-needed' && takenToday.length > 0 && (
        <div className="mt-3 space-y-2">
          {takenToday.map((dose: MedicationDose, index: number) => {
            const scheduledTime = getScheduledTimeForDose(scheduledTimes, index, frequency);
            return (
              <div 
                key={dose.id}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition-all ${
                  dose.taken 
                    ? 'bg-gradient-to-r from-green-400/10 to-emerald-400/10' 
                    : 'bg-white/50 dark:bg-gray-800/50'
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  dose.taken 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {dose.taken ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400">{dose.id}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {scheduledTime && (
                      <span className={`text-xs sm:text-sm font-bold ${dose.taken ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {scheduledTime}
                      </span>
                    )}
                    {dose.taken && dose.time && (
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        ({i18n.language === 'de' ? 'genommen' : 'taken'} {dose.time})
                      </span>
                    )}
                  </div>
                </div>
                
                {dose.taken ? (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-sm">
                    {i18n.language === 'de' ? 'Erledigt' : 'Done'}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleLogDose(e, dose.id)}
                      disabled={loggingDose === dose.id || markingMissed === dose.id}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {loggingDose === dose.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          {i18n.language === 'de' ? 'Genommen' : 'Taken'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleMarkMissed(e, dose.id)}
                      disabled={loggingDose === dose.id || markingMissed === dose.id}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {markingMissed === dose.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          {i18n.language === 'de' ? 'Verpasst' : 'Missed'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {frequency !== 'as-needed' && progress.total > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-gray-500 font-medium">
              {frequency === 'weekly' ? t('medications.thisWeeksProgress', "This week's progress") : t('medications.todaysProgress')}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{progress.taken}/{progress.total}</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {frequency !== 'as-needed' && progress.isComplete && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full shadow-lg">
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
            {t('medications.allDosesTaken')}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
