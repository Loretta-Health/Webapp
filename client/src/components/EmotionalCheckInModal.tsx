import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile, Send, Sparkles, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from "@/lib/queryClient";
import { 
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

    try {
      // Use AI-based emotion classification
      const response = await fetch(getApiUrl('/api/classify-emotion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: inputText }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.emotion && !data.unclear) {
          setDetectedEmotion(data.emotion);
          const emoji = getEmotionEmoji(data.emotion as EmotionCategory);
          const confirmMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `It sounds like you are feeling ${data.emotion} ${emoji}`,
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
      } else {
        throw new Error('Failed to classify emotion');
      }
    } catch (error) {
      console.error('Error classifying emotion:', error);
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
        const response = await fetch(getApiUrl('/api/emotional-checkins'), {
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
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10" 
        data-testid="emotional-checkin-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              Check-In
            </h3>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <p className="text-sm font-medium">{message.content}</p>
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
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl px-4 py-3 shadow-sm">
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
            className="flex gap-3 justify-center"
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
          <div className="flex gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
