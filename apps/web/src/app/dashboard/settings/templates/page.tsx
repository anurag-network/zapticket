'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Textarea } from '@zapticket/ui/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { Plus } from 'lucide-react';

const templates = [
  { name: 'Ticket Created', type: 'Email', trigger: 'On ticket creation' },
  { name: 'Ticket Assigned', type: 'Email', trigger: 'On assignment' },
  { name: 'Ticket Resolved', type: 'Email', trigger: 'On resolution' },
  { name: 'SLA Warning', type: 'Email', trigger: 'Before SLA breach' },
  { name: 'CSAT Survey', type: 'Email', trigger: 'After ticket closed' },
];

export default function TemplatesSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">Email and notification templates</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Template</Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">All Templates</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Customize automated notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                      <TableCell>{t.trigger}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>Available variables for use in templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{ticket.id}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Ticket ID</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{ticket.subject}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Ticket subject</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{ticket.status}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Current status</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{customer.name}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Customer name</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{customer.email}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Customer email</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <code className="text-sm">{'{{agent.name}}'}</code>
                  <p className="text-xs text-muted-foreground mt-1">Assigned agent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
