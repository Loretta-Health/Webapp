import ConsentForm from '@/components/ConsentForm';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useEffect } from 'react';

interface UserPreferences {
  consentGiven?: boolean;
}

interface QuestionnaireRecord {
  category: string;
  answers: Record<string, string>;
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const { progress, isLoading, markConsentComplete, isConsentComplete, isQuestionnaireComplete } = useOnboardingProgress();

  const { data: preferencesData, isLoading: prefsLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences', userId],
    enabled: !!userId,
  });

  const { data: questionnaireData, isLoading: questLoading } = useQuery<QuestionnaireRecord[]>({
    queryKey: ['/api/questionnaires', userId],
    enabled: !!userId,
  });

  const legacyConsentComplete = preferencesData?.consentGiven === true || localStorage.getItem('loretta_consent') === 'accepted';
  const legacyQuestionnaireComplete = Array.isArray(questionnaireData) && questionnaireData.length > 0;
  
  const allLoading = isLoading || prefsLoading || questLoading;
  const effectiveConsentComplete = isConsentComplete || legacyConsentComplete;
  const effectiveQuestionnaireComplete = isQuestionnaireComplete || legacyQuestionnaireComplete;

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
        userId,
        consentAccepted,
        consentDate: new Date().toISOString(),
        newsletterSubscribed,
      });
    },
  });

  const handleAccept = async (newsletterOptIn: boolean) => {
    localStorage.setItem('loretta_consent', 'accepted');
    localStorage.setItem('loretta_newsletter', newsletterOptIn ? 'subscribed' : 'not_subscribed');
    
    savePreferencesMutation.mutate({
      consentAccepted: true,
      newsletterSubscribed: newsletterOptIn,
    });
    
    const success = await markConsentComplete();
    
    if (success) {
      setLocation('/onboarding');
    }
  };

  const handleDecline = () => {
    localStorage.setItem('loretta_consent', 'declined');
    
    savePreferencesMutation.mutate({
      consentAccepted: false,
      newsletterSubscribed: false,
    });
    
    setLocation('/declined');
  };

  if (allLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return <ConsentForm onAccept={handleAccept} onDecline={handleDecline} />;
}
