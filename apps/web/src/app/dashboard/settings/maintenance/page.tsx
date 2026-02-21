'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Wrench, Database, RefreshCw, Trash2 } from 'lucide-react';

export default function MaintenanceSettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground">System maintenance operations</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache Management</CardTitle>
            <CardDescription>Clear cached data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Application Cache</p>
                <p className="text-sm text-muted-foreground">Clear all cached data and templates</p>
              </div>
              <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Clear Cache</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Maintenance</CardTitle>
            <CardDescription>Optimize and clean database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Vacuum Database</p>
                <p className="text-sm text-muted-foreground">Reclaim storage space</p>
              </div>
              <Button variant="outline"><Database className="h-4 w-4 mr-2" />Run Vacuum</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Update Statistics</p>
                <p className="text-sm text-muted-foreground">Refresh query optimization stats</p>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleanup Operations</CardTitle>
            <CardDescription>Remove old and unused data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Old Sessions</p>
                <p className="text-sm text-muted-foreground">Clear expired user sessions</p>
              </div>
              <Button variant="outline">Clean</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Orphaned Files</p>
                <p className="text-sm text-muted-foreground">Remove unlinked attachments</p>
              </div>
              <Button variant="outline">Clean</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset to Defaults</p>
                <p className="text-sm text-muted-foreground">Reset all settings to default values</p>
              </div>
              <Button variant="destructive">Reset</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
