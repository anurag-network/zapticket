'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';

export default function DataPrivacySettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Privacy</h1>
        <p className="text-muted-foreground">Privacy and compliance settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>How long to keep data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Keep Closed Tickets (days)</Label>
              <Input type="number" defaultValue="365" className="max-w-[200px]" />
            </div>
            <div>
              <Label>Keep Chat History (days)</Label>
              <Input type="number" defaultValue="90" className="max-w-[200px]" />
            </div>
            <div>
              <Label>Keep Audit Logs (days)</Label>
              <Input type="number" defaultValue="180" className="max-w-[200px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Features</CardTitle>
            <CardDescription>Data protection options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Anonymize User Data</Label>
                <p className="text-sm text-muted-foreground">Anonymize personal data on deletion</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>GDPR Compliance Mode</Label>
                <p className="text-sm text-muted-foreground">Enable GDPR-compliant features</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Cookie Consent Banner</Label>
                <p className="text-sm text-muted-foreground">Show cookie consent to visitors</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export all organization data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all tickets, customers, and settings in a portable format.
            </p>
            <Button variant="outline">Request Data Export</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
