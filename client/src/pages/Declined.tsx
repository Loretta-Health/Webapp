import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import lorettaLogo from '@assets/logos/loretta_logo.png';

export default function Declined() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation('pages');

  const handleGoBack = () => {
    localStorage.removeItem('loretta_consent');
    setLocation('/');
  };

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
        
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="w-full"
          data-testid="button-go-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('declined.goBack')}
        </Button>
      </Card>
    </div>
  );
}
