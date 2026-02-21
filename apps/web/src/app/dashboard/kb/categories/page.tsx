'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  _count?: { articles: number; subCategories: number };
  parentCategory?: { id: string; name: string } | null;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data || []);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          description: description || undefined,
          icon: icon || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create category');

      setName('');
      setSlug('');
      setDescription('');
      setIcon('');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
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
          <Button variant="outline" onClick={() => router.push('/dashboard/kb')}>
            Back to KB
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Categories</h2>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'New Category'}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Create Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug</label>
                      <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-name" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Icon (emoji)</label>
                      <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving || !name}>
                    {saving ? 'Creating...' : 'Create Category'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No categories yet. Create your first category to organize articles.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                        <div>
                          <h3 className="font-semibold">{cat.name}</h3>
                          {cat.description && (
                            <p className="text-sm text-muted-foreground">{cat.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {cat._count?.articles || 0} articles
                            {cat._count?.subCategories ? ` • ${cat._count.subCategories} sub-categories` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/kb?category=${cat.id}`)}>
                          View Articles
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
