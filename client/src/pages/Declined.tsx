import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import lorettaLogo from '@assets/logos/loretta_logo.png';

export default function Declined() {
  const { t } = useTranslation('pages');
  useSwipeBack({ backPath: '/welcome' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center border-0 shadow-2xl">
        <div className="flex justify-center mb-6">
          <img src={lorettaLogo} alt="Loretta" className="h-10 object-contain opacity-50" />
        </div>
        
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-black text-foreground mb-3">{t('declined.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('declined.message')}
        </p>
        
        <BackButton 
          href="/welcome" 
          className="w-full justify-center" 
          data-testid="button-go-back" 
        />
      </Card>
    </div>
  );
}
