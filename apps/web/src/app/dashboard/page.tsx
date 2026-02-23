'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';
import { MentionCenter } from '@/components/mentions/MentionCenter';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import {
  Ticket,
  AlertTriangle,
  Clock,
  Users,
  Book,
  TrendingUp,
  Plus,
  ArrowRight,
  MessageSquare,
  Zap,
  Settings,
  BarChart3,
  Layers,
} from 'lucide-react';

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

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  assignee?: { name: string | null } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [ticketTrend, setTicketTrend] = useState<TicketData[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([metricsData, statsData, trendData, ticketsData]) => {
        setMetrics(metricsData);
        setStats(statsData);
        setTicketTrend(trendData || []);
        setRecentTickets(ticketsData.tickets || ticketsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    WAITING_ON_CUSTOMER: 'bg-orange-100 text-orange-800 border-orange-200',
    ESCALATED: 'bg-red-100 text-red-800 border-red-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-50 text-gray-600 border-gray-200',
    NORMAL: 'bg-blue-50 text-blue-600 border-blue-200',
    HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
    URGENT: 'bg-red-50 text-red-600 border-red-200',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const escalatedCount = (stats?.byStatus?.ESCALATED || metrics?.tickets?.escalated || 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ZapTicket</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/tickets">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Tickets
              </Button>
            </Link>
            <Link href="/dashboard/kb">
              <Button variant="ghost" size="sm">
                <Book className="h-4 w-4 mr-1" />
                KB
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
            <div className="border-l pl-2 ml-2 flex items-center gap-1">
              <MentionCenter />
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {escalatedCount > 0 && (
          <Link href="/dashboard/escalated" className="block mb-6">
            <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800 text-lg">
                        {escalatedCount} Escalated Ticket{escalatedCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-red-600">
                        Requires immediate attention
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" className="gap-2">
                    View Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Total Tickets</p>
                  <p className="text-3xl font-bold">{metrics?.tickets.total || 0}</p>
                </div>
                <Ticket className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Open</p>
                  <p className="text-3xl font-bold">{metrics?.tickets.open || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Escalated</p>
                  <p className="text-3xl font-bold">{escalatedCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Today</p>
                  <p className="text-3xl font-bold">{metrics?.tickets.createdToday || 0}</p>
                </div>
                <Clock className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">SLA Breaches</p>
                  <p className="text-3xl font-bold">{metrics?.tickets.slaBreaches || 0}</p>
                </div>
                <Clock className="h-8 w-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tickets Over Time
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">Last 14 days</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {ticketTrend.map((day, i) => {
                    const maxVal = Math.max(...ticketTrend.map((d) => Math.max(d.created, d.resolved)), 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '100px' }}>
                          <div
                            className="w-full bg-blue-500 rounded-b hover:bg-blue-600 transition-colors"
                            style={{ height: `${(day.created / maxVal) * 100}%`, minHeight: day.created ? '4px' : '0' }}
                            title={`${day.created} created`}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(day.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-xs text-muted-foreground">Created</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    By Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byStatus && Object.entries(stats.byStatus).slice(0, 5).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-xs rounded border ${statusColors[status] || 'bg-gray-100'}`}>
                          {status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    By Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byPriority && Object.entries(stats.byPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 text-xs rounded border ${priorityColors[priority] || 'bg-gray-100'}`}>
                          {priority}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Resolution</p>
                    <p className="text-2xl font-bold">
                      {stats?.avgResolutionTimeHours ? `${Math.round(stats.avgResolutionTimeHours)}h` : 'N/A'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg First Response</p>
                    <p className="text-2xl font-bold">
                      {stats?.avgFirstResponseTimeHours ? `${Math.round(stats.avgFirstResponseTimeHours)}h` : 'N/A'}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Tickets</CardTitle>
                  <Link href="/dashboard/tickets">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tickets yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="block p-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(ticket.createdAt)}
                              {ticket.assignee && ` • ${ticket.assignee.name || 'Assigned'}`}
                            </p>
                          </div>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${statusColors[ticket.status] || 'bg-gray-100'}`}>
                            {ticket.status.slice(0, 4)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/tickets/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">New Ticket</p>
                  <p className="text-xs text-muted-foreground">Create a ticket</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/tickets">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <MessageSquare className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium">All Tickets</p>
                  <p className="text-xs text-muted-foreground">Browse tickets</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/kb">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Book className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Knowledge Base</p>
                  <p className="text-xs text-muted-foreground">Manage articles</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/customer-health">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="py-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Customers</p>
                  <p className="text-xs text-muted-foreground">Health scores</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
