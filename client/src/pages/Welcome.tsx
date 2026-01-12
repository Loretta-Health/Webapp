import ConsentForm from '@/components/ConsentForm';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useEffect } from 'react';

interface QuestionnaireRecord {
  category: string;
  answers: Record<string, string>;
}

interface UserPreferences {
  consentAccepted?: boolean;
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const { isLoading, markConsentComplete, isConsentComplete, isQuestionnaireComplete } = useOnboardingProgress();

  const { data: questionnaireData, isLoading: questLoading } = useQuery<QuestionnaireRecord[]>({
    queryKey: ['/api/questionnaires'],
    enabled: !!userId,
  });

  const { data: preferencesData, isLoading: prefsLoading } = useQuery<UserPreferences | null>({
    queryKey: ['/api/preferences'],
    enabled: !!userId,
  });

  const legacyQuestionnaireComplete = Array.isArray(questionnaireData) && questionnaireData.length > 0;
  
  const allLoading = isLoading || questLoading || prefsLoading;
  const effectiveQuestionnaireComplete = isQuestionnaireComplete || legacyQuestionnaireComplete;
  const effectiveConsentComplete = isConsentComplete || preferencesData?.consentAccepted === true;

  useEffect(() => {
    if (!allLoading && effectiveConsentComplete) {
      if (effectiveQuestionnaireComplete) {
        setLocation('/my-dashboard');
      } else {
        setLocation('/onboarding');
      }
    }
  }, [allLoading, effectiveConsentComplete, effectiveQuestionnaireComplete, setLocation]);

  const savePreferencesMutation = useMutation({
    mutationFn: async ({ consentAccepted, newsletterSubscribed }: { consentAccepted: boolean; newsletterSubscribed: boolean }) => {
      return apiRequest('POST', '/api/preferences', {
        consentAccepted,
        consentDate: new Date().toISOString(),
        newsletterSubscribed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    },
  });

  const handleAccept = async (newsletterOptIn: boolean) => {
    await savePreferencesMutation.mutateAsync({
      consentAccepted: true,
      newsletterSubscribed: newsletterOptIn,
    });
    
    const success = await markConsentComplete();
    
    if (success) {
      setLocation('/onboarding');
    }
  };

  const handleDecline = async () => {
    await savePreferencesMutation.mutateAsync({
      consentAccepted: false,
      newsletterSubscribed: false,
    });
    
    setLocation('/declined');
  };

  if (allLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 safe-area-top safe-area-bottom">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20">
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return <ConsentForm onAccept={handleAccept} onDecline={handleDecline} />;
}
