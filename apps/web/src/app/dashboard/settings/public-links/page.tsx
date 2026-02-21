'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus, Link2, Copy } from 'lucide-react';

const publicLinks = [
  { name: 'Shared Ticket View', url: '/public/ticket/abc123', expires: '7 days', views: 45 },
  { name: 'Customer Portal', url: '/portal/support', expires: 'Never', views: 1234 },
  { name: 'Feedback Form', url: '/public/feedback/xyz789', expires: '30 days', views: 89 },
];

export default function PublicLinksSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Public Links</h1>
          <p className="text-muted-foreground">Shareable links for tickets and forms</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Link</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Links</CardTitle>
          <CardDescription>Manage publicly accessible links</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicLinks.map((l) => (
                <TableRow key={l.name}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-2">
                      {l.url}
                      <Copy className="h-3 w-3 cursor-pointer" />
                    </code>
                  </TableCell>
                  <TableCell><Badge variant="outline">{l.expires}</Badge></TableCell>
                  <TableCell>{l.views}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Copy</Button>
                    <Button variant="ghost" size="sm">Regenerate</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
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
