'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';

export default function OverviewSettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Overview Settings</h1>
        <p className="text-muted-foreground">Configure dashboard and overview displays</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Widgets</CardTitle>
            <CardDescription>Choose which widgets to display on the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Ticket Statistics', desc: 'Open, closed, and pending tickets' },
              { label: 'Recent Activity', desc: 'Latest ticket updates' },
              { label: 'Agent Workload', desc: 'Current ticket distribution' },
              { label: 'SLA Status', desc: 'SLA compliance overview' },
              { label: 'Escalation Alerts', desc: 'Escalated tickets warning' },
            ].map((w) => (
              <div key={w.label} className="flex items-center justify-between">
                <div>
                  <Label>{w.label}</Label>
                  <p className="text-sm text-muted-foreground">{w.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default View</CardTitle>
            <CardDescription>Set default ticket view and filters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Ticket Queue</Label>
              <Select defaultValue="all-open">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-open">All Open Tickets</SelectItem>
                  <SelectItem value="my-tickets">My Tickets</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tickets Per Page</Label>
              <Select defaultValue="25">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
