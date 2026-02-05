import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { SuggestedMission } from '@/components/chat/MissionCardView';
import type { MetricData } from '@/components/chat/MetricCard';
import { useWeatherSimulation } from '@/contexts/WeatherSimulationContext';
import { authenticatedFetch } from "@/lib/queryClient";
import { detectEmotionFromText } from '../../../shared/emotions';
import { useGeolocation } from './useGeolocation';
import { useAuth } from './use-auth';

interface WeatherContext {
  isGoodForOutdoor: boolean;
  weatherDescription: string;
  temperature: number;
  warnings: string[];
  usingDefaultLocation?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metricData?: MetricData;
  canLearnMore?: boolean;
  isDetailedResponse?: boolean;
}

export interface ActivityContext {
  type: 'steps' | 'heartRate' | 'sleep' | 'calories' | 'water' | 'activity';
  metricData?: MetricData;
}

interface UseChatLogicProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface UseChatLogicReturn {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  selectedImage: string | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  showMissionCard: boolean;
  suggestedMission: SuggestedMission | null;
  missionActivated: boolean;
  isActivatingMission: boolean;
  pendingEmotion: string | null;
  isCheckInConfirmationPending: boolean;
  activityContext: ActivityContext | null;
  handleSend: (text?: string, metricData?: MetricData) => Promise<void>;
  handleImagePick: () => void;
  handleActivateMission: () => void;
  handleViewMission: () => void;
  handleConfirmEmotion: () => void;
  handleDenyEmotion: () => void;
  setActivityContext: React.Dispatch<React.SetStateAction<ActivityContext | null>>;
  parseAIResponse: (response: string) => void;
  handleLearnMore: (messageId: string) => Promise<void>;
}

const suggestedMissions: SuggestedMission[] = [
  {
    id: '1',
    title: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day',
    xpReward: 30,
    icon: '💧',
    category: 'daily',
  },
  {
    id: '2',
    title: 'Complete 10 jumping jacks',
    description: 'Quick energy boost exercise',
    xpReward: 50,
    icon: '🏃',
    category: 'daily',
  },
  {
    id: '3',
    title: 'Take a 5-minute walk',
    description: 'Get some fresh air and movement',
    xpReward: 35,
    icon: '🚶',
    category: 'daily',
  },
  {
    id: '4',
    title: 'Practice deep breathing',
    description: '3 minutes of mindful breathing',
    xpReward: 25,
    icon: '🧘',
    category: 'daily',
  },
  {
    id: '5',
    title: 'Eat a healthy snack',
    description: 'Choose fruits or vegetables',
    xpReward: 20,
    icon: '🍎',
    category: 'daily',
  },
];

// Emotion keywords are now managed in shared/emotions.ts for consistency

