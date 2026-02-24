'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Button } from '@zapticket/ui/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { 
  Mail, Phone, Building, Clock, Ticket, 
  ThumbsUp, TrendingUp, TrendingDown, Minus,
  MessageCircle, Calendar, FileText, Plus
} from 'lucide-react';

interface Customer360Data {
  profile: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    notes?: string;
    healthScore: number;
    healthStatus: string;
    createdAt: string;
  };
  stats: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime?: number;
  };
  tickets: any[];
  interactions: any[];
  healthScore: {
    score: number;
    status: string;
    trend: 'up' | 'down' | 'stable';
  };
  recentNotes: any[];
}

interface Customer360ViewProps {
  customerId: string;
}

export function Customer360View({ customerId }: Customer360ViewProps) {
  const [customer, setCustomer] = useState<Customer360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/360/${customerId}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {customer.profile.name?.[0] || customer.profile.email[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{customer.profile.name || 'Unknown'}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {customer.profile.email}
              </span>
              {customer.profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {customer.profile.phone}
                </span>
              )}
              {customer.profile.company && (
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {customer.profile.company}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Health Score</p>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${getHealthColor(customer.healthScore.score)}`}>
                {customer.healthScore.score}
              </span>
              {getTrendIcon(customer.healthScore.trend)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{customer.stats.totalTickets}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{customer.stats.openTickets}</p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <ThumbsUp className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{customer.stats.resolvedTickets}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{customer.interactions.length}</p>
                <p className="text-sm text-muted-foreground">Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="interactions">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.interactions.slice(0, 5).map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3 p-2">
                      <div className="mt-1">
                        {interaction.type === 'ticket_created' ? (
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm">{interaction.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interaction.occurredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>All Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customer.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{ticket.subject}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>Interaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {customer.interactions.map((interaction) => (
                    <div key={interaction.id} className="relative flex gap-4">
                      <div className="absolute left-4 w-3 h-3 rounded-full bg-primary -translate-x-1/2 mt-1.5" />
                      <div className="ml-8 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {interaction.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(interaction.occurredAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1">{interaction.summary}</p>
                        {interaction.ticketSubject && (
                          <a href={`/dashboard/tickets/${interaction.ticketId}`} className="text-sm text-blue-600 hover:underline">
                            {interaction.ticketSubject}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Notes</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {customer.recentNotes?.length > 0 ? (
                <div className="space-y-3">
                  {customer.recentNotes.map((note: any, i: number) => (
                    <div key={i} className="p-3 border rounded">
                      <p className="text-sm">{note.content || note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No notes yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
