'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Button } from '@zapticket/ui/components/ui/button';
import { Cpu, GitBranch, Calendar, Check } from 'lucide-react';

export default function VersionPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Version</h1>
        <p className="text-muted-foreground">ZapTicket version information</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">ZT</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">ZapTicket</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-base py-1">v1.0.0</Badge>
                <Badge variant="outline">Stable</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Version Details</CardTitle>
            <CardDescription>Current installation info</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">1.0.0</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Git Branch</p>
                  <p className="font-medium">main</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Release Date</p>
                  <p className="font-medium">February 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>System components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: 'API', version: '1.0.0' },
                { name: 'Web App', version: '1.0.0' },
                { name: 'Widget', version: '1.0.0' },
                { name: 'Database Schema', version: '1.0.0' },
              ].map((c) => (
                <div key={c.name} className="flex justify-between items-center">
                  <span>{c.name}</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">{c.version}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Up to Date
            </CardTitle>
            <CardDescription>You are running the latest version</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No updates available. Check back later for new features and improvements.
            </p>
            <Button variant="outline" className="mt-4">Check for Updates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
