'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface EscalatedTicket {
  id: string;
  subject: string;
  priority: string;
  escalatedAt: string;
  escalatedReason: string;
  assignee: { id: string; name: string | null; email: string } | null;
  escalationLogs: { reason: string; autoEscalated: boolean; createdAt: string }[];
}

export default function EscalatedTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<EscalatedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/escalation/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEscalation = async (ticketId: string) => {
    if (!confirm('Mark this escalation as resolved?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/escalation/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-700',
    NORMAL: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
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
      <header className="border-b bg-red-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <h1 className="text-xl font-bold text-red-800">Escalated Tickets</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">✅</span>
              <h2 className="text-xl font-semibold mb-2">No Escalated Tickets</h2>
              <p className="text-muted-foreground">
                All tickets are within SLA. Great job!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>{tickets.length}</strong> ticket{tickets.length !== 1 ? 's' : ''} require immediate attention
              </p>
            </div>

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border-red-200">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-500">⚠️</span>
                          <Link 
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="font-semibold hover:underline"
                          >
                            {ticket.subject}
                          </Link>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </div>

                        <div className="bg-red-50 p-3 rounded mb-3">
                          <p className="text-sm font-medium text-red-800">
                            Escalation Reason:
                          </p>
                          <p className="text-sm text-red-700">
                            {ticket.escalationLogs[0]?.reason || ticket.escalatedReason}
                          </p>
                          {ticket.escalationLogs[0]?.autoEscalated && (
                            <span className="text-xs text-red-600 mt-1 inline-block">
                              🤖 Auto-escalated due to SLA breach
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Escalated: {new Date(ticket.escalatedAt!).toLocaleString()}
                          </span>
                          {ticket.assignee && (
                            <span>Assignee: {ticket.assignee.name || ticket.assignee.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <Button variant="outline" size="sm">
                            View Ticket
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleResolveEscalation(ticket.id)}
                        >
                          Resolve Escalation
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
