'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { ScrollArea } from '@zapticket/ui/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      if (data.welcomeMessage && messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            content: data.welcomeMessage,
            isBot: true,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!sessionId) {
      await initSession();
    }
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
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.ticketCreated) {
        setTicketCreated(true);
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
    localStorage.removeItem(`chatbot_session_${organizationSlug}`);
    initSession();
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
          className={`fixed bottom-4 ${positionClass} z-50 w-96 h-[500px] flex flex-col shadow-xl`}
        >
          <CardHeader
            className="flex flex-row items-center justify-between p-4 border-b"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">{botName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
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

            {ticketCreated && (
              <div className="px-4 pb-2">
                <Badge variant="default" className="w-full justify-center py-2">
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
