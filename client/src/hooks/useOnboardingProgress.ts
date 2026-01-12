import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { apiRequest, getApiUrl } from '../lib/queryClient';

export interface OnboardingProgress {
  id: string;
  userId: string;
  accountCreated: boolean;
  accountCreatedAt: string | null;
  consentCompleted: boolean;
  consentCompletedAt: string | null;
  questionnaireCompleted: boolean;
  questionnaireCompletedAt: string | null;
  onboardingComplete: boolean;
  onboardingCompletedAt: string | null;
  setupChecklistDismissed: boolean;
  setupChecklistDismissedAt: string | null;
}

export type OnboardingStep = 'account' | 'consent' | 'questionnaire' | 'complete';

export function useOnboardingProgress() {
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: progress, isLoading, error, isError } = useQuery<OnboardingProgress | null>({
    queryKey: ['/api/onboarding-progress'],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(getApiUrl('/api/onboarding-progress'), {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          logoutMutation.mutate();
          throw new Error('Session expired');
        }
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch onboarding progress');
      }
      return response.json();
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error.message === 'Session expired') return false;
      return failureCount < 2;
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: Partial<{
      consentCompleted: boolean;
      consentCompletedAt: string;
      questionnaireCompleted: boolean;
      questionnaireCompletedAt: string;
      onboardingComplete: boolean;
      onboardingCompletedAt: string;
      setupChecklistDismissed: boolean;
      setupChecklistDismissedAt: string;
    }>) => {
      if (!userId) throw new Error('No user ID');
      const response = await apiRequest('POST', `/api/onboarding-progress`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-progress'] });
    },
    onError: (error) => {
      console.error('Failed to update onboarding progress:', error);
    },
  });

  const markConsentComplete = async (): Promise<boolean> => {
    try {
      await updateProgressMutation.mutateAsync({
        consentCompleted: true,
        consentCompletedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const markQuestionnaireComplete = async (): Promise<boolean> => {
    try {
      await updateProgressMutation.mutateAsync({
        questionnaireCompleted: true,
        questionnaireCompletedAt: new Date().toISOString(),
        onboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const markSetupChecklistDismissed = async (): Promise<boolean> => {
    try {
      await updateProgressMutation.mutateAsync({
        setupChecklistDismissed: true,
        setupChecklistDismissedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const getNextIncompleteStep = (): OnboardingStep => {
    if (!user) return 'account';
    if (!progress) return 'consent';
    if (!progress.consentCompleted) return 'consent';
    if (!progress.questionnaireCompleted) return 'questionnaire';
    return 'complete';
  };

  const getRedirectPath = (): string => {
    const step = getNextIncompleteStep();
    switch (step) {
      case 'account':
        return '/auth';
      case 'consent':
        return '/welcome';
      case 'questionnaire':
        return '/onboarding';
      case 'complete':
        return '/my-dashboard';
    }
  };

  return {
    progress,
    isLoading,
    error,
    isError,
    isUpdating: updateProgressMutation.isPending,
    updateError: updateProgressMutation.error,
    markConsentComplete,
    markQuestionnaireComplete,
    markSetupChecklistDismissed,
    getNextIncompleteStep,
    getRedirectPath,
    isOnboardingComplete: progress?.onboardingComplete ?? false,
    isConsentComplete: progress?.consentCompleted ?? false,
    isQuestionnaireComplete: progress?.questionnaireCompleted ?? false,
    isSetupChecklistDismissed: progress?.setupChecklistDismissed ?? false,
  };
}
