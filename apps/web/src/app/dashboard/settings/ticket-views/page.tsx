'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Plus, Pencil, Trash2, Copy, Eye, Star, MoreVertical, GripVertical } from 'lucide-react';

interface TicketView {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  filters: Record<string, any>;
  sortBy: string | null;
  sortOrder: string;
  isDefault: boolean;
  isShared: boolean;
  position: number;
  createdAt: string;
  createdBy: { id: string; name: string | null } | null;
  columns: { id: string; field: string; label: string | null; visible: boolean; position: number }[];
}

export default function TicketViewsPage() {
  const router = useRouter();
  const [views, setViews] = useState<TicketView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingView, setEditingView] = useState<TicketView | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#3b82f6',
    isShared: false,
    filters: {} as Record<string, any>,
  });

  const availableFilters = [
    { key: 'status', label: 'Status', type: 'multiselect', options: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'] },
    { key: 'priority', label: 'Priority', type: 'multiselect', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
    { key: 'type', label: 'Type', type: 'multiselect', options: ['BUG', 'FEATURE', 'QUESTION', 'INCIDENT', 'TASK', 'FEEDBACK', 'OTHER'] },
    { key: 'unassigned', label: 'Unassigned Only', type: 'boolean' },
    { key: 'isOverdue', label: 'Overdue Only', type: 'boolean' },
    { key: 'isEscalated', label: 'Escalated Only', type: 'boolean' },
    { key: 'excludeMerged', label: 'Exclude Merged', type: 'boolean' },
  ];

  useEffect(() => {
    fetchViews();
  }, []);

  const fetchViews = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setViews(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch views:', error);
    } finally {
      setLoading(false);
    }
  };

  const createView = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ name: '', icon: '', color: '#3b82f6', isShared: false, filters: {} });
        fetchViews();
      }
    } catch (error) {
      console.error('Failed to create view:', error);
    }
  };

  const updateView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingView) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views/${editingView.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      setEditingView(null);
      setFormData({ name: '', icon: '', color: '#3b82f6', isShared: false, filters: {} });
      fetchViews();
    } catch (error) {
      console.error('Failed to update view:', error);
    }
  };

  const deleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this view?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views/${viewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchViews();
    } catch (error) {
      console.error('Failed to delete view:', error);
    }
  };

  const duplicateView = async (viewId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views/${viewId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchViews();
    } catch (error) {
      console.error('Failed to duplicate view:', error);
    }
  };

  const setAsDefault = async (viewId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ticket-views/${viewId}/default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchViews();
    } catch (error) {
      console.error('Failed to set as default:', error);
    }
  };

  const handleEdit = (view: TicketView) => {
    setEditingView(view);
    setFormData({
      name: view.name,
      icon: view.icon || '',
      color: view.color || '#3b82f6',
      isShared: view.isShared,
      filters: view.filters || {},
    });
    setShowCreateForm(false);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
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
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Ticket Views</h2>
            <p className="text-muted-foreground">Create and manage custom ticket views</p>
          </div>
          <Button onClick={() => { setShowCreateForm(true); setEditingView(null); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create View
          </Button>
        </div>

        {(showCreateForm || editingView) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingView ? 'Edit View' : 'Create New View'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingView ? updateView : createView} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., My Open Tickets"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Icon (emoji)</label>
                      <Input
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="📋"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isShared"
                    checked={formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isShared" className="text-sm">Share with team</label>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filters</label>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded bg-muted/30">
                    {availableFilters.map((filter) => (
                      <div key={filter.key}>
                        <label className="text-xs font-medium">{filter.label}</label>
                        {filter.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={!!formData.filters[filter.key]}
                            onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                            className="ml-2"
                          />
                        ) : filter.type === 'multiselect' ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {filter.options?.map((opt) => (
                              <label key={opt} className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={formData.filters[filter.key]?.includes(opt)}
                                  onChange={(e) => {
                                    const current = formData.filters[filter.key] || [];
                                    if (e.target.checked) {
                                      handleFilterChange(filter.key, [...current, opt]);
                                    } else {
                                      handleFilterChange(filter.key, current.filter((v: string) => v !== opt));
                                    }
                                  }}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingView ? 'Update View' : 'Create View'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingView(null);
                      setFormData({ name: '', icon: '', color: '#3b82f6', isShared: false, filters: {} });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {views.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No ticket views created yet. Click "Create View" to get started.
              </CardContent>
            </Card>
          ) : (
            views.map((view) => (
              <Card key={view.id} className={view.isDefault ? 'border-primary' : ''}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span
                      className="text-xl"
                      style={{ color: view.color || undefined }}
                    >
                      {view.icon || '📋'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{view.name}</span>
                        {view.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {view.isShared && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">Shared</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(view.filters || {}).filter(k => view.filters[k]?.length > 0 || view.filters[k] === true).length} filters
                        {' • '}
                        {view.columns?.length || 0} columns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard?tickets&view=${view.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(view)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateView(view.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!view.isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => setAsDefault(view.id)}>
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteView(view.id)}
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
