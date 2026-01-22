import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

const BASE_XP_PER_LEVEL = 100;

function calculateLevelFromXP(xp: number): number {
  return Math.floor(xp / BASE_XP_PER_LEVEL) + 1;
}

export function useOptimisticGamification() {
  const queryClient = useQueryClient();

  const addXpOptimistically = useCallback((xpAmount: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      const newXp = oldData.xp + xpAmount;
      const newLevel = calculateLevelFromXP(newXp);
      
      return {
        ...oldData,
        xp: newXp,
        level: newLevel,
      };
    });
  }, [queryClient]);

  const deductXpOptimistically = useCallback((xpAmount: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      const newXp = Math.max(0, oldData.xp - xpAmount);
      const newLevel = calculateLevelFromXP(newXp);
      
      return {
        ...oldData,
        xp: newXp,
        level: newLevel,
      };
    });
  }, [queryClient]);

  const updateStreakOptimistically = useCallback((newStreak: number) => {
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

  const updateLivesOptimistically = useCallback((livesChange: number) => {
    queryClient.setQueryData<GamificationData>(['/api/gamification'], (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        lives: Math.max(0, Math.min(5, oldData.lives + livesChange)),
      };
    });
  }, [queryClient]);

  const refreshGamification = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
  }, [queryClient]);

  return {
    addXpOptimistically,
    deductXpOptimistically,
    updateStreakOptimistically,
    updateLivesOptimistically,
    refreshGamification,
  };
}
