'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { 
  CheckCircle, AlertTriangle, XCircle, MinusCircle,
  Clock, Mail, ExternalLink
} from 'lucide-react';

interface Component {
  id: string;
  name: string;
  status: string;
  category?: string;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  updates: { content: string; status: string; createdAt: string }[];
}

interface StatusPage {
  title: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  components: Component[];
  incidents: Incident[];
}

export default function PublicStatusPage({ params }: { params: { slug: string } }) {
  const [statusPage, setStatusPage] = useState<StatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          setStatusPage(data);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [params.slug]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'partial_outage':
        return <MinusCircle className="h-5 w-5 text-orange-500" />;
      case 'major_outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MinusCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'partial_outage': return 'bg-orange-100 text-orange-800';
      case 'major_outage': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatus = () => {
    if (!statusPage) return 'unknown';
    
    if (statusPage.incidents.length > 0) {
      return 'degraded';
    }

    const operational = statusPage.components.filter(c => c.status === 'operational').length;
    if (operational === statusPage.components.length) return 'operational';
    return 'degraded';
  };

  const handleSubscribe = async () => {
    if (!email) return;
    
    try {
      const res = await fetch(`/api/status/${params.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setSubscribed(true);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!statusPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-bold">Status Page Not Found</h2>
            <p className="text-muted-foreground mt-2">
              This status page does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusPage.logoUrl && (
                <img src={statusPage.logoUrl} alt={statusPage.title} className="h-12 w-12" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{statusPage.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(overallStatus)}
                  <span className={`font-medium capitalize ${overallStatus === 'operational' ? 'text-green-600' : overallStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {overallStatus === 'operational' ? 'All Systems Operational' : 'System Degraded'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {statusPage.incidents.length > 0 && (
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold">Active Incidents</h2>
            {statusPage.incidents.map((incident) => (
              <Card key={incident.id} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{incident.title}</h3>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {incident.updates.map((update, i) => (
                    <div key={i} className="mt-4 pl-4 border-l-2 border-muted">
                      <p className="text-sm">{update.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            {statusPage.components.map((component) => (
              <Card key={component.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{component.name}</p>
                      {component.category && (
                        <p className="text-sm text-muted-foreground">{component.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(component.status)}
                      <span className={`text-sm capitalize ${component.status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {component.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Subscribe to Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribed ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">You're subscribed!</p>
                <p className="text-sm text-muted-foreground">
                  We'll notify you when there are any status updates.
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={handleSubscribe}>Subscribe</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
