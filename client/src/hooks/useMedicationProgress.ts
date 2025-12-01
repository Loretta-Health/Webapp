import { useState, useEffect, useCallback } from 'react';

export interface MedicationDose {
  id: number;
  time?: string;
  taken: boolean;
}

export interface MedicationProgress {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  frequency: string;
  dosesPerDay: number;
  takenToday: MedicationDose[];
  xpPerDose: number;
  streak: number;
  lastResetDate: string;
  explanation?: string;
  simpleExplanation?: string;
}

const MEDICATION_STORAGE_KEY = 'loretta_medication_progress';

const defaultMedications: MedicationProgress[] = [
  {
    id: 'vitamin-d',
    name: 'Vitamin D3',
    dosage: '2000 IU',
    timing: 'With food',
    frequency: 'daily',
    dosesPerDay: 1,
    takenToday: [{ id: 1, taken: false }],
    xpPerDose: 10,
    streak: 30,
    lastResetDate: new Date().toDateString(),
    explanation: 'A fat-soluble vitamin essential for calcium absorption, bone health, immune function, and mood regulation.',
    simpleExplanation: 'A vitamin that helps keep your bones strong and supports your immune system.',
  },
];

function getTodayString(): string {
  return new Date().toDateString();
}

function loadMedicationsFromStorage(): MedicationProgress[] {
  try {
    const stored = localStorage.getItem(MEDICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const today = getTodayString();
        return parsed.map(med => {
          if (med.lastResetDate !== today) {
            return {
              ...med,
              takenToday: med.takenToday.map((dose: MedicationDose) => ({
                ...dose,
                taken: false,
                time: undefined,
              })),
              lastResetDate: today,
            };
          }
          return med;
        });
      }
    }
  } catch (e) {
    console.error('Failed to load medications from storage:', e);
  }
  return defaultMedications;
}

function saveMedicationsToStorage(medications: MedicationProgress[]) {
  try {
    localStorage.setItem(MEDICATION_STORAGE_KEY, JSON.stringify(medications));
    window.dispatchEvent(new CustomEvent('medications-updated', { detail: medications }));
  } catch (e) {
    console.error('Failed to save medications to storage:', e);
  }
}

export function useMedicationProgress() {
  const [medications, setMedications] = useState<MedicationProgress[]>(() => loadMedicationsFromStorage());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MEDICATION_STORAGE_KEY) {
        setMedications(loadMedicationsFromStorage());
      }
    };

    const handleMedicationsUpdate = (e: CustomEvent<MedicationProgress[]>) => {
      setMedications(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('medications-updated', handleMedicationsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('medications-updated', handleMedicationsUpdate as EventListener);
    };
  }, []);

  const getMedication = useCallback((medicationId: string): MedicationProgress | undefined => {
    return medications.find(m => m.id === medicationId);
  }, [medications]);

  const logDose = useCallback((medicationId: string, doseId?: number): { success: boolean; xpEarned: number } => {
    let xpEarned = 0;
    
    setMedications(prev => {
      const updated = prev.map(med => {
        if (med.id === medicationId) {
          const targetDoseId = doseId ?? med.takenToday.findIndex(d => !d.taken) + 1;
          const doseIndex = med.takenToday.findIndex(d => d.id === targetDoseId);
          
          if (doseIndex >= 0 && !med.takenToday[doseIndex].taken) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            xpEarned = med.xpPerDose;
            
            const newTakenToday = [...med.takenToday];
            newTakenToday[doseIndex] = {
              ...newTakenToday[doseIndex],
              taken: true,
              time: timeString,
            };
            
            return {
              ...med,
              takenToday: newTakenToday,
            };
          }
        }
        return med;
      });
      
      saveMedicationsToStorage(updated);
      return updated;
    });
    
    return { success: xpEarned > 0, xpEarned };
  }, []);

  const getProgress = useCallback((medicationId: string): { taken: number; total: number; isComplete: boolean } => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return { taken: 0, total: 0, isComplete: false };
    
    const taken = med.takenToday.filter(d => d.taken).length;
    return {
      taken,
      total: med.dosesPerDay,
      isComplete: taken >= med.dosesPerDay,
    };
  }, [medications]);

  const getTotalProgress = useCallback((): { taken: number; total: number } => {
    let taken = 0;
    let total = 0;
    
    medications.forEach(med => {
      taken += med.takenToday.filter(d => d.taken).length;
      total += med.dosesPerDay;
    });
    
    return { taken, total };
  }, [medications]);

  return {
    medications,
    getMedication,
    logDose,
    getProgress,
    getTotalProgress,
  };
}
