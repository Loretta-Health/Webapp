import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Send, Sparkles, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from './MascotCharacter';
import { useToast } from '@/hooks/use-toast';

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

const emotionKeywords: Record<string, string[]> = {
  happy: ['happy', 'great', 'wonderful', 'amazing', 'joyful', 'excited', 'good', 'fantastic', 'awesome', 'excellent', 'thrilled', 'delighted', 'cheerful', 'pleased', 'content'],
  sad: ['sad', 'down', 'depressed', 'unhappy', 'blue', 'low', 'miserable', 'gloomy', 'heartbroken', 'disappointed'],
  anxious: ['anxious', 'worried', 'nervous', 'panicked', 'uneasy', 'tense', 'apprehensive', 'fearful'],
  stressed: ['stressed', 'pressure', 'overwhelmed', 'burnt out', 'exhausted', 'frazzled', 'swamped'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'at ease', 'chill', 'mellow'],
  tired: ['tired', 'exhausted', 'fatigued', 'sleepy', 'drained', 'worn out', 'weary'],
  energetic: ['energetic', 'energized', 'pumped', 'active', 'motivated', 'alive', 'vibrant', 'dynamic'],
  frustrated: ['frustrated', 'annoyed', 'irritated', 'angry', 'upset', 'mad', 'furious', 'aggravated'],
  grateful: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate'],
  hopeful: ['hopeful', 'optimistic', 'positive', 'confident', 'encouraged', 'upbeat'],
  lonely: ['lonely', 'alone', 'isolated', 'disconnected'],
  confused: ['confused', 'lost', 'uncertain', 'unsure', 'puzzled'],
  neutral: ['okay', 'fine', 'alright', 'so-so', 'meh', 'normal', 'average'],
};

const emotionEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  stressed: '😫',
  calm: '😌',
  tired: '😴',
  energetic: '⚡',
  frustrated: '😤',
  grateful: '🙏',
  hopeful: '🌟',
  lonely: '🥺',
  confused: '🤔',
  neutral: '😐',
};

const supportiveMessages: Record<string, string[]> = {
  happy: [
    "That's wonderful to hear! Keep embracing that positive energy. Remember, joy is contagious - spread it around!",
    "I'm so glad you're feeling good! Happiness boosts your immune system and overall health.",
  ],
  sad: [
    "I'm sorry you're feeling down. Remember, it's okay to feel this way. Take it one moment at a time, and be gentle with yourself.",
    "Sadness is part of being human. Consider reaching out to someone you trust, or try a brief walk outside.",
  ],
  anxious: [
    "Anxiety can be tough, but you're not alone. Try taking some slow, deep breaths. You've got through difficult moments before.",
    "When anxiety hits, grounding exercises can help. Focus on 5 things you can see, 4 you can touch, 3 you can hear.",
  ],
  stressed: [
    "Stress can feel overwhelming, but remember to take breaks. Even 5 minutes of quiet can help reset your mind.",
    "You're dealing with a lot right now. Consider breaking tasks into smaller steps, and celebrate small wins.",
  ],
  calm: [
    "It's great that you're feeling at peace. This calm state is so valuable for your health and wellbeing.",
    "Enjoy this peaceful moment. Calm times help your body recover and recharge.",
  ],
  tired: [
    "Rest is so important for your health. Listen to your body - if you can, try to get some extra sleep tonight.",
    "Feeling tired is your body's way of asking for rest. Be kind to yourself and prioritize recovery.",
  ],
  energetic: [
    "That energy is fantastic! Channel it into something you enjoy - maybe a walk, a workout, or a creative project!",
    "Ride that wave of energy! Active moments like these are great for both your body and mind.",
  ],
  frustrated: [
    "Frustration is valid. Taking a step back can help. Try to identify what's bothering you most.",
    "It's okay to feel frustrated. Consider writing down what's on your mind - it can help process these feelings.",
  ],
  grateful: [
    "Gratitude is powerful! It's amazing how acknowledging the good things can lift your whole day.",
    "That thankful feeling is wonderful for your mental health. Keep noticing those positive moments!",
  ],
  hopeful: [
    "Hope is a beautiful thing. That optimistic outlook can really help carry you through challenges.",
    "Your positive outlook is inspiring! Keep that hopeful energy going.",
  ],
  lonely: [
    "Loneliness can be hard. Remember, reaching out - even a small message to someone - can help bridge that gap.",
    "You matter, and you're not as alone as you might feel. Consider connecting with someone today, even briefly.",
  ],
  confused: [
    "It's okay to not have all the answers. Sometimes clarity comes with time and rest.",
    "Feeling uncertain is normal. Try writing down your thoughts - it can help sort things out.",
  ],
  neutral: [
    "Sometimes 'okay' is perfectly fine. Not every day needs to be extraordinary.",
    "Feeling neutral is valid. Take this steady moment to check in with what you need today.",
  ],
};

function detectEmotion(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        return emotion;
      }
    }
  }
  return null;
}

function getRandomSupportiveMessage(emotion: string): string {
  const messages = supportiveMessages[emotion] || supportiveMessages.neutral;
  return messages[Math.floor(Math.random() * messages.length)];
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
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

    const emotion = detectEmotion(inputText);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (emotion) {
      setDetectedEmotion(emotion);
      const emoji = emotionEmojis[emotion] || '';
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
      
      const supportiveMsg = getRandomSupportiveMessage(detectedEmotion);
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
          body: JSON.stringify({
            userId,
            emotion: detectedEmotion,
            userMessage: userResponse,
            aiResponse: supportiveMsg,
            xpAwarded: 10,
          }),
        });

        if (response.ok) {
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
            pose={step === 'supportive' ? 'celebrate' : 'wave'}
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
