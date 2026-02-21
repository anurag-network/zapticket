'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Trash2 } from 'lucide-react';

const sessions = [
  { user: 'john@example.com', device: 'Chrome / macOS', ip: '192.168.1.100', lastActive: '2 mins ago', current: true },
  { user: 'jane@example.com', device: 'Firefox / Windows', ip: '10.0.0.55', lastActive: '15 mins ago', current: false },
  { user: 'mike@example.com', device: 'Safari / iOS', ip: '172.16.0.22', lastActive: '1 hour ago', current: false },
  { user: 'sarah@example.com', device: 'Chrome / Android', ip: '192.168.1.150', lastActive: '3 hours ago', current: false },
];

export default function SessionsSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Active user sessions</p>
        </div>
        <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Revoke All Sessions</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Currently logged-in users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{s.user}</TableCell>
                  <TableCell>{s.device}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{s.ip}</code></TableCell>
                  <TableCell>{s.lastActive}</TableCell>
                  <TableCell>
                    {s.current ? (
                      <Badge>Current</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={s.current}>Revoke</Button>
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
