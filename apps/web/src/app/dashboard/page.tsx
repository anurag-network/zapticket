'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';
import { MentionCenter } from '@/components/mentions/MentionCenter';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Ticket,
  AlertTriangle,
  Clock,
  Users,
  Book,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  MessageSquare,
  Zap,
  Settings,
  BarChart3,
  Layers,
  User,
  Calendar,
  CheckCircle2,
  Activity,
  Target,
  LogOut,
  Mail,
  Phone,
  MessageCircle,
  Twitter,
  Send,
  Award,
  Star,
  Inbox,
  RefreshCw,
  Menu,
  X,
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
    resolvedToday: number;
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

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  resolvedCount: number;
  avgResponseTime: number;
  rating: number;
}

interface ChannelData {
  name: string;
  value: number;
  icon: string;
}

interface Activity {
  id: string;
  type: 'ticket_created' | 'ticket_resolved' | 'ticket_assigned' | 'comment_added';
  message: string;
  timestamp: string;
  user?: { name: string | null };
}

const STATUS_COLORS = ['#3B82F6', '#EAB308', '#F97316', '#EF4444', '#22C55E', '#6B7280'];
const PRIORITY_COLORS = { LOW: '#6B7280', NORMAL: '#3B82F6', HIGH: '#F97316', URGENT: '#EF4444' };
const CHANNEL_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Chat: MessageCircle,
  SMS: Phone,
  WhatsApp: MessageCircle,
  Twitter: Twitter,
  Facebook: MessageCircle,
  Telegram: Send,
  Web: Inbox,
};

