'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@zapticket/ui';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  views: number;
  createdAt: string;
  category: { id: string; name: string };
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/articles${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const articlesData = await articlesRes.json();
      const categoriesData = await categoriesRes.json();
      
      setArticles(articlesData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/knowledge-base/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
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
          <div className="flex gap-3">
            <Link href="/dashboard/kb/categories">
              <Button variant="outline">Categories</Button>
            </Link>
            <Link href="/dashboard/kb/articles/new">
              <Button>New Article</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1"
              />
              <Button type="submit">Search</Button>
              {searchResults && (
                <Button type="button" variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Search Results ({searchResults.length})</h3>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground">No results found.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result: any) => (
                  <Link key={result.id} href={`/dashboard/kb/articles/${result.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-3">
                        <h4 className="font-medium">{result.title}</h4>
                        {result.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.excerpt}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {result.categoryName && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{result.categoryName}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!searchResults && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      All Articles
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between ${selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs opacity-70">{cat._count?.articles || 0}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Articles List */}
            <div className="lg:col-span-3">
              {articles.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No articles yet. Create your first article to get started.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Link key={article.id} href={`/dashboard/kb/articles/${article.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{article.title}</h3>
                                {!article.published && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Draft</span>
                                )}
                              </div>
                              {article.excerpt && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.excerpt}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground">{article.category.name}</span>
                                <span className="text-xs text-muted-foreground">{article.views} views</span>
                                {article.tags.slice(0, 3).map((t) => (
                                  <span key={t.tag.id} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: t.tag.color + '20', color: t.tag.color }}>
                                    {t.tag.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
