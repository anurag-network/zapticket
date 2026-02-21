'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Badge } from '@zapticket/ui/components/ui/badge';

export default function SMSChannelPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SMS Channel</h1>
        <p className="text-muted-foreground">SMS notifications configuration</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SMS Provider</CardTitle>
            <CardDescription>Select your SMS gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select defaultValue="twilio">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                  <SelectItem value="aws-sns">AWS SNS</SelectItem>
                  <SelectItem value="msg91">MSG91</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account SID / API Key</Label>
                <Input placeholder="ACxxxxxxxxxxxx" />
              </div>
              <div>
                <Label>Auth Token / API Secret</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <Label>From Number</Label>
              <Input placeholder="+1234567890" />
            </div>
            <Button>Test SMS</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMS Notifications</CardTitle>
            <CardDescription>When to send SMS notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Ticket Created</Label>
                <p className="text-sm text-muted-foreground">Notify customer when ticket is created</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Ticket Updated</Label>
                <p className="text-sm text-muted-foreground">Notify customer on ticket update</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Ticket Resolved</Label>
                <p className="text-sm text-muted-foreground">Notify customer when resolved</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SLA Warning</Label>
                <p className="text-sm text-muted-foreground">Alert agents before SLA breach</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
