'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  description: string | null;
  fields: FormField[];
}

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/submit/${slug}`);
      if (!res.ok) throw new Error('Form not found');
      const data = await res.json();
      setForm(data);
    } catch (err) {
      setError('Form not found or no longer available.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/submit/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to submit form');
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error || 'Form not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your submission has been received. We'll get back to you soon.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && (
            <p className="text-muted-foreground text-sm">{form.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-destructive text-sm">{error}</p>}

            {form.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.name}
                      required={field.required}
                      checked={formData[field.name] || false}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">{field.label}</span>
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
