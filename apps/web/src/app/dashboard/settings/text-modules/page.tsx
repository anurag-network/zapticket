'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Textarea } from '@zapticket/ui/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus, Search } from 'lucide-react';

const textModules = [
  { name: 'Greeting', content: 'Hello, thank you for contacting support...', category: 'Greeting', uses: 234 },
  { name: 'Escalation Notice', content: 'I am escalating your ticket to our senior team...', category: 'Escalation', uses: 45 },
  { name: 'Resolution', content: 'Glad we could resolve your issue...', category: 'Closing', uses: 189 },
  { name: 'Password Reset', content: 'To reset your password, please follow...', category: 'Technical', uses: 67 },
];

export default function TextModulesSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Text Modules</h1>
          <p className="text-muted-foreground">Canned responses for quick replies</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Module</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search text modules..." className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Text Modules</CardTitle>
          <CardDescription>Reusable text snippets for ticket responses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {textModules.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{m.content}</TableCell>
                  <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                  <TableCell>{m.uses}</TableCell>
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
