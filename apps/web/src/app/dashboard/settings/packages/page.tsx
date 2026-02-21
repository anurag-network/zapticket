'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Package, RefreshCw } from 'lucide-react';

const packages = [
  { name: 'Core', version: '1.0.0', status: 'active', description: 'Core ticketing functionality' },
  { name: 'Knowledge Base', version: '1.0.0', status: 'active', description: 'Help center and articles' },
  { name: 'Chat Widget', version: '1.0.0', status: 'active', description: 'Live chat support' },
  { name: 'Reporting', version: '1.0.0', status: 'active', description: 'Analytics and reports' },
  { name: 'Integrations', version: '1.0.0', status: 'active', description: 'Third-party integrations' },
  { name: 'Chatbot (Zapdeck)', version: '1.0.0', status: 'active', description: 'AI-powered chatbot' },
];

export default function PackagesSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Packages</h1>
          <p className="text-muted-foreground">Installed packages and modules</p>
        </div>
        <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Check Updates</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installed Packages</CardTitle>
          <CardDescription>Manage ZapTicket packages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {p.name}
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{p.version}</code></TableCell>
                  <TableCell className="text-muted-foreground">{p.description}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500">{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch defaultChecked />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Configure</Button>
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
