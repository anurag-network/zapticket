'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Alert, AlertDescription } from '@zapticket/ui/components/ui/alert';

interface AssignmentRule {
  id: string;
  name: string;
  description?: string;
  strategy: 'ROUND_ROBIN' | 'LEAST_BUSY' | 'RANDOM' | 'SKILLS_BASED';
  active: boolean;
  priority: number;
  teamId?: string;
  team?: { id: string; name: string };
}

interface WorkloadInfo {
  agentId: string;
  agentName: string | null;
  openTickets: number;
  lastAssignedAt: string | null;
}

const strategyLabels: Record<string, string> = {
  ROUND_ROBIN: 'Round Robin',
  LEAST_BUSY: 'Least Busy',
  RANDOM: 'Random',
  SKILLS_BASED: 'Skills Based',
};

export default function AssignmentRulesPage() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [workloads, setWorkloads] = useState<WorkloadInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy: 'ROUND_ROBIN',
    active: true,
    priority: 0,
    teamId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, workloadRes] = await Promise.all([
        fetch('/api/assignment-rules', { credentials: 'include' }),
        fetch('/api/tickets/workload', { credentials: 'include' }),
      ]);
      
      if (rulesRes.ok) {
        setRules(await rulesRes.json());
      }
      if (workloadRes.ok) {
        setWorkloads(await workloadRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingRule 
      ? `/api/assignment-rules/${editingRule.id}`
      : '/api/assignment-rules';
    
    const method = editingRule ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setShowForm(false);
        setEditingRule(null);
        setFormData({ name: '', description: '', strategy: 'ROUND_ROBIN', active: true, priority: 0, teamId: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const res = await fetch(`/api/assignment-rules/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleSyncWorkloads = async () => {
    try {
      await fetch('/api/tickets/workload/sync', {
        method: 'POST',
        credentials: 'include',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to sync workloads:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignment Rules</h1>
          <p className="text-muted-foreground">Configure automatic ticket assignment</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Rule</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit Rule' : 'New Assignment Rule'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="strategy">Assignment Strategy</Label>
                  <Select
                    value={formData.strategy}
                    onValueChange={(value) => setFormData({ ...formData, strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                      <SelectItem value="LEAST_BUSY">Least Busy</SelectItem>
                      <SelectItem value="RANDOM">Random</SelectItem>
                      <SelectItem value="SKILLS_BASED">Skills Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority (higher = first)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Rules</CardTitle>
            <CardDescription>Rules are evaluated in priority order</CardDescription>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <p className="text-muted-foreground">No assignment rules configured</p>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {strategyLabels[rule.strategy]} • Priority: {rule.priority}
                        {rule.team && ` • Team: ${rule.team.name}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRule(rule);
                          setFormData({
                            name: rule.name,
                            description: rule.description || '',
                            strategy: rule.strategy,
                            active: rule.active,
                            priority: rule.priority,
                            teamId: rule.teamId || '',
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agent Workload</CardTitle>
              <CardDescription>Current ticket distribution</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleSyncWorkloads}>
              Sync
            </Button>
          </CardHeader>
          <CardContent>
            {workloads.length === 0 ? (
              <p className="text-muted-foreground">No workload data available</p>
            ) : (
              <div className="space-y-2">
                {workloads.map((w) => (
                  <div key={w.agentId} className="flex items-center justify-between p-3 border rounded">
                    <span>{w.agentName || 'Unknown'}</span>
                    <Badge variant={w.openTickets > 10 ? 'destructive' : w.openTickets > 5 ? 'secondary' : 'default'}>
                      {w.openTickets} tickets
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Conflict Prevention:</strong> Tickets can only be assigned to one agent at a time. 
          When an agent opens a ticket for editing, it&apos;s temporarily locked for 5 minutes to prevent concurrent modifications.
        </AlertDescription>
      </Alert>
    </div>
  );
}
