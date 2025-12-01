import { useState, useEffect, useCallback } from 'react';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  category: 'daily' | 'bonus' | 'weekly';
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  legendary?: boolean;
  href?: string;
  source?: 'default' | 'activity' | 'chat';
}

const MISSIONS_STORAGE_KEY = 'loretta_active_missions';

const defaultMissions: Mission[] = [
  {
    id: '2',
    title: 'Complete 10 jumping jacks',
    category: 'daily',
    xpReward: 50,
    progress: 10,
    maxProgress: 10,
    completed: true,
    href: '/mission-details?id=2',
    source: 'default',
  },
  {
    id: '1',
    title: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    category: 'daily',
    xpReward: 30,
    progress: 5,
    maxProgress: 8,
    completed: false,
    href: '/mission-details?id=1',
    source: 'default',
  },
  {
    id: 'medication',
    title: 'Take medication',
    description: 'Complete your daily medication routine',
    category: 'daily',
    xpReward: 40,
    progress: 1,
    maxProgress: 3,
    completed: false,
    href: '/medications',
    source: 'default',
  },
  {
    id: 'streak-30',
    title: 'Maintain 30-day streak',
    description: 'Keep your streak alive!',
    category: 'bonus',
    xpReward: 500,
    progress: 30,
    maxProgress: 30,
    completed: true,
    legendary: true,
    href: '/streak',
    source: 'default',
  },
];

function loadMissionsFromStorage(): Mission[] {
  try {
    const stored = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load missions from storage:', e);
  }
  return defaultMissions;
}

function saveMissionsToStorage(missions: Mission[]) {
  try {
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
    window.dispatchEvent(new CustomEvent('missions-updated', { detail: missions }));
  } catch (e) {
    console.error('Failed to save missions to storage:', e);
  }
}

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>(() => loadMissionsFromStorage());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MISSIONS_STORAGE_KEY) {
        setMissions(loadMissionsFromStorage());
      }
    };

    const handleMissionsUpdate = (e: CustomEvent<Mission[]>) => {
      setMissions(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('missions-updated', handleMissionsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('missions-updated', handleMissionsUpdate as EventListener);
    };
  }, []);

  const addMission = useCallback((mission: Omit<Mission, 'id'> & { id?: string }) => {
    setMissions(prev => {
      const id = mission.id || `mission-${Date.now()}`;
      const existingIndex = prev.findIndex(m => m.id === id);
      
      let updated: Mission[];
      if (existingIndex >= 0) {
        updated = prev;
      } else {
        const newMission: Mission = {
          ...mission,
          id,
          completed: mission.completed ?? false,
          progress: mission.progress ?? 0,
        };
        updated = [...prev, newMission];
      }
      
      saveMissionsToStorage(updated);
      return updated;
    });
  }, []);

  const updateMissionProgress = useCallback((missionId: string, progress: number) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id === missionId) {
          const newProgress = Math.min(progress, m.maxProgress);
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.maxProgress,
          };
        }
        return m;
      });
      saveMissionsToStorage(updated);
      return updated;
    });
  }, []);

  const completeMission = useCallback((missionId: string) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id === missionId) {
          return {
            ...m,
            progress: m.maxProgress,
            completed: true,
          };
        }
        return m;
      });
      saveMissionsToStorage(updated);
      return updated;
    });
  }, []);

  const logMissionStep = useCallback((missionId: string) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id === missionId && m.progress < m.maxProgress) {
          const newProgress = m.progress + 1;
          return {
            ...m,
            progress: newProgress,
            completed: newProgress >= m.maxProgress,
          };
        }
        return m;
      });
      saveMissionsToStorage(updated);
      return updated;
    });
  }, []);

  const removeMission = useCallback((missionId: string) => {
    setMissions(prev => {
      const updated = prev.filter(m => m.id !== missionId);
      saveMissionsToStorage(updated);
      return updated;
    });
  }, []);

  const resetMissions = useCallback(() => {
    setMissions(defaultMissions);
    saveMissionsToStorage(defaultMissions);
  }, []);

  const completedCount = missions.filter(m => m.completed).length;
  const totalCount = missions.length;

  return {
    missions,
    addMission,
    updateMissionProgress,
    completeMission,
    logMissionStep,
    removeMission,
    resetMissions,
    completedCount,
    totalCount,
  };
}
