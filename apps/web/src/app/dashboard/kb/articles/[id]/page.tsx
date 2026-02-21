'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  views: number;
  category: { id: string; name: string };
  tags: { tag: { id: string; name: string; color: string } }[];
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArticle(data);
    } catch (err) {
      console.error(err);
      router.push('/dashboard/kb');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/articles/${articleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push('/dashboard/kb');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublished = async () => {
    if (!article) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !article.published }),
      });
      fetchArticle();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!article) return null;

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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">{article.category.name}</span>
                {!article.published && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Draft</span>
                )}
                {article.published && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Published</span>
                )}
              </div>
              <h2 className="text-3xl font-bold">{article.title}</h2>
              <p className="text-muted-foreground mt-2">
                By {article.author.name} • {article.views} views • Updated {new Date(article.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTogglePublished}>
                {article.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard/kb/articles/${articleId}/edit`)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex gap-2">
              {article.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: t.tag.color + '20', color: t.tag.color }}
                >
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <Card>
            <CardContent className="py-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">{article.content}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Slug:</span> {article.slug}
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span> {new Date(article.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
