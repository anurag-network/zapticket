'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Button } from '@zapticket/ui/components/ui/button';
import { Input } from '@zapticket/ui/components/ui/input';
import { Label } from '@zapticket/ui/components/ui/label';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Switch } from '@zapticket/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@zapticket/ui/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@zapticket/ui/components/ui/dialog';
import { Plus, Play, Pause, Trash2, Save, ArrowRight, Zap, GitBranch, Settings } from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  data: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const nodeTypes = {
  trigger: { label: 'Trigger', icon: Zap, color: 'bg-yellow-500' },
  condition: { label: 'Condition', icon: GitBranch, color: 'bg-blue-500' },
  action: { label: 'Action', icon: Settings, color: 'bg-green-500' },
};

const triggerTypes = [
  { value: 'ticket_created', label: 'Ticket Created' },
  { value: 'ticket_updated', label: 'Ticket Updated' },
  { value: 'ticket_assigned', label: 'Ticket Assigned' },
  { value: 'message_added', label: 'Message Added' },
  { value: 'sla_warning', label: 'SLA Warning' },
  { value: 'scheduled', label: 'Scheduled' },
];

const conditionTypes = [
  { value: 'priority', label: 'Priority Is' },
  { value: 'status', label: 'Status Is' },
  { value: 'has_tag', label: 'Has Tag' },
  { value: 'time_elapsed', label: 'Time Elapsed (hours)' },
];

const actionTypes = [
  { value: 'update_status', label: 'Update Status' },
  { value: 'update_priority', label: 'Update Priority' },
  { value: 'assign_agent', label: 'Assign Agent' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'escalate', label: 'Escalate Ticket' },
  { value: 'send_webhook', label: 'Send Webhook' },
  { value: 'add_note', label: 'Add Internal Note' },
];

