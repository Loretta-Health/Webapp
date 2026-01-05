import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';
import { MissionCardView, CheckInConfirmationBanner, MetricCard } from '@/components/chat';
import type { MetricData } from '@/components/chat';
import { useChatLogic, type ChatMessage } from '@/hooks/useChatLogic';
import ReactMarkdown from 'react-markdown';
import { trackAIChat, trackPageView } from '@/lib/clarity';

export default function Chat() {
  const { t } = useTranslation('pages');
  
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col">
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/my-dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              {t('chat.back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">{t('chat.title')}</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <Card className="flex-1 flex flex-col border-0 shadow-xl overflow-hidden">
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-chart-2 to-chart-3' 
                            : 'bg-gradient-to-br from-primary to-chart-2'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <img src={mascotImage} alt="Navigator" className="w-8 h-8 object-contain" />
                          )}
                        </div>
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-primary to-chart-2 text-white rounded-tr-none'
                              : 'bg-muted/50 text-foreground rounded-tl-none'
                          }`}>
                            <div className="text-sm whitespace-pre-line prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-strong:font-bold prose-em:italic">
                              {message.role === 'assistant' 
                                ? <ReactMarkdown>{message.content}</ReactMarkdown>
                                : message.content
                              }
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                    <img src={mascotImage} alt="Navigator" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none">
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

          {messages.length === 1 && (
            <div className="p-4 border-t border-border">
              <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-left py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors gap-2">
                    <span className="text-xs text-muted-foreground leading-tight">{t('chat.suggestionsHint', 'Need inspiration? Tap here for conversation starters')}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${suggestionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQuestions.map((q, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto py-3 hover-elevate overflow-hidden"
                        onClick={() => handleSend(q.text)}
                        data-testid={`button-suggestion-${index}`}
                      >
                        <q.icon className="w-4 h-4 mr-2 flex-shrink-0 text-primary" />
                        <span className="text-xs truncate">{q.text}</span>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          <div className="p-4 border-t border-border bg-muted/20">
            <AnimatePresence>
              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-3 p-3 bg-primary/10 rounded-lg flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                    <File className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate" data-testid="uploaded-file-name">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleRemoveFile}
                    data-testid="button-remove-file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
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
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-shrink-0"
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1"
                disabled={loading}
                data-testid="input-chat-message"
              />
              <Button 
                type="submit" 
                disabled={(!inputText.trim() && !uploadedFile) || loading}
                className="bg-gradient-to-r from-primary to-chart-2"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('chat.uploadHint')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-3 text-center border-t border-border pt-3">
              {t('chat.disclaimer')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
