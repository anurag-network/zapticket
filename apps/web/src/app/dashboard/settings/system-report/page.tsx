'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';

export default function SystemReportPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Report</h1>
          <p className="text-muted-foreground">System diagnostics and information</p>
        </div>
        <Button>Download Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Basic system details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                ['ZapTicket Version', '1.0.0'],
                ['Node.js Version', '20.10.0'],
                ['Database', 'PostgreSQL 15.4'],
                ['Cache', 'Redis 7.2'],
                ['Search Engine', 'Meilisearch 1.5'],
                ['Storage', 'MinIO'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">{value}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>Database metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                ['Total Tickets', '12,456'],
                ['Total Users', '892'],
                ['Total Organizations', '45'],
                ['Database Size', '2.3 GB'],
                ['Index Size', '456 MB'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Status</CardTitle>
            <CardDescription>Enabled features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: 'Email Channel', enabled: true },
                { name: 'Chat Widget', enabled: true },
                { name: 'Knowledge Base', enabled: true },
                { name: 'Webhooks', enabled: true },
                { name: 'OAuth Login', enabled: true },
                { name: 'API Access', enabled: true },
                { name: 'Chatbot (Zapdeck)', enabled: true },
              ].map((f) => (
                <div key={f.name} className="flex justify-between items-center">
                  <span>{f.name}</span>
                  <Badge variant={f.enabled ? 'default' : 'secondary'}>
                    {f.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Errors</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Failures</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook Failures</span>
                <Badge variant="secondary">5</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Errors</span>
                <Badge variant="destructive">9</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
