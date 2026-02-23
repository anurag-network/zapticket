'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent } from '@zapticket/ui/components/ui/card';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  Settings,
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
  assignee?: { id: string; name: string | null; email: string; avatarUrl?: string } | null;
  creator: { id: string; name: string | null; email: string };
  tags: { tag: { id: string; name: string; color: string } }[];
  customerProfile?: { id: string; name: string; email: string } | null;
}

interface TicketView {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  filters: Record<string, any>;
}

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

const typeColors: Record<string, string> = {
  BUG: 'bg-red-50 text-red-700',
  FEATURE: 'bg-purple-50 text-purple-700',
  QUESTION: 'bg-blue-50 text-blue-700',
  INCIDENT: 'bg-red-100 text-red-800',
  TASK: 'bg-green-50 text-green-700',
  FEEDBACK: 'bg-yellow-50 text-yellow-700',
  OTHER: 'bg-gray-50 text-gray-700',
};

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [views, setViews] = useState<TicketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    priority: [] as string[],
    type: [] as string[],
    assignee: '',
    unassigned: false,
  });

  const limit = 20;

  useEffect(() => {
    fetchViews();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, viewId, filters]);

  const fetchViews = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setViews(data);

        if (viewId) {
          const selectedView = data.find((v: TicketView) => v.id === viewId);
          if (selectedView?.filters) {
            setFilters(prev => ({
              ...prev,
              ...selectedView.filters,
            }));
          }
        } else {
          const defaultView = data.find((v: TicketView) => v.isDefault);
          if (defaultView?.filters) {
            setFilters(prev => ({
              ...prev,
              ...defaultView.filters,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch views:', error);
    }
  };

  const fetchTickets = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (filters.search) params.append('search', filters.search);
      if (filters.status.length > 0) filters.status.forEach(s => params.append('status', s));
      if (filters.priority.length > 0) filters.priority.forEach(p => params.append('priority', p));
      if (filters.type.length > 0) filters.type.forEach(t => params.append('type', t));
      if (filters.assignee) params.append('assigneeId', filters.assignee);
      if (filters.unassigned) params.append('unassigned', 'true');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || data);
        setTotal(data.total || data.length);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / limit));
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleArrayFilter = (key: 'status' | 'priority' | 'type', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      type: [],
      assignee: '',
      unassigned: false,
    });
    setPage(1);
  };

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

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.status.length +
    filters.priority.length +
    filters.type.length +
    (filters.assignee ? 1 : 0) +
    (filters.unassigned ? 1 : 0);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings/ticket-views">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Tickets</h2>
            <p className="text-muted-foreground">{total} total tickets</p>
          </div>
          <Link href="/dashboard/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!viewId ? 'default' : 'outline'}
              size="sm"
              onClick={() => router.push('/dashboard/tickets')}
            >
              All Tickets
            </Button>
            {views.map((view) => (
              <Button
                key={view.id}
                variant={viewId === view.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => router.push(`/dashboard/tickets?view=${view.id}`)}
              >
                {view.icon && <span className="mr-1">{view.icon}</span>}
                {view.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search tickets..."
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="border-l pl-2 flex gap-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'].map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleArrayFilter('status', s)}
                        className={`px-2 py-1 text-xs rounded ${
                          filters.status.includes(s)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                      <button
                        key={p}
                        onClick={() => toggleArrayFilter('priority', p)}
                        className={`px-2 py-1 text-xs rounded ${
                          filters.priority.includes(p)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['BUG', 'FEATURE', 'QUESTION', 'INCIDENT', 'TASK', 'FEEDBACK'].map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleArrayFilter('type', t)}
                        className={`px-2 py-1 text-xs rounded ${
                          filters.type.includes(t)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Assignment</label>
                  <div className="mt-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.unassigned}
                        onChange={(e) => handleFilterChange('unassigned', e.target.checked)}
                        className="rounded"
                      />
                      Unassigned only
                    </label>
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No tickets found</p>
              <Link href="/dashboard/tickets/new">
                <Button>Create your first ticket</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded ${statusColors[ticket.status] || 'bg-gray-100'}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[ticket.priority] || 'bg-gray-100'}`}>
                            {ticket.priority}
                          </span>
                          {ticket.type && (
                            <span className={`px-2 py-0.5 text-xs rounded ${typeColors[ticket.type] || 'bg-gray-100'}`}>
                              {ticket.type}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>#{ticket.id.slice(-6)}</span>
                          <span>•</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                          {ticket.customerProfile && (
                            <>
                              <span>•</span>
                              <span>{ticket.customerProfile.name || ticket.customerProfile.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.tags.length > 0 && (
                          <div className="flex gap-1">
                            {ticket.tags.slice(0, 2).map((t) => (
                              <span
                                key={t.tag.id}
                                className="px-2 py-0.5 text-xs rounded"
                                style={{ backgroundColor: t.tag.color + '20', color: t.tag.color }}
                              >
                                {t.tag.name}
                              </span>
                            ))}
                            {ticket.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{ticket.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                        {ticket.assignee ? (
                          <div
                            className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium"
                            title={ticket.assignee.name || ticket.assignee.email}
                          >
                            {ticket.assignee.name?.[0] || ticket.assignee.email[0]}
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30" title="Unassigned" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${statusColors[ticket.status] || 'bg-gray-100'}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[ticket.priority] || 'bg-gray-100'}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="font-medium mb-2 line-clamp-2">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(ticket.createdAt)}</span>
                      {ticket.assignee ? (
                        <div
                          className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium"
                          title={ticket.assignee.name || ticket.assignee.email}
                        >
                          {ticket.assignee.name?.[0] || ticket.assignee.email[0]}
                        </div>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
