'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ToggleLeft,
  ToggleRight,
  History,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface SSOConnection {
  id: string;
  name: string;
  provider: string;
  domain: string;
  enabled: boolean;
  oidcClientId?: string;
  oidcDiscoveryUrl?: string;
  autoProvision: boolean;
  defaultRole?: string;
  createdAt: string;
}

interface SSOLogin {
  id: string;
  ssoProvider: string;
  email: string;
  success: boolean;
  createdAt: string;
  ssoConnection?: { name: string };
}

const SSO_PROVIDERS = [
  { value: 'OIDC', label: 'OpenID Connect' },
  { value: 'SAML', label: 'SAML 2.0' },
  { value: 'OKTA', label: 'Okta' },
  { value: 'AZURE_AD', label: 'Azure AD' },
  { value: 'GOOGLE_WORKSPACE', label: 'Google Workspace' },
];

export default function SSOSettingsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<SSOConnection[]>([]);
  const [loginHistory, setLoginHistory] = useState<SSOLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    provider: 'OIDC',
    domain: '',
    samlEntryPoint: '',
    samlCertificate: '',
    samlIssuer: '',
    oidcClientId: '',
    oidcClientSecret: '',
    oidcDiscoveryUrl: '',
    oidcCallbackUrl: '',
    emailAttribute: 'email',
    nameAttribute: 'name',
    autoProvision: true,
    defaultRole: 'MEMBER',
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConnections(await res.json());
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/login-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLoginHistory(await res.json());
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSaving(true);
    try {
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/connections/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/connections`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        resetForm();
        fetchConnections();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleConnection = async (id: string, enabled: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/connections/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      fetchConnections();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Delete this SSO connection?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sso/connections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConnections();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleEdit = (connection: SSOConnection) => {
    setEditingId(connection.id);
    setFormData({
      name: connection.name,
      provider: connection.provider,
      domain: connection.domain,
      samlEntryPoint: '',
      samlCertificate: '',
      samlIssuer: '',
      oidcClientId: connection.oidcClientId || '',
      oidcClientSecret: '',
      oidcDiscoveryUrl: connection.oidcDiscoveryUrl || '',
      oidcCallbackUrl: '',
      emailAttribute: 'email',
      nameAttribute: 'name',
      autoProvision: connection.autoProvision,
      defaultRole: connection.defaultRole || 'MEMBER',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'OIDC',
      domain: '',
      samlEntryPoint: '',
      samlCertificate: '',
      samlIssuer: '',
      oidcClientId: '',
      oidcClientSecret: '',
      oidcDiscoveryUrl: '',
      oidcCallbackUrl: '',
      emailAttribute: 'email',
      nameAttribute: 'name',
      autoProvision: true,
      defaultRole: 'MEMBER',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const isOIDC = ['OIDC', 'AZURE_AD', 'GOOGLE_WORKSPACE'].includes(formData.provider);
  const isSAML = ['SAML', 'OKTA'].includes(formData.provider);

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
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Single Sign-On (SSO)</h2>
            <p className="text-muted-foreground">Configure SAML and OIDC authentication</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchLoginHistory();
              }}
            >
              <History className="h-4 w-4 mr-2" />
              Login History
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit SSO Connection' : 'Add SSO Connection'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Company Okta"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Provider *</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      {SSO_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Domain *</label>
                    <Input
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="company.com"
                      required
                      disabled={!!editingId}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Default Role</label>
                    <select
                      value={formData.defaultRole}
                      onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value })}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                {isOIDC && (
                  <div className="space-y-4 p-4 border rounded bg-muted/30">
                    <h4 className="font-medium">OIDC Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Discovery URL</label>
                        <Input
                          value={formData.oidcDiscoveryUrl}
                          onChange={(e) => setFormData({ ...formData, oidcDiscoveryUrl: e.target.value })}
                          placeholder="https://provider.com/.well-known/openid-configuration"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Client ID</label>
                        <Input
                          value={formData.oidcClientId}
                          onChange={(e) => setFormData({ ...formData, oidcClientId: e.target.value })}
                          placeholder="client-id"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Client Secret</label>
                        <Input
                          type="password"
                          value={formData.oidcClientSecret}
                          onChange={(e) => setFormData({ ...formData, oidcClientSecret: e.target.value })}
                          placeholder="client-secret"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Callback URL</label>
                        <Input
                          value={formData.oidcCallbackUrl}
                          onChange={(e) => setFormData({ ...formData, oidcCallbackUrl: e.target.value })}
                          placeholder={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/sso/oidc/callback`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isSAML && (
                  <div className="space-y-4 p-4 border rounded bg-muted/30">
                    <h4 className="font-medium">SAML Configuration</h4>
                    <div>
                      <label className="text-sm font-medium">Entry Point URL</label>
                      <Input
                        value={formData.samlEntryPoint}
                        onChange={(e) => setFormData({ ...formData, samlEntryPoint: e.target.value })}
                        placeholder="https://sso.company.com/saml"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">X.509 Certificate</label>
                      <textarea
                        value={formData.samlCertificate}
                        onChange={(e) => setFormData({ ...formData, samlCertificate: e.target.value })}
                        placeholder="-----BEGIN CERTIFICATE-----..."
                        className="w-full h-24 rounded-md border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoProvision"
                    checked={formData.autoProvision}
                    onChange={(e) => setFormData({ ...formData, autoProvision: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoProvision" className="text-sm">
                    Auto-provision new users
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showHistory && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No SSO logins yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loginHistory.map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <div>
                        <p className="text-sm font-medium">{login.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {login.ssoConnection?.name || login.ssoProvider} • {formatDate(login.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          login.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {login.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SSO Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No SSO connections configured</p>
                <p className="text-sm">Add a connection to enable single sign-on</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          connection.enabled ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${connection.enabled ? 'text-green-600' : 'text-gray-400'}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{connection.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {SSO_PROVIDERS.find((p) => p.value === connection.provider)?.label} • {connection.domain}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleConnection(connection.id, !connection.enabled)}>
                        {connection.enabled ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(connection)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteConnection(connection.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
