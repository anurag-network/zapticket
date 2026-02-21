'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface Metrics {
  tickets: {
    total: number;
    open: number;
    createdToday: number;
    createdThisWeek: number;
    createdThisMonth: number;
    slaBreaches: number;
    escalated: number;
  };
  users: { total: number };
  knowledgeBase: { articles: number };
}

interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTimeHours: number | null;
  avgFirstResponseTimeHours: number | null;
}

interface TicketData {
  date: string;
  created: number;
  resolved: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [ticketTrend, setTicketTrend] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/ticket-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/tickets-over-time?days=14`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([metricsData, statsData, trendData]) => {
        setMetrics(metricsData);
        setStats(statsData);
        setTicketTrend(trendData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    WAITING_ON_CUSTOMER: 'bg-orange-100 text-orange-800',
    ESCALATED: 'bg-red-100 text-red-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
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

  const escalatedCount = (stats?.byStatus?.ESCALATED || metrics?.tickets?.escalated || 0);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ZapTicket</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/kb">
              <Button variant="ghost">Knowledge Base</Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Escalated Alert */}
        {escalatedCount > 0 && (
          <Link href="/dashboard/escalated">
            <Card className="mb-6 border-red-500 bg-red-50 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="font-semibold text-red-800">
                      {escalatedCount} Escalated Ticket{escalatedCount !== 1 ? 's' : ''} Require Attention
                    </p>
                    <p className="text-sm text-red-600">
                      Click to view and resolve escalated tickets
                    </p>
                  </div>
                </div>
                <Button variant="destructive">View Escalated</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-3xl font-bold">{metrics?.tickets.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-3xl font-bold text-blue-600">{metrics?.tickets.open || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Escalated</p>
              <p className="text-3xl font-bold text-red-600">{escalatedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Created Today</p>
              <p className="text-3xl font-bold">{metrics?.tickets.createdToday || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">SLA Breaches</p>
              <p className="text-3xl font-bold text-orange-600">{metrics?.tickets.slaBreaches || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status] || 'bg-gray-100'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${status === 'ESCALATED' ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>By Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.byPriority && Object.entries(stats.byPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[priority] || 'bg-gray-100'}`}>
                        {priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Times */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-2xl font-bold">
                  {stats.avgResolutionTimeHours 
                    ? `${Math.round(stats.avgResolutionTimeHours)}h` 
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg. First Response Time</p>
                <p className="text-2xl font-bold">
                  {stats.avgFirstResponseTimeHours 
                    ? `${Math.round(stats.avgFirstResponseTimeHours)}h` 
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ticket Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tickets (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {ticketTrend.map((day, i) => {
                const maxVal = Math.max(...ticketTrend.map((d) => Math.max(d.created, d.resolved)), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: '120px' }}>
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(day.created / maxVal) * 100}%`, minHeight: day.created ? '4px' : '0' }}
                        title={`Created: ${day.created}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-muted-foreground">Created</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Link href="/dashboard/tickets/new">
            <Button>New Ticket</Button>
          </Link>
          {escalatedCount > 0 && (
            <Link href="/dashboard/escalated">
              <Button variant="destructive">🚨 Escalated ({escalatedCount})</Button>
            </Link>
          )}
          <Link href="/dashboard/kb">
            <Button variant="outline">Knowledge Base</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
