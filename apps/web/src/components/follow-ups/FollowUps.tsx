'use client';

import { useState, useEffect } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Clock, Bell, BellOff, Plus, Check, X } from 'lucide-react';

interface FollowUp {
  id: string;
  type: string;
  remindAt: string;
  completedAt: string | null;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string; avatarUrl?: string };
}

interface Snooze {
  id: string;
  snoozedUntil: string;
  reason: string | null;
  snoozedAt: string;
  unsnoozedAt: string | null;
  snoozedBy: { id: string; name: string | null; email: string };
}

interface FollowUpsProps {
  ticketId: string;
}

export function FollowUps({ ticketId }: FollowUpsProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [snoozes, setSnoozes] = useState<Snooze[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSnoozeForm, setShowSnoozeForm] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({ type: 'FOLLOW_UP', remindAt: '', note: '' });
  const [newSnooze, setNewSnooze] = useState({ snoozedUntil: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [followUpsRes, snoozesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/follow-ups/ticket/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/snoozes/ticket/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (followUpsRes.ok) {
        setFollowUps(await followUpsRes.json());
      }
      if (snoozesRes.ok) {
        setSnoozes(await snoozesRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          type: newFollowUp.type,
          remindAt: newFollowUp.remindAt,
          note: newFollowUp.note || undefined,
        }),
      });
      setNewFollowUp({ type: 'FOLLOW_UP', remindAt: '', note: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create follow-up:', error);
    }
  };

  const completeFollowUp = async (followUpId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/follow-ups/${followUpId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to complete follow-up:', error);
    }
  };

  const createSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/snoozes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          snoozedUntil: newSnooze.snoozedUntil,
          reason: newSnooze.reason || undefined,
        }),
      });
      setNewSnooze({ snoozedUntil: '', reason: '' });
      setShowSnoozeForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create snooze:', error);
    }
  };

  const unsnooze = async (snoozeId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/snoozes/${snoozeId}/unsnooze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to unsnooze:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const activeSnooze = snoozes.find(s => !s.unsnoozedAt && new Date(s.snoozedUntil) > new Date());
  const pendingFollowUps = followUps.filter(f => !f.completedAt);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {activeSnooze && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BellOff className="h-4 w-4 text-orange-600" />
              Snoozed
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm">
              Until: {formatDateTime(activeSnooze.snoozedUntil)}
            </p>
            {activeSnooze.reason && (
              <p className="text-xs text-muted-foreground mt-1">
                Reason: {activeSnooze.reason}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => unsnooze(activeSnooze.id)}
            >
              Wake Up Now
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Follow-ups & Reminders
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSnoozeForm(!showSnoozeForm)}
              >
                <BellOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddForm && (
            <form onSubmit={createFollowUp} className="space-y-2 p-2 border rounded bg-muted/30">
              <select
                value={newFollowUp.type}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, type: e.target.value })}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="REMINDER">Reminder</option>
                <option value="CALL_BACK">Call Back</option>
                <option value="CHECK_IN">Check-in</option>
              </select>
              <Input
                type="datetime-local"
                value={newFollowUp.remindAt}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, remindAt: e.target.value })}
                required
              />
              <Input
                placeholder="Note (optional)"
                value={newFollowUp.note}
                onChange={(e) => setNewFollowUp({ ...newFollowUp, note: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Add</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {showSnoozeForm && (
            <form onSubmit={createSnooze} className="space-y-2 p-2 border rounded bg-muted/30">
              <Input
                type="datetime-local"
                value={newSnooze.snoozedUntil}
                onChange={(e) => setNewSnooze({ ...newSnooze, snoozedUntil: e.target.value })}
                required
              />
              <Input
                placeholder="Reason (optional)"
                value={newSnooze.reason}
                onChange={(e) => setNewSnooze({ ...newSnooze, reason: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Snooze</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSnoozeForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {pendingFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending follow-ups</p>
          ) : (
            <div className="space-y-2">
              {pendingFollowUps.map((followUp) => (
                <div key={followUp.id} className="flex items-start justify-between p-2 bg-muted/30 rounded">
                  <div>
                    <p className="text-sm font-medium">{followUp.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(followUp.remindAt)}
                    </p>
                    {followUp.note && (
                      <p className="text-xs text-muted-foreground mt-1">{followUp.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => completeFollowUp(followUp.id)}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {followUps.filter(f => f.completedAt).length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                Completed ({followUps.filter(f => f.completedAt).length})
              </summary>
              <div className="mt-2 space-y-1">
                {followUps.filter(f => f.completedAt).map((followUp) => (
                  <div key={followUp.id} className="text-muted-foreground line-through">
                    {followUp.type} - {formatDateTime(followUp.remindAt)}
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
