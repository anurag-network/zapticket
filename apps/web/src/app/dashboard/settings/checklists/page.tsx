'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus, CheckSquare } from 'lucide-react';

const checklists = [
  { name: 'New Employee Onboarding', items: 8, usedIn: 12, category: 'HR' },
  { name: 'Bug Report Verification', items: 5, usedIn: 34, category: 'Technical' },
  { name: 'Account Closure', items: 6, usedIn: 8, category: 'Account' },
  { name: 'Refund Processing', items: 4, usedIn: 23, category: 'Billing' },
];

export default function ChecklistsSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Checklists</h1>
          <p className="text-muted-foreground">Ticket checklists for consistent processes</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Checklist</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Templates</CardTitle>
          <CardDescription>Reusable checklists for tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Times Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklists.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    {c.name}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{c.category}</Badge></TableCell>
                  <TableCell>{c.items} items</TableCell>
                  <TableCell>{c.usedIn}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
