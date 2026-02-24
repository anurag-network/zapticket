'use client';

import { useState, useEffect } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Play, Square, Clock, Trash2, Edit2, Check, X } from 'lucide-react';

interface TimeEntry {
  id: string;
  description: string | null;
  billable: boolean;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  user: { id: string; name: string | null; email: string; avatarUrl?: string };
}

interface TimeTrackerProps {
  ticketId: string;
}

export function TimeTracker({ ticketId }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchActiveTimer();
  }, [ticketId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.startTime).getTime();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const fetchEntries = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/entries?ticketId=${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setEntries(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimer = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActiveTimer(data);
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
    }
  };

  const startTimer = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketId, description }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveTimer(data);
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/stop/${activeTimer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description }),
      });

      setActiveTimer(null);
      setElapsedTime(0);
      fetchEntries();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/entries/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const updateEntry = async (entryId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: editDescription }),
      });
      setEditingId(null);
      fetchEntries();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTimer ? (
          <div className="p-3 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Timer Running</span>
              <span className="text-lg font-mono font-bold text-primary">
                {formatDuration(elapsedTime)}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description..."
                className="flex-1"
              />
              <Button variant="destructive" size="sm" onClick={stopTimer}>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1"
            />
            <Button size="sm" onClick={startTimer}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          </div>
        )}

        {entries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Time Entries</span>
              <span className="text-sm font-medium">
                Total: {formatDuration(totalDuration)}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="p-2 bg-muted/30 rounded text-sm">
                  {editingId === entry.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-1 h-7"
                      />
                      <Button size="sm" variant="ghost" onClick={() => updateEntry(entry.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-muted-foreground">
                          {entry.user.name || entry.user.email}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditingId(entry.id);
                              setEditDescription(entry.description || '');
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {entry.description && (
                        <p className="text-sm mt-1">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatDateTime(entry.startTime)}</span>
                        <span>•</span>
                        <span className="font-medium">{formatDuration(entry.duration || 0)}</span>
                        {entry.billable && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Billable</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
