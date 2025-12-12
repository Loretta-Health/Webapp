import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { apiRequest } from '../lib/queryClient';

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
  icon?: string | null;
  color?: string | null;
}

export function useMissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: catalogMissions = [], isLoading: catalogLoading } = useQuery<CatalogMission[]>({
    queryKey: ['/api/missions-catalog'],
    queryFn: async () => {
      const response = await fetch('/api/missions-catalog', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch missions catalog');
      }
      return response.json();
    },
  });

  const { data: userMissions = [], isLoading: userMissionsLoading, error } = useQuery<UserMission[]>({
    queryKey: ['/api/missions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/missions/${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  const isLoading = catalogLoading || userMissionsLoading;

  const getCurrentLanguage = (): 'en' | 'de' => {
    if (typeof window !== 'undefined') {
      const lang = localStorage.getItem('i18nextLng') || 'en';
      return lang.startsWith('de') ? 'de' : 'en';
    }
    return 'en';
  };

  const missions: Mission[] = userMissions.map(um => {
    const catalogMission = catalogMissions.find(cm => cm.missionKey === um.missionKey);
    const lang = getCurrentLanguage();
    return {
      id: um.id,
      title: catalogMission ? (lang === 'de' ? catalogMission.titleDe : catalogMission.titleEn) : um.missionKey,
      description: catalogMission ? (lang === 'de' ? catalogMission.descriptionDe : catalogMission.descriptionEn) : null,
      category: catalogMission?.category || 'daily',
      xpReward: catalogMission?.xpReward || 0,
      progress: um.progress,
      maxProgress: um.maxProgress,
      completed: um.completed,
      isActive: um.isActive,
      href: `/mission-details?id=${um.missionKey}`,
      missionKey: um.missionKey,
      userId: um.userId,
      icon: catalogMission?.icon,
      color: catalogMission?.color,
    };
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { progress?: number; completed?: boolean; isActive?: boolean } }) => {
      const response = await apiRequest('PATCH', `/api/missions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/missions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
    },
  });

  const resetMissionsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID');
      const response = await apiRequest('POST', `/api/missions/${userId}/reset`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
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

  const removeMission = useCallback((missionId: string) => {
    deleteMissionMutation.mutate(missionId);
  }, [deleteMissionMutation]);

  const resetMissions = useCallback(() => {
    resetMissionsMutation.mutate();
  }, [resetMissionsMutation]);

  const activateMission = useCallback((missionId: string) => {
    updateMissionMutation.mutate({
      id: missionId,
      data: { isActive: true },
    });
  }, [updateMissionMutation]);

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
    removeMission,
    resetMissions,
    activateMission,
    deactivateMission,
    toggleMissionActive,
    completedCount,
    totalCount,
    isLoading,
    error,
  };
}
