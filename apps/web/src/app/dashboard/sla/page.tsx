'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@zapticket/ui/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Plus, Edit, Trash2, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@zapticket/ui/components/ui/progress';

interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly: boolean;
  active: boolean;
}

interface SLAStats {
  totalTickets: number;
  totalBreaches: number;
  responseBreaches: number;
  resolutionBreaches: number;
  complianceRate: number;
}

export default function SLASettingsPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'NORMAL',
    responseTimeMinutes: 240,
    resolutionTimeMinutes: 1440,
    businessHoursOnly: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [policiesRes, statsRes] = await Promise.all([
        fetch('/api/sla/policies', { credentials: 'include' }),
        fetch('/api/sla/stats', { credentials: 'include' }),
      ]);

      if (policiesRes.ok) {
        setPolicies(await policiesRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingPolicy
      ? `/api/sla/policies/${editingPolicy.id}`
      : '/api/sla/policies';

    const method = editingPolicy ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowDialog(false);
        setEditingPolicy(null);
        setFormData({
          name: '',
          description: '',
          priority: 'NORMAL',
          responseTimeMinutes: 240,
          resolutionTimeMinutes: 1440,
          businessHoursOnly: false,
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SLA policy?')) return;

    try {
      await fetch(`/api/sla/policies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete policy:', error);
    }
  };

  const openEdit = (policy: SLAPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      priority: policy.priority,
      responseTimeMinutes: policy.responseTimeMinutes,
      resolutionTimeMinutes: policy.resolutionTimeMinutes,
      businessHoursOnly: policy.businessHoursOnly,
    });
    setShowDialog(true);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-500',
      NORMAL: 'bg-blue-500',
      HIGH: 'bg-orange-500',
      URGENT: 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">SLA Policies</h1>
        <p className="text-muted-foreground">Configure Service Level Agreements</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceRate.toFixed(1)}%</div>
              <Progress value={stats.complianceRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Response Breaches</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.responseBreaches}</div>
              <p className="text-xs text-muted-foreground">Response SLA missed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolution Breaches</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.resolutionBreaches}</div>
              <p className="text-xs text-muted-foreground">Resolution SLA missed</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SLA Policies</CardTitle>
              <CardDescription>Define response and resolution times by priority</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPolicy(null);
                  setFormData({
                    name: '',
                    description: '',
                    priority: 'NORMAL',
                    responseTimeMinutes: 240,
                    resolutionTimeMinutes: 1440,
                    businessHoursOnly: false,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New Policy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPolicy ? 'Edit' : 'New'} SLA Policy</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Policy Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Premium Support SLA"
                      required
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Response Time (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.responseTimeMinutes}
                        onChange={(e) =>
                          setFormData({ ...formData, responseTimeMinutes: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Resolution Time (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.resolutionTimeMinutes}
                        onChange={(e) =>
                          setFormData({ ...formData, resolutionTimeMinutes: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Business Hours Only</Label>
                      <p className="text-xs text-muted-foreground">Calculate SLA during business hours only</p>
                    </div>
                    <Switch
                      checked={formData.businessHoursOnly}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, businessHoursOnly: checked })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingPolicy ? 'Update' : 'Create'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SLA policies configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>Business Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(policy.priority)} text-white`}>
                        {policy.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(policy.responseTimeMinutes)}</TableCell>
                    <TableCell>{formatTime(policy.resolutionTimeMinutes)}</TableCell>
                    <TableCell>
                      {policy.businessHoursOnly ? (
                        <Badge variant="outline">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={policy.active ? 'default' : 'secondary'}>
                        {policy.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(policy)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(policy.id)}
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
