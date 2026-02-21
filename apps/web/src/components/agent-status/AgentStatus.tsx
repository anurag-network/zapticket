'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Button } from '@zapticket/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@zapticket/ui/components/ui/select';
import { User, Circle, Clock } from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  statusMessage?: string;
  lastSeenAt?: string;
}

const statusColors: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-400',
};

export function AgentStatusIndicator({ agentId }: { agentId?: string }) {
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    fetchStatus();
  }, [agentId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent-availability/me', { credentials: 'include' });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch('/api/agent-availability/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStatus();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (!status) return null;

  return (
    <div className="flex items-center gap-2">
      <Circle className={`h-2 w-2 ${statusColors[status.status]}`} />
      <Select value={status.status} onValueChange={updateStatus}>
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ONLINE">Online</SelectItem>
          <SelectItem value="AWAY">Away</SelectItem>
          <SelectItem value="BUSY">Busy</SelectItem>
          <SelectItem value="OFFLINE">Offline</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AgentList() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agent-availability/agents', { credentials: 'include' });
      if (res.ok) {
        setAgents(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) return null;

  const onlineCount = agents.filter((a) => a.status === 'ONLINE').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Team Status</span>
        <Badge variant="secondary">{onlineCount} online</Badge>
      </div>
      <div className="space-y-1">
        {agents.slice(0, 5).map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {agent.avatarUrl ? (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name || ''}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Circle
                  className={`h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 ${
                    statusColors[agent.status]
                  } ring-2 ring-background`}
                />
              </div>
              <div>
                <p className="text-sm font-medium">{agent.name || agent.email}</p>
                {agent.statusMessage && (
                  <p className="text-xs text-muted-foreground">{agent.statusMessage}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatLastSeen(agent.lastSeenAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
