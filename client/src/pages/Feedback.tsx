import { useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import lorettaLogoWhite from '/loretta_logo_white.png';

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl
      ${glow ? 'shadow-[#013DC4]/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

const localizations = {
  en: {
    title: 'Send Feedback',
    subtitle: 'Help us improve Loretta',
    category: 'Category',
    categories: {
      general: 'General Feedback',
      bug: 'Bug Report',
      feature: 'Feature Request',
      other: 'Other',
    },
    subject: 'Subject',
    subjectPlaceholder: 'Brief summary of your feedback',
    message: 'Message',
    messagePlaceholder: 'Tell us more details...',
    send: 'Send Feedback',
    sending: 'Sending...',
    error: 'Error',
    errorDescription: 'Please fill in all required fields',
    success: 'Feedback Sent',
    successDescription: 'Thank you for your feedback! We appreciate you taking the time to help us improve.',
    cancel: 'Cancel',
    backToDashboard: 'Back to Dashboard',
  },
  de: {
    title: 'Feedback senden',
    subtitle: 'Helfen Sie uns, Loretta zu verbessern',
    category: 'Kategorie',
    categories: {
      general: 'Allgemeines Feedback',
      bug: 'Fehlerbericht',
      feature: 'Funktionswunsch',
      other: 'Sonstiges',
    },
    subject: 'Betreff',
    subjectPlaceholder: 'Kurze Zusammenfassung Ihres Feedbacks',
    message: 'Nachricht',
    messagePlaceholder: 'Erzählen Sie uns mehr Details...',
    send: 'Feedback senden',
    sending: 'Wird gesendet...',
    error: 'Fehler',
    errorDescription: 'Bitte füllen Sie alle erforderlichen Felder aus',
    success: 'Feedback gesendet',
    successDescription: 'Vielen Dank für Ihr Feedback! Wir schätzen es, dass Sie sich die Zeit nehmen, uns zu helfen.',
    cancel: 'Abbrechen',
    backToDashboard: 'Zurück zum Dashboard',
  },
};

export default function Feedback() {
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('de') ? 'de' : 'en';
  const localT = localizations[language];
  
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  useSwipeBack({ backPath: '/my-dashboard' });
  
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    category: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 safe-area-top safe-area-bottom">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async () => {
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      toast({
        title: localT.error,
        description: localT.errorDescription,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/feedback', {
        subject: feedbackForm.subject.trim(),
        message: feedbackForm.message.trim(),
        category: feedbackForm.category,
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: localT.success,
          description: localT.successDescription,
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send feedback');
      }
    } catch (error: any) {
      toast({
        title: localT.error,
        description: error.message || 'Failed to send feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 safe-area-top safe-area-bottom">
        <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] pt-8 px-4 pb-6">
          <div className="max-w-lg mx-auto flex items-center justify-center">
            <img src={lorettaLogoWhite} alt="Loretta" className="h-8 object-contain" />
          </div>
        </div>
        
        <div className="max-w-lg mx-auto p-4 -mt-4">
          <GlassCard className="p-8 text-center" glow>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              {localT.success}
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              {localT.successDescription}
            </p>
            <Button
              onClick={() => navigate('/my-dashboard')}
              className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20 min-h-[48px] active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {localT.backToDashboard}
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 safe-area-top safe-area-bottom">
      <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] pt-8 px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BackButton 
              href="/my-dashboard" 
              className="text-white hover:bg-white/20"
              data-testid="button-back-dashboard" 
            />
            <div className="flex-1 flex justify-center">
              <img src={lorettaLogoWhite} alt="Loretta" className="h-6 object-contain" />
            </div>
            <div className="w-10" />
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{localT.title}</h1>
            <p className="text-white/80 text-sm font-medium">{localT.subtitle}</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto p-4 -mt-4">
        <GlassCard className="p-6" glow>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="feedback-category" className="text-gray-700 dark:text-gray-300 font-bold">
                {localT.category}
              </Label>
              <Select
                value={feedbackForm.category}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, category: value })}
              >
                <SelectTrigger 
                  id="feedback-category" 
                  className="h-12 rounded-xl border-white/50 dark:border-white/10 bg-white/50 dark:bg-gray-800/50"
                  data-testid="select-feedback-category"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{localT.categories.general}</SelectItem>
                  <SelectItem value="bug">{localT.categories.bug}</SelectItem>
                  <SelectItem value="feature">{localT.categories.feature}</SelectItem>
                  <SelectItem value="other">{localT.categories.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-subject" className="text-gray-700 dark:text-gray-300 font-bold">
                {localT.subject}
              </Label>
              <Input
                id="feedback-subject"
                value={feedbackForm.subject}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                placeholder={localT.subjectPlaceholder}
                maxLength={200}
                className="h-12 rounded-xl border-white/50 dark:border-white/10 bg-white/50 dark:bg-gray-800/50"
                data-testid="input-feedback-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-message" className="text-gray-700 dark:text-gray-300 font-bold">
                {localT.message}
              </Label>
              <textarea
                id="feedback-message"
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                placeholder={localT.messagePlaceholder}
                maxLength={5000}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#013DC4] resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                data-testid="textarea-feedback-message"
              />
              <p className="text-xs text-gray-400 text-right">
                {feedbackForm.message.length}/5000
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-dashboard')} 
                className="flex-1 h-12 rounded-xl font-bold min-h-[48px] active:scale-95 transition-transform"
              >
                {localT.cancel}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1 h-12 bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] hover:opacity-90 text-white rounded-xl font-bold min-h-[48px] active:scale-95 transition-transform"
                disabled={isSubmitting || !feedbackForm.subject.trim() || !feedbackForm.message.trim()}
                data-testid="button-submit-feedback"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? localT.sending : localT.send}
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
