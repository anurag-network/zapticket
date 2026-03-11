'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui';
import { 
  Mail, Plus, Save, Trash2, Copy, RefreshCw, ToggleLeft, ToggleRight, FileText, Eye, Edit
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultTemplates = [
  {
    name: 'Ticket Reply',
    type: 'ticket_reply',
    subject: '[Ticket #{{ticket_id}}] {{subject}}',
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .message { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">{{subject}}</h2>
    </div>
    <div class="content">
      <p>Hello {{customer_name}},</p>
      <div class="message">
        {{message_content}}
      </div>
      <p><a href="{{ticket_url}}" class="button">View Ticket</a></p>
    </div>
    <div class="footer">
      <p>Best regards,<br>{{agent_name}}</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    name: 'Ticket Created',
    type: 'ticket_created',
    subject: 'Your ticket #{{ticket_id}} has been created',
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Ticket Created</h2>
    </div>
    <div class="content">
      <p>Hello {{customer_name}},</p>
      <p>Your support ticket has been created successfully.</p>
      <p><strong>Ticket ID:</strong> #{{ticket_id}}</p>
    </div>
  </div>
</body>
</html>`,
  },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/email-templates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/email-templates/${editingTemplate.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingTemplate),
        }
      );
      
      if (res.ok) {
        fetchTemplates();
        setEditingTemplate(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/email-templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingTemplate),
        }
      );
      
      if (res.ok) {
        fetchTemplates();
        setEditingTemplate(null);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/email-templates/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/email-templates/${id}/toggle`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openCreateModal = () => {
    setEditingTemplate({
      id: '',
      name: '',
      subject: '',
      body: '',
      type: 'custom',
      active: true,
      createdAt: '',
      updatedAt: '',
    });
    setShowCreateModal(true);
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setShowCreateModal(false);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ticket_reply: 'Ticket Reply',
      ticket_created: 'Ticket Created',
      ticket_closed: 'Ticket Closed',
      password_reset: 'Password Reset',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Customize email notifications sent to customers</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="defaults">Default Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {templates.length === 0 ? (
            <Card className="mt-6">
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No custom templates yet.</p>
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 mt-6">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${template.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Mail className={`h-5 w-5 ${template.active ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.subject}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getTypeLabel(template.type)}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(template.id)}
                        >
                          {template.active ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => editTemplate(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingTemplate(template);
                        setPreviewMode(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="defaults">
          <div className="grid gap-4 mt-6">
            {defaultTemplates.map((template, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.subject}</CardDescription>
                      </div>
                    </div>
                    <Badge>Default</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingTemplate({
                          id: '',
                          name: template.name,
                          subject: template.subject,
                          body: template.body,
                          type: template.type,
                          active: true,
                          createdAt: '',
                          updatedAt: '',
                        });
                        setShowCreateModal(true);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {(editingTemplate && (showCreateModal || !previewMode)) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>{showCreateModal ? 'Create Template' : 'Edit Template'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                >
                  <option value="custom">Custom</option>
                  <option value="ticket_reply">Ticket Reply</option>
                  <option value="ticket_created">Ticket Created</option>
                  <option value="ticket_closed">Ticket Closed</option>
                  <option value="password_reset">Password Reset</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
                <p className="text-xs text-muted-foreground">
                  Use {{variable}} for dynamic content (e.g., {{ticket_id}}, {{customer_name}})
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="body">Body (HTML)</Label>
                <textarea
                  id="body"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  placeholder="Enter email body (HTML)"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button onClick={showCreateModal ? handleCreate : handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingTemplate(null);
                  setShowCreateModal(false);
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {previewMode && editingTemplate && !showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview: {editingTemplate.name}</CardTitle>
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-bold mb-2">Subject: {editingTemplate.subject}</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: editingTemplate.body
                      .replace(/{{ticket_id}}/g, '12345')
                      .replace(/{{subject}}/g, 'Sample Subject')
                      .replace(/{{customer_name}}/g, 'John Doe')
                      .replace(/{{agent_name}}/g, 'Support Agent')
                      .replace(/{{ticket_url}}/g, '#')
                      .replace(/{{message_content}}/g, 'This is a sample message content.')
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
