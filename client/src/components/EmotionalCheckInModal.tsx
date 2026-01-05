import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Send, Sparkles, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from './MascotCharacter';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  detectEmotionFromText, 
  getRandomSupportiveMessage, 
  getEmotionEmoji,
  type EmotionCategory 
} from '../../../shared/emotions';
import { trackCheckin, trackModal } from '@/lib/clarity';

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
}

export default function EmotionalCheckInModal({
  open,
  onClose,
  userId,
  onCheckInComplete,
}: EmotionalCheckInModalProps) {
  const [step, setStep] = useState<CheckInStep>('asking');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "How are you doing today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      trackModal('opened', 'emotional_checkin');
      setStep('asking');
      setMessages([{ id: '1', role: 'assistant', content: "How are you doing today?" }]);
      setInputText('');
      setDetectedEmotion(null);
      setUserResponse('');
    }
  }, [open]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
    };

    setMessages(prev => [...prev, userMessage]);
    setUserResponse(inputText);
    setInputText('');
    setLoading(true);

    const emotion = detectEmotionFromText(inputText);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (emotion) {
      setDetectedEmotion(emotion);
      const emoji = getEmotionEmoji(emotion);
      const confirmMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `It sounds like you are feeling ${emotion} ${emoji}`,
      };
      setMessages(prev => [...prev, confirmMessage]);
      setStep('confirming');
    } else {
      const clarifyMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I want to understand you better. Can you tell me more about how you're feeling? Are you feeling happy, stressed, tired, or something else?",
      };
      setMessages(prev => [...prev, clarifyMessage]);
      setStep('retry');
    }

    setLoading(false);
  };

  const handleConfirmEmotion = async (confirmed: boolean) => {
    if (confirmed && detectedEmotion) {
      setLoading(true);
      
      const supportiveMsg = getRandomSupportiveMessage(detectedEmotion as EmotionCategory);
      const supportMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: supportiveMsg,
      };
      setMessages(prev => [...prev, supportMessage]);
      setStep('supportive');

      try {
        const response = await fetch('/api/emotional-checkins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            emotion: detectedEmotion,
            userMessage: userResponse,
            aiResponse: supportiveMsg,
          }),
        });

        if (response.ok) {
          // Invalidate weekly stats so they refresh
          queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins/weekly-stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/emotional-checkins'] });
          
          trackCheckin('emotional', { emotion: detectedEmotion });
          
          toast({
            title: 'Check-in Complete! +10 XP',
            description: `Thanks for sharing that you're feeling ${detectedEmotion}.`,
          });
          onCheckInComplete?.(detectedEmotion, 10);
        }
      } catch (error) {
        console.error('Error saving emotional check-in:', error);
      }

      setLoading(false);
    } else {
      const retryMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "No worries! Can you tell me more about how you're actually feeling?",
      };
      setMessages(prev => [...prev, retryMessage]);
      setDetectedEmotion(null);
      setStep('retry');
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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 via-background to-chart-2/5" data-testid="emotional-checkin-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Heart className="w-5 h-5 text-destructive fill-destructive" />
            Emotional Check-In
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center mb-2">
          <MascotCharacter 
            size="md" 
            pose={step === 'supportive' ? 'celebrate' : 'encourage'}
            speech={step === 'supportive' ? "Great job!" : undefined}
          />
        </div>

        <ScrollArea className="h-[250px] pr-4" ref={scrollRef}>
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            className="flex gap-2 justify-center"
          >
            <Button
              onClick={() => handleConfirmEmotion(true)}
              className="bg-chart-2 hover:bg-chart-2/90 text-white font-bold"
              disabled={loading}
            >
              <Check className="w-4 h-4 mr-1" />
              Yes, that's right
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConfirmEmotion(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              No
            </Button>
          </motion.div>
        )}

        {(step === 'asking' || step === 'retry') && (
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Tell me how you're feeling..."
              className="flex-1"
              disabled={loading}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || loading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'supportive' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={onClose}
              className="w-full font-bold bg-gradient-to-r from-primary to-chart-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Done (+10 XP)
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
