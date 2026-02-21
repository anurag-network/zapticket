'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Brief description' },
    { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Describe your issue...' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          fields,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create form');
      }

      const data = await res.json();
      router.push(`/dashboard/settings/forms/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-destructive text-sm">{error}</p>}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Form Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Contact Us, Support Request"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                  />
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
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid gap-3 md:grid-cols-3 flex-1 mr-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Label</label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as any })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                          >
                            {fieldTypes.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Name</label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            className="mt-1"
                            placeholder="field_name"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeField(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Placeholder</label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-sm">Required field</label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading || !name || fields.length === 0}>
                  {loading ? 'Creating...' : 'Create Form'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/settings/forms')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
