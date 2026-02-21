'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: FormField[];
  active: boolean;
  submissions?: { id: string; createdAt: string; ticket?: { id: string; subject: string; status: string } }[];
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

export default function FormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setForm(data);
      setName(data.name);
      setDescription(data.description || '');
      setFields(data.fields || []);
    } catch (err) {
      console.error(err);
      router.push('/dashboard/settings/forms');
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setFields([
      ...fields,
      { name: `field_${fields.length}`, label: 'New Field', type: 'text', required: false },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, fields }),
      });
      setEditMode(false);
      fetchForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/forms/${form?.slug}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/settings/forms')}>
            Back to Forms
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Form Details</CardTitle>
                  <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Form Name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Form Fields</label>
                        <Button type="button" variant="outline" size="sm" onClick={addField}>
                          + Add Field
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <div className="grid gap-2 md:grid-cols-3 flex-1 mr-2">
                              <Input value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} placeholder="Label" />
                              <select
                                value={field.type}
                                onChange={(e) => updateField(index, { type: e.target.value as any })}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                              >
                                {fieldTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                              </select>
                              <Input value={field.name} onChange={(e) => updateField(index, { name: e.target.value })} placeholder="Name" />
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeField(index)}>X</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold">{form.name}</h3>
                    {form.description && <p className="text-muted-foreground mt-2">{form.description}</p>}
                    <p className="text-sm text-muted-foreground mt-2">Slug: {form.slug}</p>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Fields ({form.fields?.length || 0})</h4>
                      <div className="space-y-1">
                        {form.fields?.map((f, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{f.label}</span>
                            <span className="text-muted-foreground ml-2">({f.type})</span>
                            {f.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions ({form.submissions?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {(!form.submissions || form.submissions.length === 0) ? (
                  <p className="text-muted-foreground text-sm">No submissions yet.</p>
                ) : (
                  <div className="divide-y">
                    {form.submissions.map((sub) => (
                      <div key={sub.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{sub.ticket?.subject || 'No subject'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleString()}</p>
                        </div>
                        {sub.ticket && (
                          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/tickets/${sub.ticket?.id}`)}>
                            View Ticket
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Embed Code</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Add this form to your website:</p>
                <Button onClick={copyEmbedCode} className="w-full">Copy Embed Code</Button>
                <div className="mt-4 p-3 bg-muted rounded text-xs font-mono break-all">
                  {`<iframe src="${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/forms/${form.slug}" .../>`}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(`/forms/${form.slug}`, '_blank')}
                >
                  Open Form Preview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
