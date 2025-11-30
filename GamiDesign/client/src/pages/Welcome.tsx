import ConsentForm from '@/components/ConsentForm';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getUserId } from '@/lib/userId';

export default function Welcome() {
  const [, setLocation] = useLocation();
  const userId = getUserId();

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

  const handleAccept = (newsletterOptIn: boolean) => {
    localStorage.setItem('loretta_consent', 'accepted');
    localStorage.setItem('loretta_newsletter', newsletterOptIn ? 'subscribed' : 'not_subscribed');
    
    savePreferencesMutation.mutate({
      consentAccepted: true,
      newsletterSubscribed: newsletterOptIn,
    });
    
    setLocation('/dashboard');
  };

  const handleDecline = () => {
    localStorage.setItem('loretta_consent', 'declined');
    
    savePreferencesMutation.mutate({
      consentAccepted: false,
      newsletterSubscribed: false,
    });
    
    setLocation('/declined');
  };

  return <ConsentForm onAccept={handleAccept} onDecline={handleDecline} />;
}
