import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { trackMedication } from '@/lib/clarity';
import { useXPUpdater } from './useXPUpdater';

export interface MedicationDose {
  id: number;
  time?: string;
  taken: boolean;
  missed: boolean;
  logId?: string;
  source?: 'manual' | 'auto';
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes?: string | null;
  frequency: string;
  dosesPerDay: number;
  explanation?: string | null;
  simpleExplanation?: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  streak: number;
  longestStreak: number;
  totalDosesTaken: number;
  totalDosesScheduled: number;
  adherencePercent: number;
  dosesTakenToday: number;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  userId: string;
  doseNumber: number;
  takenAt: string;
  scheduledDate: string;
  status: 'taken' | 'missed';
  source: 'manual' | 'auto';
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes?: string;
  frequency: string;
  dosesPerDay?: number;
  explanation?: string;
  simpleExplanation?: string;
}

export interface LogDoseResult {
  success: boolean;
  log: MedicationLog;
  streak: number;
  achievementsUnlocked: string[];
  xpAwarded?: number;
}

export function useMedicationProgress() {
  const queryClient = useQueryClient();
  const { updateAllXPDisplays } = useXPUpdater();

  // Fetch all user medications
  const { data: medications = [], isLoading, error, refetch } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
    retry: false,
  });

  // Fetch today's logs
  const { data: todayLogs = [] } = useQuery<MedicationLog[]>({
    queryKey: ['/api/medications/logs/today'],
    retry: false,
  });

  // Create medication mutation
  const createMedicationMutation = useMutation({
    mutationFn: async (data: CreateMedicationInput) => {
      const response = await apiRequest('POST', '/api/medications', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
    },
  });

  // Update medication mutation
  const updateMedicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMedicationInput> }) => {
      const response = await apiRequest('PATCH', `/api/medications/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/medications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
    },
  });

  // Log dose mutation
  const logDoseMutation = useMutation({
    mutationFn: async ({ medicationId, doseNumber }: { medicationId: string; doseNumber?: number }) => {
      const response = await apiRequest('POST', `/api/medications/${medicationId}/log`, { doseNumber });
      return response.json() as Promise<LogDoseResult>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/logs/today'] });
      if (result.xpAwarded && result.xpAwarded > 0) {
        updateAllXPDisplays(result.xpAwarded, 'bonus');
      }
    },
  });

  // Undo dose mutation
  const undoLogDoseMutation = useMutation({
    mutationFn: async ({ medicationId, logId }: { medicationId: string; logId: string }) => {
      const response = await apiRequest('DELETE', `/api/medications/${medicationId}/log/${logId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/logs/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    },
  });

  // Log missed dose mutation
  const logMissedDoseMutation = useMutation({
    mutationFn: async ({ medicationId, doseNumber }: { medicationId: string; doseNumber?: number }) => {
      const response = await apiRequest('POST', `/api/medications/${medicationId}/missed`, { doseNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/logs/today'] });
    },
  });

  // Get a specific medication by ID
  const getMedication = (medicationId: string): Medication | undefined => {
    return medications.find(m => m.id === medicationId);
  };

  // Log a dose for a medication
  const logDose = async (medicationId: string, doseNumber?: number): Promise<{ success: boolean; xpEarned: number }> => {
    try {
      const result = await logDoseMutation.mutateAsync({ medicationId, doseNumber });
      const med = getMedication(medicationId);
      trackMedication('logged', med?.name);
      return { success: result.success, xpEarned: result.xpAwarded || 0 };
    } catch (error) {
      console.error('Failed to log dose:', error);
      return { success: false, xpEarned: 0 };
    }
  };

  // Undo a logged dose
  const undoLogDose = async (medicationId: string, doseNumber: number): Promise<boolean> => {
    try {
      // Find the log entry for this dose
      const log = todayLogs.find(l => l.medicationId === medicationId && l.doseNumber === doseNumber);
      if (!log) {
        console.error('Log not found for dose:', doseNumber);
        return false;
      }
      await undoLogDoseMutation.mutateAsync({ medicationId, logId: log.id as string });
      return true;
    } catch (error) {
      console.error('Failed to undo dose:', error);
      return false;
    }
  };

  // Log a missed dose
  const logMissedDose = async (medicationId: string, doseNumber?: number): Promise<boolean> => {
    try {
      await logMissedDoseMutation.mutateAsync({ medicationId, doseNumber });
      const med = getMedication(medicationId);
      trackMedication('skipped', med?.name);
      return true;
    } catch (error) {
      console.error('Failed to log missed dose:', error);
      return false;
    }
  };

  // Get progress for a specific medication
  const getProgress = (medicationId: string): { taken: number; total: number; isComplete: boolean } => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return { taken: 0, total: 0, isComplete: false };
    
    return {
      taken: med.dosesTakenToday,
      total: med.dosesPerDay,
      isComplete: med.dosesTakenToday >= med.dosesPerDay,
    };
  };

  // Get total progress across all medications
  const getTotalProgress = (): { taken: number; total: number } => {
    let taken = 0;
    let total = 0;
    
    medications.forEach(med => {
      taken += med.dosesTakenToday;
      total += med.dosesPerDay;
    });
    
    return { taken, total };
  };

  // Create a new medication
  const createMedication = async (data: CreateMedicationInput): Promise<Medication | null> => {
    try {
      const result = await createMedicationMutation.mutateAsync(data);
      trackMedication('added', data.name);
      return result;
    } catch (error) {
      console.error('Failed to create medication:', error);
      return null;
    }
  };

  // Update a medication
  const updateMedication = async (id: string, data: Partial<CreateMedicationInput>): Promise<Medication | null> => {
    try {
      const result = await updateMedicationMutation.mutateAsync({ id, data });
      return result;
    } catch (error) {
      console.error('Failed to update medication:', error);
      return null;
    }
  };

  // Delete a medication
  const deleteMedication = async (id: string): Promise<boolean> => {
    try {
      const med = getMedication(id);
      await deleteMedicationMutation.mutateAsync(id);
      trackMedication('deleted', med?.name);
      return true;
    } catch (error) {
      console.error('Failed to delete medication:', error);
      return false;
    }
  };

  // Build takenToday array for backward compatibility with existing UI
  const getMedicationsWithDoses = (): (Medication & { takenToday: MedicationDose[] })[] => {
    return medications.map(med => {
      const takenToday: MedicationDose[] = [];
      for (let i = 1; i <= med.dosesPerDay; i++) {
        const log = todayLogs.find(l => l.medicationId === med.id && l.doseNumber === i);
        const isTaken = log?.status === 'taken';
        const isMissed = log?.status === 'missed';
        takenToday.push({
          id: i,
          taken: isTaken,
          missed: isMissed,
          logId: log?.id,
          source: log?.source as 'manual' | 'auto' | undefined,
          time: log && isTaken ? new Date(log.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : undefined,
        });
      }
      return { ...med, takenToday };
    });
  };

  return {
    medications: getMedicationsWithDoses(),
    rawMedications: medications,
    todayLogs,
    isLoading,
    error,
    refetch,
    getMedication,
    logDose,
    logMissedDose,
    undoLogDose,
    getProgress,
    getTotalProgress,
    createMedication,
    updateMedication,
    deleteMedication,
    isCreating: createMedicationMutation.isPending,
    isLogging: logDoseMutation.isPending,
    isLoggingMissed: logMissedDoseMutation.isPending,
    isUpdating: updateMedicationMutation.isPending,
  };
}

// Legacy interface for backward compatibility
export interface MedicationProgress {
  id: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes?: string;
  frequency: string;
  dosesPerDay: number;
  takenToday: MedicationDose[];
  streak: number;
  lastResetDate: string;
  explanation?: string;
  simpleExplanation?: string;
}
