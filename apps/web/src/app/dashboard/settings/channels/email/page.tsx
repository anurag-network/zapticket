'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { Badge } from '@zapticket/ui/components/ui/badge';

export default function EmailChannelPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Channel</h1>
        <p className="text-muted-foreground">Email configuration for sending and receiving</p>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList>
          <TabsTrigger value="smtp">SMTP (Sending)</TabsTrigger>
          <TabsTrigger value="imap">IMAP (Receiving)</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure outgoing email server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.example.com" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input placeholder="587" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input placeholder="your-email@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <Label>From Address</Label>
                <Input placeholder="support@yourcompany.com" />
              </div>
              <div>
                <Label>Encryption</Label>
                <Select defaultValue="tls">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Test Connection</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imap">
          <Card>
            <CardHeader>
              <CardTitle>IMAP Configuration</CardTitle>
              <CardDescription>Configure incoming email for ticket creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email to Ticket</Label>
                  <p className="text-sm text-muted-foreground">Convert incoming emails to tickets</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IMAP Host</Label>
                  <Input placeholder="imap.example.com" />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input placeholder="993" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input placeholder="your-email@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button>Test Connection</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Email Providers</CardTitle>
              <CardDescription>Quick setup with popular providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Google Email (Gmail)', status: 'available' },
                { name: 'Microsoft 365 Graph', status: 'available' },
                { name: 'Microsoft 365 IMAP', status: 'available' },
                { name: 'SendGrid', status: 'available' },
                { name: 'AWS SES', status: 'available' },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{p.name}</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
