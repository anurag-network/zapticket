'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '@zapticket/ui';
import { Users, Circle, Clock, Activity } from 'lucide-react';

interface Agent {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string;
  status: string;
  statusMessage?: string;
  lastActive?: string;
}

const statusColors: Record<string, string> = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-400',
};

const statusLabels: Record<string, string> = {
  ONLINE: 'Online',
  AWAY: 'Away',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
};

export default function AgentAvailabilityPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<string>('OFFLINE');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/agent-availability/agents`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAgents(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/agent-availability/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setMyStatus(status);
      fetchAgents();
    } catch (err) { console.error(err); }
  };

  const onlineCount = agents.filter(a => a.status === 'ONLINE').length;
  const busyCount = agents.filter(a => a.status === 'BUSY').length;
  const awayCount = agents.filter(a => a.status === 'AWAY').length;

  if (loading) return <div className="flex items-center justify-center h-screen"><Activity className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8" />Agent Availability</h1><p className="text-muted-foreground">Manage agent status and schedules</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"><Circle className="h-5 w-5 text-green-600 fill-current" /></div><div><p className="text-sm text-muted-foreground">Online</p><p className="text-2xl font-bold">{onlineCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"><Circle className="h-5 w-5 text-red-600 fill-current" /></div><div><p className="text-sm text-muted-foreground">Busy</p><p className="text-2xl font-bold">{busyCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center"><Circle className="h-5 w-5 text-yellow-600 fill-current" /></div><div><p className="text-sm text-muted-foreground">Away</p><p className="text-2xl font-bold">{awayCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center"><Circle className="h-5 w-5 text-gray-500 fill-current" /></div><div><p className="text-sm text-muted-foreground">Offline</p><p className="text-2xl font-bold">{agents.length - onlineCount - busyCount - awayCount}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Set Your Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['ONLINE', 'AWAY', 'BUSY', 'OFFLINE'].map(status => (
              <Button key={status} variant={myStatus === status ? 'default' : 'outline'} onClick={() => updateStatus(status)} className="gap-2">
                <Circle className={`h-3 w-3 fill-current ${statusColors[status].replace('bg-', 'text-')}`} />
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Team Status</CardTitle><CardDescription>Current availability of all agents</CardDescription></CardHeader>
        <CardContent>
          {agents.length === 0 ? <p className="text-center py-8 text-muted-foreground">No agents found</p> : (
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${statusColors[agent.status] || statusColors.OFFLINE}`} />
                    <div><p className="font-medium">{agent.name || agent.email}</p>{agent.statusMessage && <p className="text-xs text-muted-foreground">{agent.statusMessage}</p>}</div>
                  </div>
                  <Badge variant="secondary">{statusLabels[agent.status] || 'Offline'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
