'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

const availableEvents = [
  { value: 'ticket.created', label: 'Ticket Created' },
  { value: 'ticket.updated', label: 'Ticket Updated' },
  { value: 'ticket.assigned', label: 'Ticket Assigned' },
  { value: 'ticket.resolved', label: 'Ticket Resolved' },
  { value: 'message.created', label: 'Message Created' },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWebhooks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url, events }),
      });

      if (!res.ok) throw new Error('Failed to create webhook');

      setUrl('');
      setEvents([]);
      setShowForm(false);
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWebhooks();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
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
          <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
            Back to Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Webhooks */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Webhooks</h2>
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Add Webhook'}
              </Button>
            </div>

            {showForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base">Create Webhook</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Webhook URL *</label>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-server.com/webhook"
                        required
                        type="url"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Events *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableEvents.map((event) => (
                          <label key={event.value} className="flex items-center gap-2 p-2 border rounded hover:bg-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={events.includes(event.value)}
                              onChange={() => toggleEvent(event.value)}
                            />
                            <span className="text-sm">{event.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={saving || !url || events.length === 0}>
                      {saving ? 'Creating...' : 'Create Webhook'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {webhooks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No webhooks configured. Add a webhook to receive real-time notifications.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm">{webhook.url}</p>
                          <div className="flex gap-1 mt-2">
                            {webhook.events.map((e) => (
                              <span key={e} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {e}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {webhook._count?.deliveries || 0} deliveries
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/settings/integrations/webhooks/${webhook.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(webhook.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Links to other integrations */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/settings/integrations/api-keys">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">🔑 API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage API keys for programmatic access
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/settings/integrations/channels">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">💬 Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure Slack and Discord channels
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
