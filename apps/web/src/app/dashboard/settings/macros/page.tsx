'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus } from 'lucide-react';

const macros = [
  { name: 'Close as Resolved', actions: 3, uses: 145, folder: 'Ticket Management' },
  { name: 'Escalate to L2', actions: 4, uses: 67, folder: 'Escalation' },
  { name: 'Request More Info', actions: 2, uses: 89, folder: 'Communication' },
  { name: 'Mark as Spam', actions: 2, uses: 34, folder: 'Moderation' },
  { name: 'Assign to Billing', actions: 3, uses: 56, folder: 'Assignment' },
];

export default function MacrosSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Macros</h1>
          <p className="text-muted-foreground">Predefined action sequences for common tasks</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Macro</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Macros</CardTitle>
          <CardDescription>Quick actions combining multiple steps</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Times Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {macros.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell><Badge variant="secondary">{m.folder}</Badge></TableCell>
                  <TableCell>{m.actions} step(s)</TableCell>
                  <TableCell>{m.uses}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Duplicate</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
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
