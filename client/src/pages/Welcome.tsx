import ConsentForm from '@/components/ConsentForm';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useEffect } from 'react';

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = user?.id;
  const { progress, isLoading, markConsentComplete, isConsentComplete, isQuestionnaireComplete } = useOnboardingProgress();

  useEffect(() => {
    if (!isLoading && isConsentComplete) {
      if (isQuestionnaireComplete) {
        setLocation('/my-dashboard');
      } else {
        setLocation('/onboarding');
      }
    }
  }, [isLoading, isConsentComplete, isQuestionnaireComplete, setLocation]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return <ConsentForm onAccept={handleAccept} onDecline={handleDecline} />;
}
