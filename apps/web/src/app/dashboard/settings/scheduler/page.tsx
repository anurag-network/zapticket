'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus } from 'lucide-react';

const scheduledTasks = [
  { name: 'SLA Check', schedule: 'Every 5 minutes', lastRun: '2 mins ago', status: 'running' },
  { name: 'Stale Ticket Cleanup', schedule: 'Daily at 2:00 AM', lastRun: '6 hours ago', status: 'completed' },
  { name: 'Report Generation', schedule: 'Weekly on Monday', lastRun: '3 days ago', status: 'completed' },
  { name: 'Email Sync', schedule: 'Every 10 minutes', lastRun: '8 mins ago', status: 'running' },
];

export default function SchedulerSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Scheduler</h1>
          <p className="text-muted-foreground">Manage scheduled tasks and jobs</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Schedule Task</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>Automated tasks that run on a schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledTasks.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{t.schedule}</code></TableCell>
                  <TableCell>{t.lastRun}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'running' ? 'default' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch defaultChecked />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Run Now</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
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
