import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface MedicationDose {
  id: number;
  time?: string;
  taken: boolean;
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
  xpPerDose: number;
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
  xpAwarded: number;
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes?: string;
  frequency: string;
  dosesPerDay?: number;
  xpPerDose?: number;
  explanation?: string;
  simpleExplanation?: string;
}

export interface LogDoseResult {
  success: boolean;
  log: MedicationLog;
  xpAwarded: number;
  streak: number;
  achievementsUnlocked: string[];
}

export function useMedicationProgress() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/logs/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
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
      return { success: result.success, xpEarned: result.xpAwarded };
    } catch (error) {
      console.error('Failed to log dose:', error);
      return { success: false, xpEarned: 0 };
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
      await deleteMedicationMutation.mutateAsync(id);
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
        takenToday.push({
          id: i,
          taken: !!log,
          time: log ? new Date(log.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : undefined,
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
    getProgress,
    getTotalProgress,
    createMedication,
    updateMedication,
    deleteMedication,
    isCreating: createMedicationMutation.isPending,
    isLogging: logDoseMutation.isPending,
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
  xpPerDose: number;
  streak: number;
  lastResetDate: string;
  explanation?: string;
  simpleExplanation?: string;
}
