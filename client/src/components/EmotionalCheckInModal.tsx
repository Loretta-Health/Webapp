import { useState, useRef, useEffect } from 'react';
import { Dialog, SwipeableDialogContent, DialogHeader, DialogTitle } from '@/components/ui/swipeable-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile, Send, Sparkles, Check, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from "@/lib/queryClient";
import { 
  getRandomSupportiveMessage, 
  getEmotionEmoji,
  type EmotionCategory 
} from '../../../shared/emotions';
import { trackCheckin, trackModal } from '@/lib/clarity';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';

interface EmotionalCheckInModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCheckInComplete?: (emotion: string, xpAwarded: number) => void;
}

type CheckInStep = 'asking' | 'detecting' | 'confirming' | 'supportive' | 'retry';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp?: Date;
}

function formatTime(date?: Date): string {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function EmotionalCheckInModal({
  open,
  onClose,
  userId,
  onCheckInComplete,
}: EmotionalCheckInModalProps) {
  const [step, setStep] = useState<CheckInStep>('asking');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "How are you doing today?", timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery<{ profilePhoto: string | null }>({
    queryKey: ['/api/profile'],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      trackModal('opened', 'emotional_checkin');
      setStep('asking');
      setMessages([{ id: '1', role: 'assistant', content: "How are you doing today?", timestamp: new Date() }]);
      setInputText('');
      setDetectedEmotion(null);
      setUserResponse('');
    }
  }, [open]);

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role, 
      content,
      timestamp: new Date()
    }]);
  };

  const detectEmotion = async (text: string): Promise<{ emotion: EmotionCategory; confidence: number }> => {
    try {
      const response = await authenticatedFetch('/api/classify-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) throw new Error('Failed to detect emotion');
      return await response.json();
    } catch (error) {
      console.error('Emotion detection error:', error);
      return { emotion: 'neutral', confidence: 0.5 };
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText('');
    addMessage('user', userText);
    setUserResponse(userText);
    setStep('detecting');
    setLoading(true);

    try {
      const result = await detectEmotion(userText);
      setDetectedEmotion(result.emotion);
      
      const emoji = getEmotionEmoji(result.emotion as EmotionCategory);
      const confirmMessage = `I sense you're feeling ${result.emotion} ${emoji}. Is that right?`;
      
      addMessage('assistant', confirmMessage);
      setStep('confirming');
    } catch (error) {
      addMessage('assistant', "I couldn't quite understand. Could you tell me more about how you're feeling?");
      setStep('retry');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmotion = async (confirmed: boolean) => {
    if (!confirmed) {
      addMessage('user', "No, that's not quite right.");
      addMessage('assistant', "I understand. Can you describe your feelings in a different way?");
      setStep('retry');
      return;
    }

    addMessage('user', "Yes, that's right!");
    setLoading(true);

    try {
      const response = await authenticatedFetch('/api/emotional-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion: detectedEmotion,
          notes: userResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save check-in');
      }

      const data = await response.json();
      const xpAwarded = data.xpAwarded || 10;

      trackCheckin('emotional', { emotion: detectedEmotion || 'unknown' });

      const supportiveMessage = getRandomSupportiveMessage(detectedEmotion as EmotionCategory);
      addMessage('assistant', supportiveMessage);
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins/weekly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
      
      setStep('supportive');
      
      if (onCheckInComplete && detectedEmotion) {
        onCheckInComplete(detectedEmotion, xpAwarded);
      }
    } catch (error: any) {
      console.error('Check-in save error:', error);
      toast({
        title: "Check-in failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setStep('asking');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <SwipeableDialogContent 
        onSwipeClose={onClose}
        className="sm:max-w-md bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10" 
        data-testid="emotional-checkin-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Daily Check-In
            </h3>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-2" ref={scrollRef}>
          <div className="space-y-4 py-2">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-[#CDB6EF] to-[#9B8AC4]' 
                      : 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]'
                  }`}>
                    {message.role === 'user' ? (
                      profileData?.profilePhoto ? (
                        <img src={profileData.profilePhoto} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <img src={logomarkViolet} alt="Loretta" className="w-4 h-4 object-contain brightness-0 invert" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'inline-block bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tr-none shadow-md border border-gray-200 dark:border-gray-600'
                        : 'bg-[#E8F0FF] dark:bg-[#1a2744] text-gray-900 dark:text-white rounded-tl-none shadow-md border border-[#013DC4]/20 dark:border-[#013DC4]/30'
                    }`}>
                      <p className="text-sm font-medium">{message.content}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 px-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                  <img src={logomarkViolet} alt="Loretta" className="w-4 h-4 object-contain brightness-0 invert" />
                </div>
                <div className="bg-[#E8F0FF] dark:bg-[#1a2744] p-3 rounded-2xl rounded-tl-none border border-[#013DC4]/20 dark:border-[#013DC4]/30 shadow-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#013DC4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#0150FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#CDB6EF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {step === 'confirming' && detectedEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-center pt-2"
          >
            <Button
              onClick={() => handleConfirmEmotion(true)}
              className="rounded-2xl h-11 px-5 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold shadow-lg shadow-green-500/30"
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-2" />
              Yes, that's right
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConfirmEmotion(false)}
              disabled={loading}
              className="rounded-2xl h-11 px-5 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
            >
              <X className="w-4 h-4 mr-2" />
              No
            </Button>
          </motion.div>
        )}

        {(step === 'asking' || step === 'retry') && (
          <div className="flex gap-2 pt-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Tell me how you're feeling..."
              className="flex-1 bg-white/70 dark:bg-gray-800/70 border-white/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#013DC4]/30 h-11"
              disabled={loading}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || loading}
              size="icon"
              className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#013DC4] to-[#0150FF] shadow-lg shadow-[#013DC4]/30 hover:shadow-xl hover:shadow-[#013DC4]/40"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'supportive' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <Button
              onClick={onClose}
              className="w-full h-12 rounded-2xl font-bold bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] text-white shadow-lg shadow-[#013DC4]/30 hover:shadow-xl hover:shadow-[#013DC4]/40 transition-all"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Done (+10 XP)
            </Button>
          </motion.div>
        )}
      </SwipeableDialogContent>
    </Dialog>
  );
}
