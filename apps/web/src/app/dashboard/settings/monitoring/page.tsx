'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

const metrics = [
  { name: 'CPU Usage', value: '23%', status: 'normal' },
  { name: 'Memory Usage', value: '45%', status: 'normal' },
  { name: 'Disk Usage', value: '67%', status: 'warning' },
  { name: 'Active Connections', value: '156', status: 'normal' },
];

export default function MonitoringSettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Monitoring</h1>
        <p className="text-muted-foreground">System health and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <Card key={m.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{m.name}</CardTitle>
              <Badge variant={m.status === 'warning' ? 'destructive' : 'default'}>
                {m.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Current service health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'API Server', status: 'running' },
                { name: 'Database', status: 'running' },
                { name: 'Redis Cache', status: 'running' },
                { name: 'Email Service', status: 'running' },
                { name: 'Search Service', status: 'running' },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span>{s.name}</span>
                  <Badge variant="default" className="bg-green-500">{s.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>System notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">High Disk Usage</p>
                <p className="text-xs text-yellow-600">Disk usage at 67% - 5 mins ago</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Backup Completed</p>
                <p className="text-xs text-green-600">Daily backup finished - 2 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
