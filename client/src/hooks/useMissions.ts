import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';
import { apiRequest, authenticatedFetch } from '../lib/queryClient';
import { trackMission, trackGamification } from '../lib/clarity';
import { useXPUpdater } from './useXPUpdater';

export interface CatalogMission {
  id: string;
  missionKey: string;
  titleEn: string;
  titleDe: string;
  descriptionEn?: string | null;
  descriptionDe?: string | null;
  category: string;
  xpReward: number;
  maxProgress: number;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean | null;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  missionKey: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  isActive?: boolean | null;
  activatedAt?: string | null;
  completedAt?: string | null;
}

export interface Mission {
  id: string;
  title: string;
  description?: string | null;
  category: 'daily' | 'bonus' | 'weekly' | string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  legendary?: boolean | null;
  isActive?: boolean | null;
  href?: string | null;
  source?: 'default' | 'activity' | 'chat' | string | null;
  missionKey?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  icon?: string | null;
  color?: string | null;
}

export function useMissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateAllXPDisplays, deductXP } = useXPUpdater();
  const { i18n } = useTranslation();
  const userId = user?.id;
  
  // Get current language from i18n (reactive to language changes)
  const currentLanguage = i18n.language?.startsWith('de') ? 'de' : 'en';

  const { data: catalogMissions = [], isLoading: catalogLoading } = useQuery<CatalogMission[]>({
    queryKey: ['/api/missions-catalog'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/missions-catalog');
      if (!response.ok) {
        throw new Error('Failed to fetch missions catalog');
      }
      return response.json();
    },
  });

  const { data: userMissions = [], isLoading: userMissionsLoading, error } = useQuery<UserMission[]>({
    queryKey: ['/api/missions'],
    queryFn: async () => {
      if (!userId) return [];
      const response = await authenticatedFetch('/api/missions');
      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  const isLoading = catalogLoading || userMissionsLoading;

  // Memoize missions with language as dependency for reactivity
  const missions: Mission[] = useMemo(() => {
    return userMissions.map(um => {
      const catalogMission = catalogMissions.find(cm => cm.missionKey === um.missionKey);
      return {
        id: um.id,
        title: catalogMission ? (currentLanguage === 'de' ? catalogMission.titleDe : catalogMission.titleEn) : um.missionKey,
        description: catalogMission ? (currentLanguage === 'de' ? catalogMission.descriptionDe : catalogMission.descriptionEn) : null,
        category: catalogMission?.category || 'daily',
        xpReward: catalogMission?.xpReward || 0,
        progress: um.progress,
        maxProgress: um.maxProgress,
        completed: um.completed,
        isActive: um.isActive,
        href: `/mission-details?id=${um.missionKey}`,
        missionKey: um.missionKey,
        userId: um.userId,
        completedAt: um.completedAt,
        icon: catalogMission?.icon,
        color: catalogMission?.color,
      };
    });
  }, [userMissions, catalogMissions, currentLanguage]);

  const createMissionMutation = useMutation({
    mutationFn: async (mission: Omit<Mission, 'id'> & { id?: string }) => {
      const response = await apiRequest('POST', '/api/missions', {
        ...mission,
        userId,
        missionKey: mission.missionKey || mission.id || `mission-${Date.now()}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
  });

  const updateMissionProgressOptimistically = useCallback((missionId: string, newProgress: number, isCompleted: boolean) => {
    queryClient.setQueryData<UserMission[]>(['/api/missions'], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(m => 
        m.id === missionId 
          ? { 
              ...m, 
              progress: newProgress, 
              completed: isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : m.completedAt
            }
          : m
      );
    });
  }, [queryClient]);

  const updateMissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { progress?: number; completed?: boolean; isActive?: boolean } }) => {
      const response = await apiRequest('PATCH', `/api/missions/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.data.progress !== undefined) {
        updateMissionProgressOptimistically(variables.id, variables.data.progress, variables.data.completed || false);
      }
      if (variables.data.completed) {
        const mission = missions.find(m => m.id === variables.id);
        if (mission) {
          updateAllXPDisplays(mission.xpReward, 'mission', { missionId: parseInt(mission.id) });
          trackMission('completed', mission.title, mission.xpReward);
          trackGamification('xp_earned', { amount: mission.xpReward, source: 'mission' });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/missions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
  });

  const resetMissionsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await apiRequest('POST', `/api/missions/reset`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
  });

  const activateAlternativeMutation = useMutation({
    mutationFn: async ({ parentMissionKey, alternativeMissionKey }: { parentMissionKey: string; alternativeMissionKey: string }) => {
      const response = await apiRequest('POST', '/api/missions/activate-alternative', {
        parentMissionKey,
        alternativeMissionKey,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
  });

  const addMission = useCallback((mission: Omit<Mission, 'id'> & { id?: string }) => {
    createMissionMutation.mutate(mission);
  }, [createMissionMutation]);

  const updateMissionProgress = useCallback((missionId: string, progress: number) => {
    console.log('[useMissions] updateMissionProgress called', { missionId, progress, missionsCount: missions.length });
    const mission = missions.find(m => m.id === missionId);
    console.log('[useMissions] Found mission?', !!mission, mission ? { id: mission.id, progress: mission.progress } : null);
    if (mission) {
      const newProgress = Math.min(progress, mission.maxProgress);
      console.log('[useMissions] Calling mutation', { missionId, newProgress, completed: newProgress >= mission.maxProgress });
      updateMissionMutation.mutate({
        id: missionId,
        data: {
          progress: newProgress,
          completed: newProgress >= mission.maxProgress,
        },
      });
    } else {
      console.log('[useMissions] Mission not found in array!', { lookingFor: missionId, availableIds: missions.map(m => m.id) });
    }
  }, [missions, updateMissionMutation]);

  const completeMission = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      updateMissionMutation.mutate({
        id: missionId,
        data: {
          progress: mission.maxProgress,
          completed: true,
        },
      });
    }
  }, [missions, updateMissionMutation]);

  const logMissionStep = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission && mission.progress < mission.maxProgress) {
      const newProgress = mission.progress + 1;
      updateMissionMutation.mutate({
        id: missionId,
        data: {
          progress: newProgress,
          completed: newProgress >= mission.maxProgress,
        },
      });
    }
  }, [missions, updateMissionMutation]);

  const undoMissionStep = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission && mission.progress > 0) {
      const newProgress = mission.progress - 1;
      const wasCompleted = mission.completed;
      
      // Optimistically deduct XP if mission was completed
      if (wasCompleted && mission.xpReward > 0) {
        deductXP(mission.xpReward, 'mission_undo', { missionId: parseInt(missionId) });
      }
      
      // Optimistically update mission progress
      queryClient.setQueryData<UserMission[]>(['/api/missions'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(m => 
          m.id === missionId 
            ? { ...m, progress: newProgress, completed: false, completedAt: null }
            : m
        );
      });
      
      updateMissionMutation.mutate({
        id: missionId,
        data: {
          progress: newProgress,
          completed: false,
        },
      });
    }
  }, [missions, updateMissionMutation, deductXP, queryClient]);

  const removeMission = useCallback((missionId: string) => {
    deleteMissionMutation.mutate(missionId);
  }, [deleteMissionMutation]);

  const resetMissions = useCallback(() => {
    resetMissionsMutation.mutate();
  }, [resetMissionsMutation]);

  const activateMission = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      trackMission('started', mission.title);
    }
    updateMissionMutation.mutate({
      id: missionId,
      data: { isActive: true },
    });
  }, [missions, updateMissionMutation]);

  const deactivateMission = useCallback((missionId: string) => {
    updateMissionMutation.mutate({
      id: missionId,
      data: { isActive: false },
    });
  }, [updateMissionMutation]);

  const toggleMissionActive = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      updateMissionMutation.mutate({
        id: missionId,
        data: { isActive: !mission.isActive },
      });
    }
  }, [missions, updateMissionMutation]);

  const activateAlternativeMission = useCallback((parentMissionKey: string, alternativeMissionKey: string) => {
    return activateAlternativeMutation.mutateAsync({ parentMissionKey, alternativeMissionKey });
  }, [activateAlternativeMutation]);

  const activeMissions = missions.filter(m => m.isActive);
  const inactiveMissions = missions.filter(m => !m.isActive);
  const completedCount = missions.filter(m => m.completed).length;
  const totalCount = missions.length;

  return {
    missions,
    catalogMissions,
    activeMissions,
    inactiveMissions,
    addMission,
    updateMissionProgress,
    completeMission,
    logMissionStep,
    undoMissionStep,
    removeMission,
    resetMissions,
    activateMission,
    deactivateMission,
    toggleMissionActive,
    activateAlternativeMission,
    isActivatingAlternative: activateAlternativeMutation.isPending,
    completedCount,
    totalCount,
    isLoading,
    error,
  };
}
