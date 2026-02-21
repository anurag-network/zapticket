'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '@zapticket/ui';

interface Form {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  _count?: { submissions: number };
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setForms(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchForms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/forms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !active }),
      });
      fetchForms();
    } catch (err) {
      console.error(err);
    }
  };

  const copyEmbedCode = (slug: string) => {
    const embedCode = `<iframe src="${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/forms/${slug}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
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
          <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
            Back to Settings
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Forms</h2>
          <Link href="/dashboard/settings/forms/new">
            <Button>Create Form</Button>
          </Link>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No forms yet. Create your first form to collect support requests.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/settings/forms/${form.id}`} className="font-semibold hover:underline">
                          {form.name}
                        </Link>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${form.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {form.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{form._count?.submissions || 0} submissions</span>
                        <span>Slug: {form.slug}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyEmbedCode(form.slug)}>
                        Copy Embed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(form.id, form.active)}
                      >
                        {form.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/settings/forms/${form.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(form.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
