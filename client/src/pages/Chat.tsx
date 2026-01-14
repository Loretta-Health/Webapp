import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GlassCard } from '@/components/ui/glass-card';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { 
  Send, 
  User, 
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  Heart,
  Target,
  Activity,
  Upload,
  X,
  File
} from 'lucide-react';
import logomarkViolet from '@assets/Logomark_violet@2x_1766161339181.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MissionCardView, CheckInConfirmationBanner, MetricCard } from '@/components/chat';
import type { MetricData } from '@/components/chat';
import { useChatLogic, type ChatMessage } from '@/hooks/useChatLogic';
import ReactMarkdown from 'react-markdown';
import { trackAIChat, trackPageView } from '@/lib/clarity';

export default function Chat() {
  const { t } = useTranslation('pages');
  useSwipeBack({ backPath: '/my-dashboard' });
  
  const { data: profileData } = useQuery<{ profilePhoto: string | null }>({
    queryKey: ['/api/profile'],
  });
  
  useEffect(() => {
    trackAIChat('opened');
    trackPageView('ai_chat');
  }, []);
  
  const suggestedQuestions = [
    { icon: FileText, text: t('chat.suggestions.labResults') },
    { icon: Target, text: t('chat.suggestions.suggestMission') },
    { icon: Heart, text: t('chat.suggestions.heartHealth') },
    { icon: Activity, text: t('chat.suggestions.riskScore') },
  ];

  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'assistant',
      content: t('chat.welcome'),
      timestamp: new Date(),
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearch();

  const {
    inputText,
    setInputText,
    loading,
    showMissionCard,
    suggestedMission,
    missionActivated,
    pendingEmotion,
    isCheckInConfirmationPending,
    activityContext,
    handleSend: chatHandleSend,
    handleActivateMission,
    handleViewMission,
    handleConfirmEmotion,
    handleDenyEmotion,
    setActivityContext,
  } = useChatLogic({ messages, setMessages });

  useEffect(() => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      const contextType = params.get('context');
      const metricDataStr = params.get('metricData');

      if (contextType && metricDataStr) {
        try {
          const metricData = JSON.parse(decodeURIComponent(metricDataStr)) as MetricData;
          setActivityContext({
            type: contextType as any,
            metricData,
          });

          const contextMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: `I'd like to discuss my ${metricData.label} data.`,
            timestamp: new Date(),
            metricData,
          };
          setMessages(prev => [...prev, contextMessage]);
        } catch (e) {
          console.error('Failed to parse metric data:', e);
        }
      }
    }
  }, [searchParams, setActivityContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showMissionCard, isCheckInConfirmationPending]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText;
    const hasFile = uploadedFile !== null;
    const fileName = uploadedFile?.name || '';
    
    if (!messageText.trim() && !hasFile) return;

    trackAIChat('message_sent', { hasFile });

    const fileInfo = hasFile ? `[Uploaded: ${fileName}]` : '';
    const displayContent = messageText.trim() 
      ? (hasFile ? `${fileInfo}\n${messageText}` : messageText)
      : fileInfo;

    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await chatHandleSend(displayContent);
  };

  const visibleMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
      <header className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#4B7BE5] text-white px-3 sm:px-4 py-4 sm:py-5 flex items-center justify-between relative overflow-hidden sticky top-0 z-40 safe-area-top">
        
        <div className="flex items-center gap-3 relative z-10">
          <BackButton 
            href="/my-dashboard" 
            data-testid="button-back-dashboard" 
          />
          <h1 className="text-base sm:text-lg font-black truncate">{t('chat.title')}</h1>
        </div>
        
      </header>
      <div className="flex-1 max-w-4xl mx-auto w-full p-3 sm:p-4 flex flex-col">
        <GlassCard className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#E8EEFF]/80 to-[#F0F4FF]/80 dark:from-gray-900/80 dark:to-gray-800/80">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {visibleMessages.map((message, idx) => (
                  <div key={message.id}>
                    {message.metricData ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4"
                      >
                        <MetricCard metric={message.metricData} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        data-testid={`chat-message-${message.role}-${message.id}`}
                      >
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-[#CDB6EF] to-[#9B8AC4]' 
                            : 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]'
                        }`}>
                          {message.role === 'user' ? (
                            profileData?.profilePhoto ? (
                              <img src={profileData.profilePhoto} alt="You" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            )
                          ) : (
                            <img src={logomarkViolet} alt="Loretta" className="w-4 h-4 sm:w-5 sm:h-5 object-contain brightness-0 invert" />
                          )}
                        </div>
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right ml-auto' : ''}`}>
                          <div className={`rounded-2xl ${
                            message.role === 'user'
                              ? 'inline-block px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tr-none shadow-md border border-gray-200 dark:border-gray-600'
                              : 'p-3 sm:p-4 bg-[#E8F0FF] dark:bg-[#1a2744] text-gray-900 dark:text-white rounded-tl-none shadow-md border border-[#013DC4]/20 dark:border-[#013DC4]/30'
                          }`}>
                            {message.role === 'assistant' ? (
                              <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-bold prose-em:italic">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <span className="text-sm">{message.content}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {message.role === 'assistant' && idx === visibleMessages.length - 1 && (
                      <>
                        {showMissionCard && suggestedMission && (
                          <MissionCardView
                            suggestedMission={suggestedMission}
                            showMissionCard={showMissionCard}
                            missionActivated={missionActivated}
                            onActivate={handleActivateMission}
                            onView={handleViewMission}
                          />
                        )}

                        {isCheckInConfirmationPending && pendingEmotion && (
                          <CheckInConfirmationBanner
                            emotion={pendingEmotion}
                            onConfirm={handleConfirmEmotion}
                            onDeny={handleDenyEmotion}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                    <img src={logomarkViolet} alt="Loretta" className="w-4 h-4 sm:w-5 sm:h-5 object-contain brightness-0 invert" />
                  </div>
                  <div className="bg-[#E8F0FF] dark:bg-[#1a2744] p-3 sm:p-4 rounded-2xl rounded-tl-none border border-[#013DC4]/20 dark:border-[#013DC4]/30 shadow-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#013DC4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#0150FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#CDB6EF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {messages.length === 1 && (
            <div className="p-3 sm:p-4 border-t border-white/30 dark:border-white/10">
              <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-left py-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl px-3 -mx-1 transition-colors gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300 leading-tight font-medium">{t('chat.suggestionsHint', 'Need inspiration? Tap here for conversation starters')}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform flex-shrink-0 ${suggestionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQuestions.map((q, index) => (
                      <button
                        key={index}
                        className="flex items-center justify-start text-left h-auto py-3 px-4 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-white/50 dark:border-white/10 rounded-xl transition-all shadow-sm hover:shadow-md overflow-hidden"
                        onClick={() => handleSend(q.text)}
                        data-testid={`button-suggestion-${index}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center mr-3 flex-shrink-0">
                          <q.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{q.text}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          <div className="p-3 sm:p-4 border-t border-white/30 dark:border-white/10 bg-white/30 dark:bg-gray-900/30">
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-3 p-3 bg-[#013DC4]/10 rounded-xl flex items-center gap-3 border border-[#013DC4]/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
                    <File className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate" data-testid="uploaded-file-name">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                    onClick={handleRemoveFile}
                    data-testid="button-remove-file"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="hidden"
                data-testid="input-file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-white/50 dark:border-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 h-10 sm:h-11 px-4 bg-white/80 dark:bg-gray-800/80 border border-white/50 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#013DC4]/50 disabled:opacity-50"
                disabled={loading}
                data-testid="input-chat-message"
              />
              <button 
                type="submit" 
                disabled={(!inputText.trim() && !uploadedFile) || loading}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r from-[#013DC4] to-[#0150FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#013DC4]/30 hover:shadow-xl transition-all disabled:opacity-50"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center font-medium">
              {t('chat.uploadHint')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center border-t border-white/30 dark:border-white/10 pt-3">
              {t('chat.disclaimer')}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
