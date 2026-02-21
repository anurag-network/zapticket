'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';

export default function TicketSettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ticket Settings</h1>
        <p className="text-muted-foreground">Configure ticket defaults and behavior</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Default Values</CardTitle>
            <CardDescription>Default settings for new tickets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Default Priority</Label>
                <Select defaultValue="NORMAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Status</Label>
                <Select defaultValue="OPEN">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Ticket Number Prefix</Label>
              <Input defaultValue="TKT-" className="max-w-[200px]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Behavior</CardTitle>
            <CardDescription>How tickets are handled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-assign on Creation</Label>
                <p className="text-sm text-muted-foreground">Automatically assign new tickets</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Reopen on Customer Reply</Label>
                <p className="text-sm text-muted-foreground">Reopen closed tickets when customer replies</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Unassigned Tickets</Label>
                <p className="text-sm text-muted-foreground">Tickets can exist without an assignee</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Merge Duplicate Tickets</Label>
                <p className="text-sm text-muted-foreground">Automatically merge duplicate tickets</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Close Settings</CardTitle>
            <CardDescription>Automatically close inactive tickets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Auto-Close</Label>
                <p className="text-sm text-muted-foreground">Close tickets after inactivity period</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label>Auto-Close After (days)</Label>
              <Input type="number" defaultValue="7" className="max-w-[200px]" />
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
