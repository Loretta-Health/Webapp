import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ChevronRight,
  FileText,
  Heart,
  Pill,
  Activity,
  Upload,
  X,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: FileText, text: "Explain my lab results" },
  { icon: Pill, text: "What are my medication side effects?" },
  { icon: Heart, text: "How can I improve my heart health?" },
  { icon: Activity, text: "What does my health score mean?" },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm the Health Literacy Navigator. I can help you understand your medical documents, explain health terms, and answer questions about your health journey. How can I help you today?",
    timestamp: new Date(),
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    const messageText = text || input;
    const hasFile = uploadedFile !== null;
    const fileName = uploadedFile?.name || '';
    
    if (!messageText.trim() && !hasFile) return;

    const fileInfo = hasFile ? `[Uploaded: ${fileName}]` : '';
    const displayContent = messageText.trim() 
      ? (hasFile ? `${fileInfo}\n${messageText}` : messageText)
      : fileInfo;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Health Literacy Navigator</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <Card className="flex-1 flex flex-col border-0 shadow-xl overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
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
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
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

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Ask about your medical documents:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((q, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 hover-elevate"
                    onClick={() => handleSend(q.text)}
                    data-testid={`button-suggestion-${index}`}
                  >
                    <q.icon className="w-4 h-4 mr-2 flex-shrink-0 text-primary" />
                    <span className="text-xs">{q.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-muted/20">
            {/* Uploaded File Preview */}
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
                disabled={isTyping}
                className="flex-shrink-0"
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health..."
                className="flex-1"
                disabled={isTyping}
                data-testid="input-chat-message"
              />
              <Button 
                type="submit" 
                disabled={(!input.trim() && !uploadedFile) || isTyping}
                className="bg-gradient-to-r from-primary to-chart-2"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Upload medical documents (PDF, images) or ask questions about your health
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
