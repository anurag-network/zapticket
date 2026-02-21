'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus } from 'lucide-react';

const tags = [
  { name: 'Bug', color: '#ef4444', tickets: 45 },
  { name: 'Feature Request', color: '#3b82f6', tickets: 23 },
  { name: 'Urgent', color: '#f97316', tickets: 12 },
  { name: 'Billing', color: '#22c55e', tickets: 34 },
  { name: 'Technical', color: '#8b5cf6', tickets: 67 },
];

export default function TagsSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">Manage tags for tickets and articles</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Tag</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>Tags help categorize and filter tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Used in Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.name}>
                  <TableCell>
                    <Badge style={{ backgroundColor: tag.color }}>{tag.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{tag.color}</code>
                  </TableCell>
                  <TableCell>{tag.tickets}</TableCell>
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
