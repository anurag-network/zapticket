'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Label } from '@zapticket/ui/components/ui/label';
import { Link } from 'next/link';

export default function KnowledgeBaseSettingsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">Help center configuration</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Knowledge base configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Knowledge Base</Label>
                <p className="text-sm text-muted-foreground">Make help center publicly accessible</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Login</Label>
                <p className="text-sm text-muted-foreground">Users must login to view articles</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Search</Label>
                <p className="text-sm text-muted-foreground">Allow full-text search</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Article Voting</Label>
                <p className="text-sm text-muted-foreground">Allow helpful/not helpful feedback</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Settings</CardTitle>
            <CardDescription>Meilisearch configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Search Engine</Label>
                <p className="text-sm text-muted-foreground">Current search backend</p>
              </div>
              <span className="text-sm font-medium">Meilisearch</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Index</Label>
                <p className="text-sm text-muted-foreground">Automatically index new articles</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline">Rebuild Search Index</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage knowledge base content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Categories</p>
                <p className="text-sm text-muted-foreground">Organize articles into categories</p>
              </div>
              <Button variant="outline" asChild>
                <a href="/dashboard/settings/knowledge-base/categories">Manage</a>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Articles</p>
                <p className="text-sm text-muted-foreground">Create and edit help articles</p>
              </div>
              <Button variant="outline" asChild>
                <a href="/dashboard/knowledge-base">Manage</a>
              </Button>
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