const STATUS_COLORS_MAP: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  WAITING_ON_CUSTOMER: 'bg-orange-100 text-orange-800 border-orange-200',
  ESCALATED: 'bg-red-100 text-red-800 border-red-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [ticketTrend, setTicketTrend] = useState<TicketData[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('14');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/tickets-over-time?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/reporting/activity?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([metricsData, statsData, trendData, ticketsData, leaderboardData, channelData, activityData]) => {
        setMetrics(metricsData);
        setStats(statsData);
        setTicketTrend(trendData || []);
        setRecentTickets(ticketsData.tickets || ticketsData || []);
        setAgents(leaderboardData.agents || leaderboardData || []);
        setChannels(channelData.channels || channelData || []);
        setActivities(activityData.activities || activityData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, dateRange]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
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
      <div className="min-h-screen bg-muted/30 p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse md:hidden" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-muted rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-56 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-56 bg-muted rounded-lg animate-pulse" />
          <div className="h-56 bg-muted rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const escalatedCount = (stats?.byStatus?.ESCALATED || metrics?.tickets?.escalated || 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">ZapTicket</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Help Desk</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/dashboard/tickets">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Tickets
                </Button>
              </Link>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Users className="h-4 w-4 mr-1.5" />
                  Customers
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/kb">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Book className="h-4 w-4 mr-1.5" />
                  KB
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </Button>
              </Link>
              <div className="border-l mx-2 h-6 bg-border" />
              <MentionCenter />
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
</div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/dashboard/tickets">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Tickets
                </Button>
              </Link>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Users className="h-4 w-4 mr-1.5" />
                  Customers
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/kb">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Book className="h-4 w-4 mr-1.5" />
                  KB
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </Button>
              </Link>
              <div className="border-l mx-2 h-6 bg-border" />
              <MentionCenter />
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex md:hidden items-center gap-1">
              <MentionCenter />
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background animate-in slide-in-from-top">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <Link href="/dashboard/tickets" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Tickets
              </Button>
            </Link>
            <Link href="/dashboard/customers" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Customers
              </Button>
            </Link>
            <Link href="/dashboard/analytics" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/dashboard/kb" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Book className="h-4 w-4 mr-2" />
                Knowledge Base
              </Button>
            </Link>
            <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <div className="border-t pt-2 mt-2">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">Welcome back! Here's what's happening.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </div>

        {escalatedCount > 0 && (
          <Link href="/dashboard/escalated" className="block">
            <Card className="border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">
                        {escalatedCount} Escalated Ticket{escalatedCount !== 1 ? 's' : ''} require attention
                      </p>
                      <p className="text-sm text-red-600/80">
                        Click to view and resolve escalated tickets
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-2">
                    View <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-md">
            <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-blue-100 text-[10px] md:text-xs font-medium">Total</p>
                  <p className="text-xl md:text-2xl font-bold">{metrics?.tickets.total || 0}</p>
                  <p className="text-blue-200 text-[10px] md:text-xs hidden md:flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> All time
                  </p>
                </div>
                <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Ticket className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-0 shadow-md">
            <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-cyan-100 text-[10px] md:text-xs font-medium">Open</p>
                  <p className="text-xl md:text-2xl font-bold">{metrics?.tickets.open || 0}</p>
                  <p className="text-cyan-200 text-[10px] md:text-xs hidden md:flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Need attention
                  </p>
                </div>
                <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0 shadow-md">
            <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-emerald-100 text-[10px] md:text-xs font-medium">Resolved</p>
                  <p className="text-xl md:text-2xl font-bold">{metrics?.tickets.resolvedToday || 0}</p>
                  <p className="text-emerald-200 text-[10px] md:text-xs hidden md:flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Today
                  </p>
                </div>
                <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-md">
            <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-red-100 text-[10px] md:text-xs font-medium">Escalated</p>
                  <p className="text-xl md:text-2xl font-bold">{escalatedCount}</p>
                  <p className="text-red-200 text-[10px] md:text-xs hidden md:flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Urgent
                  </p>
                </div>
                <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 shadow-md">
            <CardContent className="pt-3 md:pt-4 pb-2 md:pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-orange-100 text-[10px] md:text-xs font-medium">SLA</p>
                  <p className="text-xl md:text-2xl font-bold">{metrics?.tickets.slaBreaches || 0}</p>
                  <p className="text-orange-200 text-[10px] md:text-xs hidden md:flex items-center gap-1">
                    <Target className="h-3 w-3" /> At risk
                  </p>
                </div>
                <div className="h-7 w-7 md:h-9 md:w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                </div>
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
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-background"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="14">Last 14 days</option>
                      <option value="30">Last 30 days</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={ticketTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 11 }}
                      stroke="#9CA3AF"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCreated)"
                      name="Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-xs text-muted-foreground">Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-xs text-muted-foreground">Resolved</span>
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
                  {stats?.byStatus && Object.keys(stats.byStatus).length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.byStatus).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {Object.keys(stats.byStatus).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                  )}
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
                  {stats?.byPriority && Object.keys(stats.byPriority).length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.byPriority).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {Object.entries(stats.byPriority).map(([name]) => (
                            <Cell key={name} fill={PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-xs">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  SLA Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolution Rate</span>
                    <span className="font-medium">{(100 - (metrics?.tickets.slaBreaches || 0) * 5).toFixed(0)}%</div>
                  </span>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${100 - (metrics?.tickets.slaBreaches || 0) * 5}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Resolution</p>
                    <p className="text-xl font-bold">
                      {stats?.avgResolutionTimeHours ? `${Math.round(stats.avgResolutionTimeHours)}h` : 'N/A'}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg First Response</p>
                    <p className="text-xl font-bold">
                      {stats?.avgFirstResponseTimeHours ? `${Math.round(stats.avgFirstResponseTimeHours)}h` : 'N/A'}
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Tickets
                  </CardTitle>
                  <Link href="/dashboard/tickets">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No tickets yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="block p-2.5 rounded-lg hover:bg-muted/60 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(ticket.createdAt)}
                              {ticket.assignee && <span>• {ticket.assignee.name || 'Assigned'}</span>}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${STATUS_COLORS_MAP[ticket.status] || 'bg-gray-100'}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Top Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No agent data yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.slice(0, 5).map((agent, index) => (
                      <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index < 3 ? <Award className="h-4 w-4" /> : agent.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.resolvedCount} resolved</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs font-medium">{agent.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No channel data yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {channels.map((channel, index) => {
                      const IconComponent = CHANNEL_ICONS[channel.name] || Inbox;
                      const total = channels.reduce((sum, c) => sum + c.value, 0);
                      const percentage = total > 0 ? ((channel.value / total) * 100).toFixed(0) : '0';
                      return (
                        <div key={channel.name} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHANNEL_COLORS[index % CHANNEL_COLORS.length]}20` }}>
                            <IconComponent className="h-4 w-4" style={{ color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{channel.name}</span>
                              <span className="text-xs text-muted-foreground">{channel.value}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: CHANNEL_COLORS[index % CHANNEL_COLORS.length]
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === 'ticket_resolved' ? 'bg-green-100' :
                        activity.type === 'ticket_created' ? 'bg-blue-100' :
                        activity.type === 'ticket_assigned' ? 'bg-purple-100' :
                        'bg-amber-100'
                      }`}>
                        {activity.type === 'ticket_resolved' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                         activity.type === 'ticket_created' ? <Plus className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'ticket_assigned' ? <User className="h-4 w-4 text-purple-600" /> :
                         <MessageSquare className="h-4 w-4 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(activity.timestamp)}
                          {activity.user?.name && <span>by {activity.user.name}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.byPriority && Object.keys(stats.byPriority).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.byPriority).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {Object.entries(stats.byPriority).map(([name], index) => (
                        <Cell key={name} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No priority data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <Link href="/dashboard/tickets/new">
            <Card className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
              <CardContent className="py-3 md:py-5 flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">New Ticket</p>
                  <p className="text-xs text-muted-foreground hidden md:block">Create new</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/tickets?status=OPEN">
            <Card className="hover:shadow-lg hover:border-cyan-500/30 transition-all cursor-pointer group">
              <CardContent className="py-3 md:py-5 flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Open</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{metrics?.tickets.open || 0} pending</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/kb">
            <Card className="hover:shadow-lg hover:border-green-500/30 transition-all cursor-pointer group">
              <CardContent className="py-3 md:py-5 flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Book className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">KB</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{metrics?.knowledgeBase?.articles || 0} articles</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/customer-health">
            <Card className="hover:shadow-lg hover:border-purple-500/30 transition-all cursor-pointer group">
              <CardContent className="py-3 md:py-5 flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Customers</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{metrics?.users?.total || 0} total</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
