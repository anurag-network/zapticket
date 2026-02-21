'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus, BarChart3 } from 'lucide-react';

const reports = [
  { name: 'Ticket Volume', type: 'Summary', schedule: 'Weekly' },
  { name: 'Agent Performance', type: 'Detailed', schedule: 'Monthly' },
  { name: 'SLA Compliance', type: 'Summary', schedule: 'Weekly' },
  { name: 'Customer Satisfaction', type: 'Detailed', schedule: 'Monthly' },
];

export default function ReportProfilesSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Report Profiles</h1>
          <p className="text-muted-foreground">Configure custom report templates</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Create Profile</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Profiles</CardTitle>
          <CardDescription>Saved report configurations for quick generation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    {r.name}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                  <TableCell>{r.schedule}</TableCell>
                  <TableCell>Yesterday</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Run</Button>
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
