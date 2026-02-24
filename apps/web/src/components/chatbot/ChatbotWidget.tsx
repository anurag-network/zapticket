'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { ScrollArea } from '@zapticket/ui/components/ui/scroll-area';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, 
  Globe, HeadphonesIcon, FileText, UserPlus, ExternalLink 
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  language?: string;
}

interface SuggestedArticle {
  id: string;
  title: string;
  slug: string;
}

interface ChatbotConfig {
  enabled: boolean;
  multilingual: boolean;
  handoffEnabled: boolean;
  kbEnabled: boolean;
  leadCaptureEnabled: boolean;
  defaultLanguage: string;
  supportedLanguages: string;
  primaryColor: string;
  position: string;
  avatarUrl?: string;
}

interface ChatbotWidgetProps {
  organizationSlug: string;
  apiBaseUrl?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export function ChatbotWidget({
  organizationSlug,
  apiBaseUrl = '',
  position = 'bottom-right',
  primaryColor = '#3b82f6',
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [botName, setBotName] = useState('Zapdeck');
  const [ticketCreated, setTicketCreated] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [handoffRequested, setHandoffRequested] = useState(false);
  const [handoffAccepted, setHandoffAccepted] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [suggestedArticles, setSuggestedArticles] = useState<SuggestedArticle[]>([]);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  useEffect(() => {
    const savedSessionId = localStorage.getItem(`chatbot_session_${organizationSlug}`);
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadHistory(savedSessionId);
    }
  }, [organizationSlug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  const loadHistory = async (sid: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/public/chatbot/history/${sid}`);
      if (res.ok) {
        const history = await res.json();
        setMessages(
          history.map((m: any) => ({
            id: Math.random().toString(),
            content: m.content,
            isBot: m.isBot,
            timestamp: new Date(m.timestamp),
            language: m.language,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const initSession = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/public/chatbot/${organizationSlug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      setSessionId(data.sessionId);
      setBotName(data.botName || 'Zapdeck');
      localStorage.setItem(`chatbot_session_${organizationSlug}`, data.sessionId);

      if (data.config) {
        setConfig(data.config);
        setSelectedLanguage(data.config.defaultLanguage || 'en');
      }

      if (data.welcomeMessage && messages.length === 0) {
        const welcomeMsg: Message = {
          id: 'welcome',
          content: data.welcomeMessage,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }

      if (data.proactiveMessage && messages.length === 0) {
        setProactiveMessage(data.proactiveMessage);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      content: input.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestedArticles([]);

    try {
      const res = await fetch(`${apiBaseUrl}/api/public/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
      });

      const data = await res.json();

      const botMessage: Message = {
        id: Math.random().toString(),
        content: data.reply,
        isBot: true,
        timestamp: new Date(),
        language: data.language,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.suggestedArticles && data.suggestedArticles.length > 0) {
        setSuggestedArticles(data.suggestedArticles);
      }

      if (data.ticketCreated) {
        setTicketCreated(true);
      }

      if (data.handoffRequested) {
        setHandoffRequested(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          content: 'Sorry, something went wrong. Please try again.',
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const requestHandoff = async () => {
    if (!sessionId) return;
    
    const handoffMsg: Message = {
      id: Math.random().toString(),
      content: 'I\'d like to speak with a live agent please.',
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, handoffMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/public/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: 'I want to talk to a live agent',
        }),
      });

      const data = await res.json();
      
      const botMessage: Message = {
        id: Math.random().toString(),
        content: data.reply,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setHandoffRequested(true);
    } catch (error) {
      console.error('Failed to request handoff:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitLeadForm = async () => {
    if (!leadForm.email || !sessionId) return;

    try {
      await fetch(`${apiBaseUrl}/api/public/chatbot/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: sessionId,
          ...leadForm,
          source: 'widget',
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          content: 'Thank you! We\'ll be in touch soon.',
          isBot: true,
          timestamp: new Date(),
        },
      ]);
      setShowLeadForm(false);
      setLeadForm({ name: '', email: '', company: '', phone: '' });
    } catch (error) {
      console.error('Failed to submit lead:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setTicketCreated(false);
    setHandoffRequested(false);
    setHandoffAccepted(false);
    setSuggestedArticles([]);
    setShowLeadForm(false);
    localStorage.removeItem(`chatbot_session_${organizationSlug}`);
    initSession();
  };

  const changeLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowLanguageMenu(false);
  };

  const positionClass = position === 'bottom-left' ? 'left-4' : 'right-4';

  return (
    <>
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className={`fixed bottom-4 ${positionClass} z-50 h-14 w-14 rounded-full shadow-lg`}
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card
          className={`fixed bottom-4 ${positionClass} z-50 w-96 h-[600px] flex flex-col shadow-xl`}
        >
          <CardHeader
            className="flex flex-row items-center justify-between p-4 border-b"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">{botName}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {config?.multilingual && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="text-white hover:bg-white/20 p-1"
                    title="Change language"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  {showLanguageMenu && (
                    <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg py-1 z-50 min-w-[120px]">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`block w-full text-left px-3 py-1.5 text-sm ${
                            selectedLanguage === lang.code 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="text-white hover:bg-white/20"
              >
                New Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 mb-4 ${
                    msg.isBot ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {msg.isBot && (
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.isBot
                        ? 'bg-muted text-foreground'
                        : 'text-white'
                    }`}
                    style={!msg.isBot ? { backgroundColor: primaryColor } : {}}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {!msg.isBot && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {suggestedArticles.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Suggested Articles</span>
                  </div>
                  {suggestedArticles.map((article) => (
                    <button
                      key={article.id}
                      className="block w-full text-left text-sm text-blue-700 hover:underline py-1"
                    >
                      {article.title}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="px-4 py-2 border-t flex flex-wrap gap-2">
              {config?.handoffEnabled && !handoffRequested && !ticketCreated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestHandoff}
                  className="flex items-center gap-1"
                >
                  <HeadphonesIcon className="h-3 w-3" />
                  Talk to Agent
                </Button>
              )}
              
              {config?.leadCaptureEnabled && !showLeadForm && !ticketCreated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeadForm(true)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Get Updates
                </Button>
              )}

              {handoffRequested && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <HeadphonesIcon className="h-3 w-3" />
                  Agent requested
                </Badge>
              )}
            </div>

            {showLeadForm && (
              <div className="px-4 py-2 border-t bg-gray-50">
                <div className="text-sm font-medium mb-2">Leave your contact info</div>
                <div className="space-y-2">
                  <Input
                    placeholder="Your name"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="h-8"
                  />
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="h-8"
                  />
                  <Input
                    placeholder="Company"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={submitLeadForm}
                      style={{ backgroundColor: primaryColor }}
                      className="flex-1"
                    >
                      Submit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLeadForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {ticketCreated && (
              <div className="px-4 pb-2">
                <Badge variant="default" className="w-full justify-center py-2" style={{ backgroundColor: primaryColor }}>
                  Ticket Created Successfully
                </Badge>
              </div>
            )}

            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading || ticketCreated}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading || ticketCreated}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
