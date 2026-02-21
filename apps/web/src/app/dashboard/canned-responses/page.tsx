'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Textarea } from '@zapticket/ui/components/ui/textarea';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@zapticket/ui/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui/components/ui/tabs';
import { Plus, Search, Copy, Edit, Trash2, MessageSquare } from 'lucide-react';

interface CannedResponse {
  id: string;
  name: string;
  content: string;
  category?: string;
  shortcuts: string[];
  usageCount: number;
}

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    shortcuts: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [responsesRes, categoriesRes] = await Promise.all([
        fetch('/api/canned-responses', { credentials: 'include' }),
        fetch('/api/canned-responses/categories', { credentials: 'include' }),
      ]);

      if (responsesRes.ok) {
        setResponses(await responsesRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const shortcuts = formData.shortcuts
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);

    const url = editingResponse
      ? `/api/canned-responses/${editingResponse.id}`
      : '/api/canned-responses';

    const method = editingResponse ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          content: formData.content,
          category: formData.category || null,
          shortcuts,
        }),
      });

      if (res.ok) {
        setShowDialog(false);
        setEditingResponse(null);
        setFormData({ name: '', content: '', category: '', shortcuts: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      await fetch(`/api/canned-responses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    await fetch(`/api/canned-responses/${id}/use`, {
      method: 'POST',
      credentials: 'include',
    });
    fetchData();
  };

  const openEdit = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      name: response.name,
      content: response.content,
      category: response.category || '',
      shortcuts: response.shortcuts.join(', '),
    });
    setShowDialog(true);
  };

  const filteredResponses = responses.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Canned Responses</h1>
          <p className="text-muted-foreground">Quick reply templates for faster responses</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingResponse(null);
              setFormData({ name: '', content: '', category: '', shortcuts: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" /> New Response
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingResponse ? 'Edit' : 'New'} Canned Response</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Greeting, Refund Policy"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., General, Billing, Technical"
                />
              </div>
              <div>
                <Label htmlFor="content">Response Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Use {{customer_name}}, {{ticket_id}} for variables"
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shortcuts">Shortcuts (comma-separated)</Label>
                <Input
                  id="shortcuts"
                  value={formData.shortcuts}
                  onChange={(e) => setFormData({ ...formData, shortcuts: e.target.value })}
                  placeholder="e.g., /greeting, /hello"
                />
              </div>
              <DialogFooter>
                <Button type="submit">{editingResponse ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No canned responses found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Shortcuts</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      {r.category && <Badge variant="secondary">{r.category}</Badge>}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {r.content}
                    </TableCell>
                    <TableCell>
                      {r.shortcuts.map((s) => (
                        <code key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded mr-1">
                          {s}
                        </code>
                      ))}
                    </TableCell>
                    <TableCell>{r.usageCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(r.content, r.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(r)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
