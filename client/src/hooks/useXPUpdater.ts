import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

interface EmotionalCheckin {
  id: number;
  userId: number;
  emotion: string;
  checkedInAt: string;
  xpAwarded: number;
}

interface UserMission {
  id: number;
  missionKey: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  xpReward: number;
  isActive: boolean;
}

const BASE_XP_PER_LEVEL = 100;

function calculateLevelFromXP(xp: number): number {
  return Math.floor(xp / BASE_XP_PER_LEVEL) + 1;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

type XPUpdateCallback = (newTotalXP: number, xpChange: number, newLevel: number) => void;

const xpUpdateListeners = new Set<XPUpdateCallback>();

export function useXPUpdater() {
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(0);

  const notifyListeners = useCallback((newTotalXP: number, xpChange: number, newLevel: number) => {
    xpUpdateListeners.forEach(listener => {
      try {
        listener(newTotalXP, xpChange, newLevel);
      } catch (e) {
        console.error('XP listener error:', e);
      }
    });
  }, []);

  const updateAllXPDisplays = useCallback((
    xpChange: number, 
    source: 'mission' | 'checkin' | 'achievement' | 'bonus' | 'other',
    options?: {
      missionId?: number;
      checkinId?: number;
      skipOptimistic?: boolean;
    }
  ) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 50) {
      return;
    }
    lastUpdateRef.current = now;

    let newTotalXP = 0;
    let newLevel = 1;

    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      newTotalXP = oldData.xp + xpChange;
      newLevel = calculateLevelFromXP(newTotalXP);
      
      return {
        ...oldData,
        xp: newTotalXP,
        level: newLevel,
      };
    });

    if (source === 'checkin' && options?.checkinId) {
      queryClient.setQueryData<EmotionalCheckin[]>(['/api/emotional-checkins'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(checkin => 
          checkin.id === options.checkinId 
            ? { ...checkin, xpAwarded: (checkin.xpAwarded || 0) + xpChange }
            : checkin
        );
      });
    }

    if (source === 'mission' && options?.missionId) {
      queryClient.setQueryData<UserMission[]>(['/api/missions'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(mission => 
          mission.id === options.missionId 
            ? { ...mission, completed: true, completedAt: new Date().toISOString() }
            : mission
        );
      });
    }

    queryClient.invalidateQueries({ queryKey: ['/api/activities/today'] });

    notifyListeners(newTotalXP, xpChange, newLevel);

    console.log(`[XP Update] +${xpChange} XP from ${source}. Total: ${newTotalXP}, Level: ${newLevel}`);

    return { newTotalXP, newLevel, xpChange };
  }, [queryClient, notifyListeners]);

  const deductXP = useCallback((
    xpAmount: number,
    source: 'mission_undo' | 'penalty' | 'other',
    options?: {
      missionId?: number;
    }
  ) => {
    let newTotalXP = 0;
    let newLevel = 1;

    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      newTotalXP = Math.max(0, oldData.xp - xpAmount);
      newLevel = calculateLevelFromXP(newTotalXP);
      
      return {
        ...oldData,
        xp: newTotalXP,
        level: newLevel,
      };
    });

    if (source === 'mission_undo' && options?.missionId) {
      queryClient.setQueryData<UserMission[]>(['/api/missions'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(mission => 
          mission.id === options.missionId 
            ? { ...mission, completed: false, completedAt: null }
            : mission
        );
      });
    }

    queryClient.invalidateQueries({ queryKey: ['/api/activities/today'] });

    notifyListeners(newTotalXP, -xpAmount, newLevel);

    console.log(`[XP Update] -${xpAmount} XP from ${source}. Total: ${newTotalXP}, Level: ${newLevel}`);

    return { newTotalXP, newLevel, xpChange: -xpAmount };
  }, [queryClient, notifyListeners]);

  const refreshAllXPData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins'] });
    queryClient.invalidateQueries({ queryKey: ['/api/activities/today'] });
    queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
  }, [queryClient]);

  const updateStreak = useCallback((newStreak: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        currentStreak: newStreak,
        longestStreak: Math.max(oldData.longestStreak, newStreak),
        lastCheckIn: new Date().toISOString(),
      };
    });
  }, [queryClient]);

  const updateLives = useCallback((livesChange: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        lives: Math.max(0, Math.min(5, oldData.lives + livesChange)),
      };
    });
  }, [queryClient]);

  return {
    updateAllXPDisplays,
    deductXP,
    refreshAllXPData,
    updateStreak,
    updateLives,
  };
}

export function useXPUpdateListener(callback: XPUpdateCallback) {
  useEffect(() => {
    xpUpdateListeners.add(callback);
    return () => {
      xpUpdateListeners.delete(callback);
    };
  }, [callback]);
}

export function subscribeToXPUpdates(callback: XPUpdateCallback): () => void {
  xpUpdateListeners.add(callback);
  return () => {
    xpUpdateListeners.delete(callback);
  };
}
