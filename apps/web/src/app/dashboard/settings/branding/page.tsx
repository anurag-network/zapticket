'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';

export default function BrandingSettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground">Customize your help desk appearance</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo & Colors</CardTitle>
            <CardDescription>Customize the visual identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo URL</Label>
              <Input placeholder="https://your-domain.com/logo.png" />
              <p className="text-xs text-muted-foreground mt-1">Recommended size: 200x50px</p>
            </div>
            <div>
              <Label>Favicon URL</Label>
              <Input placeholder="https://your-domain.com/favicon.ico" />
            </div>
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" defaultValue="#3b82f6" className="w-20" />
                <Input defaultValue="#3b82f6" placeholder="#3b82f6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Text</CardTitle>
            <CardDescription>Customize text and messaging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Help Desk Name</Label>
              <Input defaultValue="ZapTicket Support" />
            </div>
            <div>
              <Label>Welcome Message</Label>
              <Input placeholder="How can we help you today?" />
            </div>
            <div>
              <Label>Footer Text</Label>
              <Input placeholder="© 2024 Your Company. All rights reserved." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom CSS</CardTitle>
            <CardDescription>Advanced styling with custom CSS</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea 
              className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
              placeholder="/* Add your custom CSS here */"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
