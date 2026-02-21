'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setApiKeys(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, permissions: ['read', 'write'] }),
      });

      const data = await res.json();
      setNewKey(data.key);
      setName('');
      setShowForm(false);
      fetchApiKeys();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/integrations/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApiKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      alert('API key copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/settings/integrations')}>
            Back to Integrations
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">API Keys</h2>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Key'}
            </Button>
          </div>

          {newKey && (
            <Card className="mb-4 border-green-500">
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">Your new API key:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">{newKey}</code>
                  <Button onClick={copyKey}>Copy</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Save this key now. You won't be able to see it again.
                </p>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Name *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Production App, CI/CD Pipeline"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={saving || !name}>
                    {saving ? 'Creating...' : 'Create API Key'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No API keys. Create one to access the API programmatically.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <div className="flex gap-2 mt-1">
                          {key.permissions.map((p) => (
                            <span key={p} className="text-xs bg-muted px-2 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(key.id)}>
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Using API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Include the API key in your requests:
              </p>
              <pre className="p-3 bg-muted rounded text-sm overflow-x-auto">
{`curl -X GET "https://api.zapticket.io/api/v1/tickets" \\
  -H "X-API-Key: zt_your_api_key_here"`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
