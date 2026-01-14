import { useState } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/BackButton';
import { useTranslation } from 'react-i18next';
import { 
  Check, 
  Clock,
  Pill,
  AlertTriangle,
  Trash2,
  Loader2,
  Pencil,
  Undo2
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
import { motion } from 'framer-motion';
import { useMedicationProgress, type MedicationDose } from '@/hooks/useMedicationProgress';
import { useAuth } from '@/hooks/use-auth';
import AddMedicationModal from '@/components/AddMedicationModal';

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

export default function MedicationDetails() {
  const { t, i18n } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const medicationId = params.get('id') || 'morning-medication';
  const { user } = useAuth();
  
  const { medications, logDose, logMissedDose, undoLogDose, getProgress, deleteMedication, isLogging, isLoggingMissed, isLoading } = useMedicationProgress();
  const medication = medications.find(m => m.id === medicationId);
  const progress = getProgress(medicationId);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [undoingDose, setUndoingDose] = useState<number | null>(null);
  const [loggingDose, setLoggingDose] = useState<number | null>(null);
  const [markingMissed, setMarkingMissed] = useState<number | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
      </div>
    );
  }
  
  if (!medication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <GlassCard className="p-6 text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 font-medium mb-4">{t('medicationDetails.notFound')}</p>
          <Link href="/my-dashboard">
            <Button className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white font-bold">
              {t('medicationDetails.backToDashboard')}
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }
  
  const progressPercent = progress.total > 0 ? (progress.taken / progress.total) * 100 : 0;
  const nextDose = medication.takenToday?.find((d: { id: number; taken: boolean }) => !d.taken);
  
  const handleLogDose = async () => {
    if (nextDose) {
      await logDose(medicationId, nextDose.id);
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

  const handleUndoDose = async (doseNumber: number) => {
    setUndoingDose(doseNumber);
    await undoLogDose(medicationId, doseNumber);
    setUndoingDose(null);
  };

  const handleLogSpecificDose = async (doseNumber: number) => {
    setLoggingDose(doseNumber);
    await logDose(medicationId, doseNumber);
    setLoggingDose(null);
  };

  const handleMarkMissed = async (doseNumber: number) => {
    setMarkingMissed(doseNumber);
    await logMissedDose(medicationId, doseNumber);
    setMarkingMissed(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl shadow-[#013DC4]/30 relative overflow-hidden sticky top-0 z-40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="flex items-center gap-3 relative z-10">
          <BackButton 
            href="/my-dashboard" 
            data-testid="button-back" 
          />
          <h1 className="text-base sm:text-lg font-black truncate">{t('medicationDetails.title')}</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 relative z-10">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Pencil className="w-5 h-5" />
          </button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/50 dark:border-white/10 rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-gray-900 dark:text-white">
                  {t('medicationDetails.deleteConfirm.title', 'Delete Medication')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 font-medium">
                  {t('medicationDetails.deleteConfirm.description', 'Are you sure you want to delete this medication? This action cannot be undone and all tracking history will be lost.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">
                  {t('common.cancel', 'Cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl font-bold hover:opacity-90"
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
      
      <main className="max-w-2xl mx-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-5 lg:space-y-7">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="overflow-hidden">
            <div className="relative p-4 sm:p-5 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  progress.isComplete 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30' 
                    : 'bg-gradient-to-br from-[#CDB6EF] to-purple-400 shadow-[#CDB6EF]/30'
                }`}>
                  {progress.isComplete ? (
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  ) : (
                    <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white mb-1 truncate" data-testid="medication-name">
                    {medication.name}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500 font-medium mb-2">{medication.dosage}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 text-[#013DC4] dark:text-[#CDB6EF] text-xs font-bold rounded-full">
                      <Clock className="w-3 h-3 mr-1" />
                      {medication.frequency === 'as-needed' 
                        ? t('medicationDetails.asNeeded', 'As needed')
                        : medication.frequency === 'weekly'
                          ? formatWeeklySchedule(medication.scheduledTimes || [], i18n.language)
                          : (medication.scheduledTimes || []).length > 0 
                            ? medication.scheduledTimes.join(', ')
                            : t('medicationDetails.daily', 'Daily')}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      (medication.adherencePercent ?? 100) >= 80 
                        ? 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-600 dark:text-green-400' 
                        : (medication.adherencePercent ?? 100) >= 50 
                          ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-600 dark:text-amber-400' 
                          : 'bg-gradient-to-r from-red-400/20 to-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {medication.adherencePercent ?? 100}% {t('medicationDetails.adherence', 'Adherence')}
                    </span>
                  </div>
                  {medication.notes && (
                    <div className="mt-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">{t('medicationDetails.notes', 'Notes')}:</span>{' '}
                      <span className="text-gray-500 font-medium">{medication.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-5">
              {medication.frequency !== 'as-needed' && progress.total > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {medication.frequency === 'weekly' 
                        ? t('medicationDetails.thisWeeksProgress', "This week's progress")
                        : t('medicationDetails.todaysProgress')}
                    </span>
                    <span className="text-gray-500 font-medium">{t('medicationDetails.doses', { taken: progress.taken, total: progress.total })}</span>
                  </div>
                  <div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button
                className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg text-white transition-all min-h-[56px] flex items-center justify-center gap-2 ${
                  medication.frequency !== 'as-needed' && progress.isComplete
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:shadow-xl shadow-lg shadow-[#013DC4]/30'
                }`}
                onClick={handleLogDose}
                disabled={medication.frequency !== 'as-needed' && progress.isComplete}
                data-testid="button-log-dose"
              >
                {medication.frequency !== 'as-needed' && progress.isComplete ? (
                  <>
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    {t('medicationDetails.allDosesTaken')}
                  </>
                ) : medication.frequency === 'as-needed' ? (
                  <>
                    <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
                    {t('medicationDetails.logDoseAsNeeded', 'Log Dose')}
                  </>
                ) : (
                  <>
                    <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
                    {t('medicationDetails.logDose', { current: progress.taken + 1, total: progress.total })}
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </motion.div>
        
        {medication.frequency !== 'as-needed' && (medication.takenToday || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="overflow-hidden">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{t('medicationDetails.doseLog')}</h3>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
                {(medication.takenToday || []).map((dose: MedicationDose, index: number) => {
                  const scheduledTime = getScheduledTimeForDose(medication.scheduledTimes || [], index, medication.frequency);
                  return (
                    <motion.div
                      key={dose.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all ${
                        dose.taken 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30' 
                          : dose.missed
                            ? 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 opacity-60'
                            : 'bg-white/50 dark:bg-gray-800/50'
                      }`}
                      data-testid={`dose-${dose.id}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        dose.taken ? 'bg-white/20' : dose.missed ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {dose.taken ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : dose.missed ? (
                          <span className="text-xs font-bold text-white/70">—</span>
                        ) : (
                          <span className="text-xs font-bold text-gray-500">
                            {dose.id}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {scheduledTime && (
                            <span className={`font-bold ${dose.taken ? 'text-white' : dose.missed ? 'text-white/80' : 'text-gray-900 dark:text-white'}`}>
                              {scheduledTime}
                            </span>
                          )}
                          {!scheduledTime && (
                            <span className={`font-bold ${dose.taken ? 'text-white' : dose.missed ? 'text-white/80' : 'text-gray-900 dark:text-white'}`}>
                              {t('medicationDetails.dose', { id: dose.id })}
                            </span>
                          )}
                          {dose.taken && dose.time && (
                            <span className="text-sm text-white/80">
                              ({i18n.language === 'de' ? 'genommen' : 'taken'} {dose.time})
                            </span>
                          )}
                          {dose.missed && (
                            <span className="text-sm text-white/60">
                              ({dose.source === 'auto' 
                                ? (i18n.language === 'de' ? 'automatisch übersprungen' : 'auto-skipped')
                                : (i18n.language === 'de' ? 'übersprungen' : 'skipped')
                              })
                            </span>
                          )}
                        </div>
                      </div>
                      {dose.taken ? (
                        <button
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUndoDose(dose.id);
                          }}
                          disabled={undoingDose === dose.id}
                          title={i18n.language === 'de' ? 'Rückgängig' : 'Undo'}
                        >
                          {undoingDose === dose.id ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Undo2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ) : dose.missed ? (
                        <button
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUndoDose(dose.id);
                          }}
                          disabled={undoingDose === dose.id}
                          title={i18n.language === 'de' ? 'Rückgängig' : 'Undo'}
                        >
                          {undoingDose === dose.id ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Undo2 className="w-4 h-4 text-white/70" />
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogSpecificDose(dose.id);
                            }}
                            disabled={loggingDose === dose.id || markingMissed === dose.id}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-1"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkMissed(dose.id);
                            }}
                            disabled={loggingDose === dose.id || markingMissed === dose.id}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            {markingMissed === dose.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              i18n.language === 'de' ? 'Übersprungen' : 'Skipped'
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 sm:p-5 bg-gradient-to-r from-amber-400/10 to-orange-400/10 border-amber-400/20">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">{t('medicationDetails.medicalDisclaimer')}</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  {t('medicationDetails.disclaimerText')}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </main>

      <AddMedicationModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen}
        medicationToEdit={medication ? {
          id: medication.id,
          name: medication.name,
          dosage: medication.dosage || '',
          scheduledTimes: medication.scheduledTimes || [],
          notes: medication.notes,
          frequency: medication.frequency || 'daily',
          dosesPerDay: medication.dosesPerDay || 1,
        } : null}
      />
    </div>
  );
}
