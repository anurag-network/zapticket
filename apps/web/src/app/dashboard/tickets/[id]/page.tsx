'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Avatar, AvatarFallback } from '@zapticket/ui';
import { FollowUps } from '@/components/follow-ups/FollowUps';

interface Message {
  id: string;
  content: string;
  type: 'NOTE' | 'REPLY';
  createdAt: string;
  author: { id: string; name: string | null; avatarUrl?: string };
  attachments?: { id: string; filename: string; url: string }[];
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  assignee?: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
  messages: Message[];
  tags: { tag: { id: string; name: string } }[];
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WAITING_ON_CUSTOMER: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch ticket');
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTicket();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSendingReply(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent, type: 'REPLY' }),
      });

      if (!res.ok) throw new Error('Failed to send reply');
      setReplyContent('');
      fetchTicket();
    } catch (err) {
      setError('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
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

  if (!ticket) return null;

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

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                <div className="flex gap-2 mt-4">
                  {ticket.tags.map((t) => (
                    <span key={t.tag.id} className="px-2 py-1 text-xs bg-muted rounded">
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages */}
            <div className="space-y-4">
              <h3 className="font-semibold">Conversation</h3>
              {ticket.messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages yet. Be the first to reply!</p>
              ) : (
                ticket.messages.map((msg) => (
                  <Card key={msg.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{msg.author.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.author.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                            {msg.type === 'NOTE' && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Internal Note</span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  📎 {att.filename}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Reply Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendReply} className="space-y-4">
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={sendingReply || !replyContent.trim()}>
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <div className={`inline-block px-2 py-1 text-xs rounded mt-1 ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Created By</label>
                  <p className="text-sm mt-1">{ticket.creator.name || ticket.creator.email}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Assignee</label>
                  <p className="text-sm mt-1">{ticket.assignee?.name || 'Unassigned'}</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Created</label>
                  <p className="text-sm mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <FollowUps ticketId={ticketId} />
          </div>
        </div>
      </main>
    </div>
  );
}
