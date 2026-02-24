'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  Phone,
  Send,
  MoreVertical,
  RefreshCw,
  User,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface ChatSession {
  id: string;
  status: string;
  visitorName: string | null;
  visitorEmail: string | null;
  pageUrl: string | null;
  startedAt: string;
  waitTime: number | null;
  agent?: { id: string; name: string | null; email: string; avatarUrl?: string } | null;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  content: string;
  senderType: string;
  senderName: string | null;
  createdAt: string;
}

export default function LiveChatPage() {
  const router = useRouter();
  const [queuedSessions, setQueuedSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
      const interval = setInterval(() => fetchMessages(selectedSession.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [queuedRes, activeRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/queued`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (queuedRes.ok) setQueuedSessions(await queuedRes.json());
      if (activeRes.ok) setActiveSessions(await activeRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const acceptSession = async (sessionId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/${sessionId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const session = await res.json();
        setSelectedSession(session);
        setMessages(session.messages || []);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to accept session:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSession) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/${selectedSession.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageInput }),
      });

      setMessageInput('');
      fetchMessages(selectedSession.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const endChat = async () => {
    if (!selectedSession) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/${selectedSession.id}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedSession(null);
      setMessages([]);
      fetchData();
    } catch (error) {
      console.error('Failed to end chat:', error);
    }
  };

  const convertToTicket = async () => {
    if (!selectedSession) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/live-chat/${selectedSession.id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const ticket = await res.json();
        router.push(`/dashboard/tickets/${ticket.id}`);
      }
    } catch (error) {
      console.error('Failed to convert to ticket:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatWaitTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Live Chat</h2>
            <p className="text-muted-foreground">Real-time customer conversations</p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Queue</p>
                    <p className="text-2xl font-bold">{stats.queued}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold">{stats.avgRating?.toFixed(1) || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Waiting Queue ({queuedSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queuedSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No visitors waiting
                  </p>
                ) : (
                  <div className="space-y-2">
                    {queuedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => acceptSession(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {session.visitorName || 'Visitor'}
                              </p>
                              {session.visitorEmail && (
                                <p className="text-xs text-muted-foreground">{session.visitorEmail}</p>
                              )}
                            </div>
                          </div>
                          <Button size="sm">Accept</Button>
                        </div>
                        {session.messages && session.messages[0] && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {session.messages[0].content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Active Chats ({activeSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active chats
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedSession?.id === session.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          setSelectedSession(session);
                          fetchMessages(session.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.visitorName || 'Visitor'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.agent?.name || 'Unassigned'}
                            </p>
                          </div>
                          <div className={`h-2 w-2 rounded-full ${session.status === 'WAITING' ? 'bg-orange-500' : 'bg-green-500'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {selectedSession ? (
                <>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedSession.visitorName || 'Visitor'}
                          </p>
                          {selectedSession.visitorEmail && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedSession.visitorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedSession.pageUrl && (
                          <a
                            href={selectedSession.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View page
                          </a>
                        )}
                        <Button variant="outline" size="sm" onClick={convertToTicket}>
                          Convert to Ticket
                        </Button>
                        <Button variant="destructive" size="sm" onClick={endChat}>
                          End Chat
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === 'visitor' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            msg.senderType === 'visitor'
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderType === 'visitor' ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </CardContent>
                  <div className="p-4 border-t">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a chat to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
