import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from './use-auth';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
  xpToday?: number;
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

type XPUpdateCallback = (newTotalXP: number, xpChange: number, newLevel: number, xpToday: number) => void;

const xpUpdateListeners = new Set<XPUpdateCallback>();

export function useXPUpdater() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const lastUpdateRef = useRef<number>(0);

  const notifyListeners = useCallback((newTotalXP: number, xpChange: number, newLevel: number, xpToday: number) => {
    xpUpdateListeners.forEach(listener => {
      try {
        listener(newTotalXP, xpChange, newLevel, xpToday);
      } catch (e) {
        console.error('XP listener error:', e);
      }
    });
  }, []);

  const updateAllXPDisplays = useCallback((
    xpChange: number, 
    source: 'mission' | 'mission_step' | 'checkin' | 'achievement' | 'bonus' | 'other',
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
    let newXpToday = 0;

    queryClient.setQueryData<GamificationData>(['/api/gamification', userId], (oldData) => {
      if (!oldData) return oldData;
      
      newTotalXP = oldData.xp + xpChange;
      newLevel = calculateLevelFromXP(newTotalXP);
      newXpToday = (oldData.xpToday || 0) + xpChange;
      
      return {
        ...oldData,
        xp: newTotalXP,
        level: newLevel,
        xpToday: newXpToday,
      };
    });

    if (source === 'checkin' && options?.checkinId) {
      queryClient.setQueryData<EmotionalCheckin[]>(['/api/emotional-checkins', userId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(checkin => 
          checkin.id === options.checkinId 
            ? { ...checkin, xpAwarded: (checkin.xpAwarded || 0) + xpChange }
            : checkin
        );
      });
    }

    if (source === 'mission' && options?.missionId) {
      queryClient.setQueryData<UserMission[]>(['/api/missions', userId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(mission => 
          mission.id === options.missionId 
            ? { ...mission, completed: true, completedAt: new Date().toISOString() }
            : mission
        );
      });
    }

    queryClient.invalidateQueries({ queryKey: ['/api/activities/today', userId] });

    notifyListeners(newTotalXP, xpChange, newLevel, newXpToday);

    console.log(`[XP Update] +${xpChange} XP from ${source}. Total: ${newTotalXP}, Level: ${newLevel}, Today: ${newXpToday}`);

    return { newTotalXP, newLevel, xpChange, xpToday: newXpToday };
  }, [queryClient, notifyListeners, userId]);

  const deductXP = useCallback((
    xpAmount: number,
    source: 'mission_undo' | 'penalty' | 'other',
    options?: {
      missionId?: number;
    }
  ) => {
    let newTotalXP = 0;
    let newLevel = 1;
    let newXpToday = 0;

    queryClient.setQueryData<GamificationData>(['/api/gamification', userId], (oldData) => {
      if (!oldData) return oldData;
      
      newTotalXP = Math.max(0, oldData.xp - xpAmount);
      newLevel = calculateLevelFromXP(newTotalXP);
      newXpToday = Math.max(0, (oldData.xpToday || 0) - xpAmount);
      
      return {
        ...oldData,
        xp: newTotalXP,
        level: newLevel,
        xpToday: newXpToday,
      };
    });

    if (source === 'mission_undo' && options?.missionId) {
      queryClient.setQueryData<UserMission[]>(['/api/missions', userId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(mission => 
          mission.id === options.missionId 
            ? { ...mission, completed: false, completedAt: null }
            : mission
        );
      });
    }

    queryClient.invalidateQueries({ queryKey: ['/api/activities/today', userId] });

    notifyListeners(newTotalXP, -xpAmount, newLevel, newXpToday);

    console.log(`[XP Update] -${xpAmount} XP from ${source}. Total: ${newTotalXP}, Level: ${newLevel}, Today: ${newXpToday}`);

    return { newTotalXP, newLevel, xpChange: -xpAmount, xpToday: newXpToday };
  }, [queryClient, notifyListeners, userId]);

  const refreshAllXPData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/activities/today', userId] });
    queryClient.invalidateQueries({ queryKey: ['/api/achievements/user', userId] });
  }, [queryClient, userId]);

  const updateStreak = useCallback((newStreak: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification', userId], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        currentStreak: newStreak,
        longestStreak: Math.max(oldData.longestStreak, newStreak),
        lastCheckIn: new Date().toISOString(),
      };
    });
  }, [queryClient, userId]);

  const updateLives = useCallback((livesChange: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification', userId], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        lives: Math.max(0, Math.min(5, oldData.lives + livesChange)),
      };
    });
  }, [queryClient, userId]);

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
