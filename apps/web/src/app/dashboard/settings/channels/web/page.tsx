'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Input } from '@zapticket/ui/components/ui/input';
import { Textarea } from '@zapticket/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';

export default function WebChannelPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Web Channel</h1>
        <p className="text-muted-foreground">Website widget configuration</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Widget Settings</CardTitle>
            <CardDescription>Configure the website support widget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Web Widget</Label>
                <p className="text-sm text-muted-foreground">Show support widget on your website</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label>Widget Position</Label>
              <Select defaultValue="bottom-right">
                <SelectTrigger className="max-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 max-w-[300px]">
                <Input type="color" defaultValue="#3b82f6" className="w-20" />
                <Input defaultValue="#3b82f6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>Add this code to your website</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="font-mono text-sm"
              rows={8}
              value={`<script src="https://zapticket.io/widget.js" 
  data-org="your-org-slug"
  data-position="bottom-right"
  data-color="#3b82f6">
</script>`}
            />
            <Button variant="outline" className="mt-2">Copy Code</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