const missionTriggerPatterns = [
  { pattern: /\[MISSION:(\d+)\]/i, type: 'explicit' },
  { pattern: /suggest(?:ing)?\s+(?:a\s+)?mission/i, type: 'suggestion' },
  { pattern: /recommend(?:ing)?\s+(?:the\s+)?(?:following\s+)?(?:activity|mission|challenge)/i, type: 'recommendation' },
  { pattern: /why\s+(?:don't|not)\s+(?:you\s+)?try/i, type: 'suggestion' },
  { pattern: /here's\s+(?:a\s+)?(?:quick\s+)?(?:activity|mission|challenge)/i, type: 'suggestion' },
];

const missionKeywordMappings: Record<string, string[]> = {
  '1': ['water', 'hydrat', 'drink', 'fluid', 'thirst'],
  '2': ['exercise', 'jumping', 'jacks', 'workout', 'cardio', 'active', 'movement'],
  '3': ['walk', 'walking', 'stroll', 'fresh air', 'outdoor', 'steps'],
  '4': ['breath', 'breathing', 'relax', 'calm', 'meditat', 'mindful', 'stress relief'],
  '5': ['eat', 'snack', 'food', 'fruit', 'vegetable', 'healthy eating', 'nutrition'],
};

export function useChatLogic({ messages, setMessages }: UseChatLogicProps): UseChatLogicReturn {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMissionCard, setShowMissionCard] = useState(false);
  const [suggestedMission, setSuggestedMission] = useState<SuggestedMission | null>(null);
  const [missionActivated, setMissionActivated] = useState(false);
  const [isActivatingMission, setIsActivatingMission] = useState(false);
  const [pendingEmotion, setPendingEmotion] = useState<string | null>(null);
  const [isCheckInConfirmationPending, setIsCheckInConfirmationPending] = useState(false);
  const [activityContext, setActivityContext] = useState<ActivityContext | null>(null);
  const { toast } = useToast();
  const { i18n, t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { simulateBadWeather } = useWeatherSimulation();
  const { user } = useAuth();
  const userId = user?.id;
  
  const { coordinates, locationEnabled, usingDefault } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000,
  });
  
  const activityContextRef = useRef<ActivityContext | null>(null);
  activityContextRef.current = activityContext;
  const lastUserMessageRef = useRef<string>('');
  const weatherContextRef = useRef<WeatherContext | null>(null);
  const usingDefaultRef = useRef<boolean>(true);
  usingDefaultRef.current = usingDefault;

  const { data: weatherData } = useQuery({
    queryKey: ['/api/weather/outdoor-assessment', coordinates.latitude, coordinates.longitude, locationEnabled],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `/api/weather/outdoor-assessment?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: locationEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (simulateBadWeather) {
      weatherContextRef.current = {
        isGoodForOutdoor: false,
        weatherDescription: 'Simulated bad weather (testing)',
        temperature: 0,
        warnings: ['Simulated bad weather for testing'],
        usingDefaultLocation: false,
      };
    } else if (weatherData) {
      weatherContextRef.current = {
        isGoodForOutdoor: weatherData.isGoodForOutdoor,
        weatherDescription: weatherData.weatherData?.weatherDescription || 'Unknown',
        temperature: weatherData.weatherData?.temperature,
        warnings: weatherData.warnings || [],
        usingDefaultLocation: usingDefaultRef.current,
      };
    } else {
      weatherContextRef.current = null;
    }
  }, [weatherData, simulateBadWeather]);

  const detectEmotion = useCallback((text: string): string | null => {
    // Use the shared emotion detection from shared/emotions.ts
    return detectEmotionFromText(text);
  }, []);

  const cleanAIResponse = useCallback((response: string): string => {
    return response
      .replace(/\[SUGGEST_MISSION(?::[^\]]+)?\]/gi, '')
      .replace(/\[MISSION:\d+\]/gi, '')
      .replace(/\[CHECK_IN\]/gi, '')
      .replace(/\[EMOTION_DETECTED:[^\]]+\]/gi, '')
      .replace(/\[ALTERNATIVE_MISSION:[^\]]+\]/gi, '')
      .trim();
  }, []);

  const fetchSuggestedMission = useCallback(async (context: string, specificMissionKey?: string) => {
    try {
      const response = await authenticatedFetch('/api/missions/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context, 
          language: i18n.language.startsWith('de') ? 'de' : 'en',
          weatherContext: weatherContextRef.current,
          specificMissionKey,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.mission) {
          const mission: SuggestedMission = {
            id: data.mission.id,
            title: data.mission.title,
            description: data.mission.description,
            xpReward: data.mission.xpReward || 0,
            icon: data.mission.icon || '🎯',
            category: 'daily',
            missionKey: data.mission.missionKey,
            userMissionId: data.mission.userMissionId,
            isAlternative: data.isAlternative || false,
            parentMissionKey: data.originalMission?.missionKey,
          };
          setSuggestedMission(mission);
          setShowMissionCard(true);
          setMissionActivated(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggested mission:', error);
    }
  }, [i18n.language]);

  const parseAIResponse = useCallback((response: string): void => {
    // Check for specific mission suggestion [SUGGEST_MISSION:missionKey]
    const specificMissionMatch = response.match(/\[SUGGEST_MISSION:([^\]]+)\]/i);
    if (specificMissionMatch) {
      const missionKey = specificMissionMatch[1].trim();
      fetchSuggestedMission(lastUserMessageRef.current, missionKey);
      return;
    }
    
    // Check for general mission suggestion [SUGGEST_MISSION]
    if (response.includes('[SUGGEST_MISSION]')) {
      fetchSuggestedMission(lastUserMessageRef.current);
      return;
    }

    for (const { pattern, type } of missionTriggerPatterns) {
      const match = response.match(pattern);
      if (match) {
        if (type === 'explicit' && match[1]) {
          const missionId = match[1];
          const mission = suggestedMissions.find(m => m.id === missionId);
          if (mission) {
            setSuggestedMission(mission);
            setShowMissionCard(true);
            setMissionActivated(false);
            return;
          }
        } else if (type === 'suggestion' || type === 'recommendation') {
          const mission = getMissionFromContent(response);
          if (mission) {
            setSuggestedMission(mission);
            setShowMissionCard(true);
            setMissionActivated(false);
            return;
          }
        }
      }
    }
    
    if (activityContextRef.current) {
      const contextMission = getMissionForActivityContext(activityContextRef.current.type);
      if (contextMission && response.toLowerCase().includes('improve')) {
        setSuggestedMission(contextMission);
        setShowMissionCard(true);
        setMissionActivated(false);
      }
    }
  }, [fetchSuggestedMission]);

  const getMissionFromContent = (response: string): SuggestedMission | null => {
    const lowerResponse = response.toLowerCase();
    let bestMatch: { mission: SuggestedMission; score: number } | null = null;

    for (const mission of suggestedMissions) {
      const keywords = missionKeywordMappings[mission.id] || [];
      let score = 0;
      
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword)) {
          score += keyword.length;
        }
      }
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { mission, score };
      }
    }

    return bestMatch?.mission || null;
  };

  const getMissionForActivityContext = (contextType: string): SuggestedMission | null => {
    const contextToMission: Record<string, string> = {
      'steps': '3',
      'activity': '2',
      'heartRate': '4',
      'sleep': '4',
      'calories': '5',
      'water': '1',
    };
    
    const missionId = contextToMission[contextType];
    return missionId ? suggestedMissions.find(m => m.id === missionId) || null : null;
  };

  const buildContextMessage = (metricData?: MetricData): string => {
    if (!metricData && !activityContextRef.current?.metricData) {
      return '';
    }
    
    const data = metricData || activityContextRef.current?.metricData;
    if (!data) return '';
    
    let contextStr = `\n[Context: User's ${data.label} - Current: ${data.value} ${data.unit}`;
    if (data.goal) {
      const progress = Math.round((data.value / data.goal) * 100);
      contextStr += `, Goal: ${data.goal} ${data.unit} (${progress}% achieved)`;
    }
    if (data.trend !== undefined) {
      contextStr += `, Trend: ${data.trend > 0 ? '+' : ''}${data.trend}%`;
    }
    contextStr += ']';
    
    return contextStr;
  };

  const handleSend = useCallback(async (text?: string, metricData?: MetricData) => {
    const messageText = text || inputText;
    if (!messageText.trim() && !selectedImage) return;

    lastUserMessageRef.current = messageText;
    const contextInfo = buildContextMessage(metricData);
    const contentForAPI = messageText + contextInfo;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      metricData: metricData,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);
    setShowMissionCard(false);
    setSuggestedMission(null);
    setIsCheckInConfirmationPending(false);
    setPendingEmotion(null);

    const detectedEmotion = detectEmotion(messageText);
    if (detectedEmotion) {
      setPendingEmotion(detectedEmotion);
      setIsCheckInConfirmationPending(true);
    }

    try {
      const messagesForAPI = updatedMessages.map(msg => {
        let content = msg.content;
        if (msg.metricData) {
          content += buildContextMessage(msg.metricData);
        }
        return {
          role: msg.role,
          content: content,
        };
      });

      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          context: activityContextRef.current ? {
            type: activityContextRef.current.type,
            metricData: activityContextRef.current.metricData,
          } : undefined,
          weatherContext: weatherContextRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      parseAIResponse(data.message);
      
      const cleanedMessage = cleanAIResponse(data.message);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedMessage,
        timestamp: new Date(),
        canLearnMore: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, selectedImage, messages, setMessages, detectEmotion, parseAIResponse, cleanAIResponse]);

  const handleImagePick = useCallback(() => {
    toast({
      title: 'Image upload',
      description: 'Use the file upload button to attach images',
    });
  }, [toast]);

  const handleActivateMission = useCallback(async () => {
    if (!suggestedMission || isActivatingMission) {
      return;
    }

    setIsActivatingMission(true);
    
    try {
      let response;
      
      if (suggestedMission.isAlternative && suggestedMission.parentMissionKey && suggestedMission.missionKey) {
        response = await authenticatedFetch('/api/missions/activate-alternative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentMissionKey: suggestedMission.parentMissionKey,
            alternativeMissionKey: suggestedMission.missionKey,
          }),
        });
      } else if (suggestedMission.userMissionId) {
        response = await authenticatedFetch(`/api/missions/${suggestedMission.userMissionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        });
      } else {
        setMissionActivated(true);
        toast({
          title: t('chat.missionActivated', 'Mission Activated!') + ' 🎯',
          description: `"${suggestedMission.title}" has been added to your quests.`,
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to activate mission');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });

      setMissionActivated(true);
      toast({
        title: t('chat.missionActivated', 'Mission Activated!') + ' 🎯',
        description: `"${suggestedMission.title}" has been added to your quests.`,
      });

      const systemMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: i18n.language.startsWith('de') 
          ? `Super Wahl! Ich habe die Mission "${suggestedMission.title}" für dich aktiviert. Du kannst deinen Fortschritt im Dashboard verfolgen. Viel Erfolg! 💪`
          : `Great choice! I've activated the "${suggestedMission.title}" mission for you. You can track your progress in the Dashboard. Good luck! 💪`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error: any) {
      console.error('Failed to activate mission:', error);
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('low mood')) {
        toast({
          title: t('chat.error', 'Error'),
          description: i18n.language.startsWith('de')
            ? 'Alternative Missionen sind nur verfügbar, wenn du heute mit schlechter Stimmung eingecheckt hast.'
            : 'Alternative missions are only available when you\'ve checked in with a low mood today.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('chat.error', 'Error'),
          description: t('chat.activationFailed', 'Failed to activate mission. Please try again.'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsActivatingMission(false);
    }
  }, [suggestedMission, isActivatingMission, toast, setMessages, t, i18n.language, queryClient]);

  const handleViewMission = useCallback(() => {
    if (suggestedMission?.missionKey) {
      if (suggestedMission.isAlternative) {
        setLocation(`/alternative-mission?id=${suggestedMission.missionKey}`);
      } else {
        setLocation(`/mission-details?id=${suggestedMission.missionKey}`);
      }
    } else {
      setLocation('/my-dashboard');
    }
  }, [suggestedMission, setLocation]);

  const handleConfirmEmotion = useCallback(() => {
    setIsCheckInConfirmationPending(false);
    
    toast({
      title: 'Check-in Confirmed!',
      description: `Thanks for sharing that you're feeling ${pendingEmotion}. Self-awareness is key to health!`,
    });

    const confirmMessage: ChatMessage = {
      id: (Date.now() + 3).toString(),
      role: 'assistant',
      content: `Thanks for confirming! I've recorded that you're feeling ${pendingEmotion} today. Tracking your emotions helps us better understand your health journey.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
    setPendingEmotion(null);
  }, [pendingEmotion, toast, setMessages]);

  const handleDenyEmotion = useCallback(() => {
    setIsCheckInConfirmationPending(false);
    
    const denyMessage: ChatMessage = {
      id: (Date.now() + 3).toString(),
      role: 'assistant',
      content: "No worries! Can you tell me more about how you're actually feeling? I want to make sure I understand you correctly.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, denyMessage]);
    setPendingEmotion(null);
  }, [setMessages]);

  const handleLearnMore = useCallback(async (messageId: string) => {
    setLoading(true);
    
    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      setLoading(false);
      return;
    }
    
    // Remove canLearnMore from the original message immediately
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, canLearnMore: false }
        : msg
    ));
    
    // Create the user "learn more" message
    const learnMoreUserMessage: ChatMessage = {
      id: `learn-more-${Date.now()}`,
      role: 'user',
      content: 'Can you expand on that? Please restate your answer with more details and examples.',
      timestamp: new Date(),
    };
    
    // Add the user message to the chat
    setMessages(prev => [...prev, learnMoreUserMessage]);
    
    // Get all messages up to and including the new user message for API call
    const messagesUpToTarget = messages.slice(0, messageIndex + 1);
    
    try {
      const messagesForAPI = [
        ...messagesUpToTarget.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: learnMoreUserMessage.content,
        }
      ];

      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          weatherContext: weatherContextRef.current,
          detailedResponse: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get detailed response');
      }

      const data = await response.json();
      const cleanedMessage = cleanAIResponse(data.message);

      // Add the detailed AI response as a new message
      const detailedResponse: ChatMessage = {
        id: `detailed-${Date.now()}`,
        role: 'assistant',
        content: cleanedMessage,
        timestamp: new Date(),
        isDetailedResponse: true,
        canLearnMore: false,
      };
      
      setMessages(prev => [...prev, detailedResponse]);
    } catch (error) {
      console.error('Learn more error:', error);
      toast({
        title: 'Error',
        description: "Couldn't get more details. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [messages, setMessages, cleanAIResponse, toast]);

  return {
    inputText,
    setInputText,
    selectedImage,
    setSelectedImage,
    loading,
    showMissionCard,
    suggestedMission,
    missionActivated,
    isActivatingMission,
    pendingEmotion,
    isCheckInConfirmationPending,
    activityContext,
    handleSend,
    handleImagePick,
    handleActivateMission,
    handleViewMission,
    handleConfirmEmotion,
    handleDenyEmotion,
    setActivityContext,
    parseAIResponse,
    handleLearnMore,
  };
}