export default function VisualWorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [nodeType, setNodeType] = useState<'trigger' | 'condition' | 'action'>('trigger');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/visual-workflows', { credentials: 'include' });
      if (res.ok) {
        setWorkflows(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: 'new',
      name: 'New Workflow',
      description: '',
      triggerType: 'ticket_created',
      active: true,
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          data: { triggerType: 'ticket_created' },
          position: { x: 250, y: 50 },
        },
      ],
      edges: [],
    };
    setSelectedWorkflow(newWorkflow);
  };

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;
    setSaving(true);

    try {
      const url = selectedWorkflow.id === 'new'
        ? '/api/visual-workflows'
        : `/api/visual-workflows/${selectedWorkflow.id}`;

      const method = selectedWorkflow.id === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(selectedWorkflow),
      });

      if (res.ok) {
        const saved = await res.json();
        setSelectedWorkflow(saved);
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await fetch(`/api/visual-workflows/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSelectedWorkflow(null);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const addNode = (type: 'trigger' | 'condition' | 'action') => {
    if (!selectedWorkflow) return;

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      data: type === 'trigger' 
        ? { triggerType: selectedWorkflow.triggerType }
        : type === 'condition'
        ? { conditionType: 'priority', value: '' }
        : { actionType: 'update_status', status: 'IN_PROGRESS' },
      position: {
        x: 250,
        y: (selectedWorkflow.nodes.length + 1) * 100 + 50,
      },
    };

    const lastNode = selectedWorkflow.nodes[selectedWorkflow.nodes.length - 1];
    const newEdge: WorkflowEdge | undefined = lastNode
      ? {
          id: `edge-${Date.now()}`,
          source: lastNode.id,
          target: newNode.id,
        }
      : undefined;

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
      edges: newEdge ? [...selectedWorkflow.edges, newEdge] : selectedWorkflow.edges,
    });
    setShowNodeDialog(false);
  };

  const toggleWorkflowActive = async () => {
    if (!selectedWorkflow || selectedWorkflow.id === 'new') return;

    await fetch(`/api/visual-workflows/${selectedWorkflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !selectedWorkflow.active }),
    });

    setSelectedWorkflow({
      ...selectedWorkflow,
      active: !selectedWorkflow.active,
    });
    fetchWorkflows();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 h-screen flex">
      <div className="w-72 border-r pr-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Workflows</h2>
          <Button size="sm" onClick={createNewWorkflow}>
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        <div className="space-y-2 flex-1 overflow-auto">
          {workflows.map((w) => (
            <div
              key={w.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedWorkflow?.id === w.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedWorkflow(w)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{w.name}</span>
                <Badge variant={w.active ? 'default' : 'secondary'}>
                  {w.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {w.triggerType.replace('_', ' ')} • {w.nodes.length} nodes
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <>
            <div className="flex justify-between items-center mb-4 p-4 border-b">
              <div className="flex items-center gap-4">
                <Input
                  value={selectedWorkflow.name}
                  onChange={(e) =>
                    setSelectedWorkflow({ ...selectedWorkflow, name: e.target.value })
                  }
                  className="font-semibold text-lg w-64"
                />
                <Select
                  value={selectedWorkflow.triggerType}
                  onValueChange={(value) =>
                    setSelectedWorkflow({ ...selectedWorkflow, triggerType: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Switch
                    checked={selectedWorkflow.active}
                    onCheckedChange={toggleWorkflowActive}
                  />
                  <Label>Active</Label>
                </div>
                <Button variant="outline" onClick={() => deleteWorkflow(selectedWorkflow.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={saveWorkflow} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-muted/30 relative overflow-auto">
              <div className="p-8 min-h-full">
                {selectedWorkflow.nodes.map((node, index) => {
                  const NodeIcon = nodeTypes[node.type].icon;
                  const nodeColor = nodeTypes[node.type].color;

                  return (
                    <div key={node.id} className="flex flex-col items-center mb-4">
                      <Card className="w-80">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${nodeColor} flex items-center justify-center`}>
                              <NodeIcon className="h-3 w-3 text-white" />
                            </div>
                            {nodeTypes[node.type].label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <NodeConfig
                            type={node.type}
                            data={node.data}
                            onChange={(data) => {
                              const updatedNodes = selectedWorkflow.nodes.map((n) =>
                                n.id === node.id ? { ...n, data } : n
                              );
                              setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes });
                            }}
                          />
                        </CardContent>
                      </Card>
                      {index < selectedWorkflow.nodes.length - 1 && (
                        <div className="h-8 flex items-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}

                <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" /> Add Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Node</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {(Object.keys(nodeTypes) as Array<keyof typeof nodeTypes>).map((type) => {
                        const NodeIcon = nodeTypes[type].icon;
                        return (
                          <Button
                            key={type}
                            variant="outline"
                            className="h-24 flex-col"
                            onClick={() => addNode(type)}
                          >
                            <NodeIcon className="h-6 w-6 mb-2" />
                            {nodeTypes[type].label}
                          </Button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a workflow or create a new one</p>
              <Button className="mt-4" onClick={createNewWorkflow}>
                Create Workflow
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeConfig({
  type,
  data,
  onChange,
}: {
  type: string;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}) {
  if (type === 'trigger') {
    return (
      <Select
        value={data.triggerType || 'ticket_created'}
        onValueChange={(value) => onChange({ ...data, triggerType: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {triggerTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === 'condition') {
    return (
      <div className="space-y-2">
        <Select
          value={data.conditionType || 'priority'}
          onValueChange={(value) => onChange({ ...data, conditionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conditionTypes.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.conditionType === 'priority' && (
          <Select
            value={data.value || 'NORMAL'}
            onValueChange={(value) => onChange({ ...data, value })}
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
        )}
        {data.conditionType === 'status' && (
          <Select
            value={data.value || 'OPEN'}
            onValueChange={(value) => onChange({ ...data, value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ESCALATED">Escalated</SelectItem>
            </SelectContent>
          </Select>
        )}
        {data.conditionType === 'time_elapsed' && (
          <Input
            type="number"
            value={data.hours || 24}
            onChange={(e) => onChange({ ...data, hours: parseInt(e.target.value) })}
            placeholder="Hours"
          />
        )}
      </div>
    );
  }

  if (type === 'action') {
    return (
      <div className="space-y-2">
        <Select
          value={data.actionType || 'update_status'}
          onValueChange={(value) => onChange({ ...data, actionType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.actionType === 'update_status' && (
          <Select
            value={data.status || 'IN_PROGRESS'}
            onValueChange={(value) => onChange({ ...data, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_ON_CUSTOMER">Waiting on Customer</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
        {data.actionType === 'update_priority' && (
          <Select
            value={data.priority || 'HIGH'}
            onValueChange={(value) => onChange({ ...data, priority: value })}
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
        )}
        {data.actionType === 'escalate' && (
          <Input
            value={data.reason || ''}
            onChange={(e) => onChange({ ...data, reason: e.target.value })}
            placeholder="Escalation reason"
          />
        )}
        {data.actionType === 'add_note' && (
          <Input
            value={data.noteContent || ''}
            onChange={(e) => onChange({ ...data, noteContent: e.target.value })}
            placeholder="Note content"
          />
        )}
        {data.actionType === 'send_webhook' && (
          <Input
            value={data.webhookUrl || ''}
            onChange={(e) => onChange({ ...data, webhookUrl: e.target.value })}
            placeholder="Webhook URL"
          />
        )}
      </div>
    );
  }

  return null;
}
