'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus, Zap } from 'lucide-react';

const triggers = [
  { name: 'Auto-assign new tickets', event: 'Ticket Created', active: true, actions: 1 },
  { name: 'SLA breach warning', event: 'SLA Warning', active: true, actions: 2 },
  { name: 'Close inactive tickets', event: 'Scheduled', active: true, actions: 1 },
  { name: 'Notify on high priority', event: 'Priority Changed', active: false, actions: 1 },
];

export default function TriggersSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Triggers</h1>
          <p className="text-muted-foreground">Automated event-based responses</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Trigger</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />How Triggers Work</CardTitle>
          <CardDescription>
            Triggers automatically perform actions when specific events occur. They are evaluated in order and can modify tickets, send notifications, or trigger webhooks.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Triggers</CardTitle>
          <CardDescription>Manage your automated triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger Event</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{t.event}</Badge></TableCell>
                  <TableCell>{t.actions} action(s)</TableCell>
                  <TableCell>
                    <Badge variant={t.active ? 'default' : 'secondary'}>
                      {t.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Duplicate</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
