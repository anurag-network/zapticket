'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: string;
  required: boolean;
  description: string | null;
  placeholder: string | null;
  defaultValue: string | null;
  options: Record<string, any> | null;
  validation: Record<string, any> | null;
  position: number;
  active: boolean;
  createdAt: string;
}

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text', description: 'Single line text' },
  { value: 'TEXTAREA', label: 'Text Area', description: 'Multi-line text' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric value' },
  { value: 'EMAIL', label: 'Email', description: 'Email address' },
  { value: 'PHONE', label: 'Phone', description: 'Phone number' },
  { value: 'URL', label: 'URL', description: 'Web address' },
  { value: 'DATE', label: 'Date', description: 'Date picker' },
  { value: 'DATETIME', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'SELECT', label: 'Dropdown', description: 'Single select dropdown' },
  { value: 'MULTI_SELECT', label: 'Multi-Select', description: 'Multiple select dropdown' },
  { value: 'CHECKBOX', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'RADIO', label: 'Radio Buttons', description: 'Single choice from options' },
  { value: 'USER', label: 'User', description: 'Select a user' },
  { value: 'TEAM', label: 'Team', description: 'Select a team' },
];

export default function CustomFieldsPage() {
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    type: 'TEXT',
    required: false,
    description: '',
    placeholder: '',
    defaultValue: '',
    choices: '',
    min: '',
    max: '',
    minLength: '',
    maxLength: '',
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFields(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      type: 'TEXT',
      required: false,
      description: '',
      placeholder: '',
      defaultValue: '',
      choices: '',
      min: '',
      max: '',
      minLength: '',
      maxLength: '',
    });
    setShowCreateForm(false);
    setEditingField(null);
  };

  const createField = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const options: Record<string, any> = {};
    const validation: Record<string, any> = {};

    if (['SELECT', 'MULTI_SELECT', 'RADIO'].includes(formData.type) && formData.choices) {
      options.choices = formData.choices.split('\n').map(c => c.trim()).filter(Boolean);
    }
    if (formData.min !== '') validation.min = Number(formData.min);
    if (formData.max !== '') validation.max = Number(formData.max);
    if (formData.minLength !== '') validation.minLength = Number(formData.minLength);
    if (formData.maxLength !== '') validation.maxLength = Number(formData.maxLength);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          key: formData.key.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          type: formData.type,
          required: formData.required,
          description: formData.description || undefined,
          placeholder: formData.placeholder || undefined,
          defaultValue: formData.defaultValue || undefined,
          options: Object.keys(options).length > 0 ? options : undefined,
          validation: Object.keys(validation).length > 0 ? validation : undefined,
        }),
      });
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Failed to create field:', error);
    }
  };

  const updateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const options: Record<string, any> = {};
    const validation: Record<string, any> = {};

    if (['SELECT', 'MULTI_SELECT', 'RADIO'].includes(formData.type) && formData.choices) {
      options.choices = formData.choices.split('\n').map(c => c.trim()).filter(Boolean);
    }
    if (formData.min !== '') validation.min = Number(formData.min);
    if (formData.max !== '') validation.max = Number(formData.max);
    if (formData.minLength !== '') validation.minLength = Number(formData.minLength);
    if (formData.maxLength !== '') validation.maxLength = Number(formData.maxLength);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields/${editingField.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          required: formData.required,
          description: formData.description || undefined,
          placeholder: formData.placeholder || undefined,
          defaultValue: formData.defaultValue || undefined,
          options: Object.keys(options).length > 0 ? options : undefined,
          validation: Object.keys(validation).length > 0 ? validation : undefined,
        }),
      });
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  const toggleActive = async (field: CustomField) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields/${field.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !field.active }),
      });
      fetchFields();
    } catch (error) {
      console.error('Failed to toggle field:', error);
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field? All values will be lost.')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/custom-fields/${fieldId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFields();
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      key: field.key,
      type: field.type,
      required: field.required,
      description: field.description || '',
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || '',
      choices: field.options?.choices?.join('\n') || '',
      min: field.validation?.min?.toString() || '',
      max: field.validation?.max?.toString() || '',
      minLength: field.validation?.minLength?.toString() || '',
      maxLength: field.validation?.maxLength?.toString() || '',
    });
    setShowCreateForm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const needsChoices = ['SELECT', 'MULTI_SELECT', 'RADIO'].includes(formData.type);
  const needsNumberValidation = ['NUMBER'].includes(formData.type);
  const needsTextValidation = ['TEXT', 'TEXTAREA'].includes(formData.type);

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
            <h2 className="text-2xl font-bold">Custom Fields</h2>
            <p className="text-muted-foreground">Add custom fields to tickets</p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingField ? 'Edit Field' : 'Create Custom Field'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingField ? updateField : createField} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Field Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Customer Priority"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Field Key *</label>
                    <Input
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="e.g., customer_priority"
                      disabled={!!editingField}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, underscores only)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Field Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                      disabled={!!editingField}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label} - {t.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Placeholder</label>
                    <Input
                      value={formData.placeholder}
                      onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Help text for this field"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Default Value</label>
                  <Input
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    placeholder="Default value for this field"
                  />
                </div>

                {needsChoices && (
                  <div>
                    <label className="text-sm font-medium">Choices (one per line)</label>
                    <textarea
                      value={formData.choices}
                      onChange={(e) => setFormData({ ...formData, choices: e.target.value })}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="w-full h-24 rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {needsNumberValidation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Min Value</label>
                      <Input
                        type="number"
                        value={formData.min}
                        onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Value</label>
                      <Input
                        type="number"
                        value={formData.max}
                        onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                )}

                {needsTextValidation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Min Length</label>
                      <Input
                        type="number"
                        value={formData.minLength}
                        onChange={(e) => setFormData({ ...formData, minLength: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Length</label>
                      <Input
                        type="number"
                        value={formData.maxLength}
                        onChange={(e) => setFormData({ ...formData, maxLength: e.target.value })}
                        placeholder="500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="required" className="text-sm">Required field</label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingField ? 'Update Field' : 'Create Field'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No custom fields created yet. Click "Add Field" to get started.
              </CardContent>
            </Card>
          ) : (
            fields.map((field) => (
              <Card key={field.id} className={field.active ? '' : 'opacity-60'}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.name}</span>
                        {field.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Required</span>
                        )}
                        {!field.active && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <code className="bg-muted px-1 rounded">{field.key}</code>
                        {' • '}
                        {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                        {field.description && ` • ${field.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(field)}>
                      {field.active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(field)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
