'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';

export default function SecuritySettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Security</h1>
        <p className="text-muted-foreground">Authentication and security settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Login and authentication options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SSO Enabled</Label>
                <p className="text-sm text-muted-foreground">Enable Single Sign-On</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" defaultValue="60" className="max-w-[200px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
            <CardDescription>Password requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Password Length</Label>
              <Input type="number" defaultValue="8" className="max-w-[200px]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Uppercase</Label>
                <p className="text-sm text-muted-foreground">At least one uppercase letter</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Numbers</Label>
                <p className="text-sm text-muted-foreground">At least one number</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">At least one special character</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP Restrictions</CardTitle>
            <CardDescription>Restrict access by IP address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable IP Whitelist</Label>
                <p className="text-sm text-muted-foreground">Only allow access from whitelisted IPs</p>
              </div>
              <Switch />
            </div>
            <div>
              <Label>Whitelisted IPs</Label>
              <textarea 
                className="w-full h-24 p-3 border rounded-lg text-sm"
                placeholder="192.168.1.0/24&#10;10.0.0.1"
              />
              <p className="text-xs text-muted-foreground mt-1">One IP or CIDR range per line</p>
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
