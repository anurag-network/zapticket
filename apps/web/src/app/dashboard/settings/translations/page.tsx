'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Plus } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', progress: 100, default: true },
  { code: 'es', name: 'Spanish', progress: 85, default: false },
  { code: 'fr', name: 'French', progress: 72, default: false },
  { code: 'de', name: 'German', progress: 68, default: false },
];

export default function TranslationsSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Translations</h1>
          <p className="text-muted-foreground">Language and localization settings</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Add Language</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default Language</CardTitle>
          <CardDescription>Set the default language for your help desk</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="en">
            <SelectTrigger className="max-w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Languages</CardTitle>
          <CardDescription>Manage supported languages</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Translation Progress</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((l) => (
                <TableRow key={l.code}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{l.code}</code></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${l.progress}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{l.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {l.default && <Badge>Default</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                    {!l.default && <Button variant="ghost" size="sm">Set Default</Button>}
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
