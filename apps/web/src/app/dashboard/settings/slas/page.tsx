'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Badge, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@zapticket/ui';
import { 
  Clock, Plus, Save, Trash2, RefreshCw, ToggleLeft, ToggleRight, Shield, AlertTriangle, CheckCircle
} from 'lucide-react';

interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  firstResponseTime: number;
  resolutionTime: number;
  priority: string;
  isDefault: boolean;
  businessHours: boolean;
  workStartTime?: string;
  workEndTime?: string;
  timezone?: string;
  notifyBefore?: number;
  notifyEscalation: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function SLAPoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/sla-policies`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPolicies(await res.json() || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editingPolicy) return;
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    const url = editingPolicy.id ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sla-policies/${editingPolicy.id}` : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sla-policies`;
    const method = editingPolicy.id ? 'PATCH' : 'POST';
    try {
      await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editingPolicy) });
      fetchPolicies();
      setEditingPolicy(null);
      setShowModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SLA policy?')) return;
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sla-policies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchPolicies();
  };

  const openCreateModal = () => {
    setEditingPolicy({ id: '', name: '', description: '', firstResponseTime: 60, resolutionTime: 240, priority: 'HIGH', isDefault: false, businessHours: false, notifyEscalation: true, isActive: true, createdAt: '' });
    setShowModal(true);
  };

  const formatTime = (minutes: number) => minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60 > 0 ? minutes%60 + 'm' : ''}`;

  const getPriorityColor = (p: string) => ({ URGENT: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800', NORMAL: 'bg-blue-100 text-blue-800', LOW: 'bg-gray-100 text-gray-800' }[p] || 'bg-gray-100');

  if (loading) return <div className="flex items-center justify-center h-screen"><RefreshCw className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8" />SLA Policies</h1><p className="text-muted-foreground">Manage service level agreements</p></div>
        <Button onClick={openCreateModal}><Plus className="h-4 w-4 mr-2" />New Policy</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="flex flex-row items-center"><CardTitle className="text-sm">Active</CardTitle><CheckCircle className="h-4 w-4 ml-auto text-green-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{policies.filter(p=>p.isActive).length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center"><CardTitle className="text-sm">Default</CardTitle><Clock className="h-4 w-4 ml-auto text-blue-500"/></CardHeader><CardContent><div className="text-lg font-bold">{policies.find(p=>p.isDefault)?.name || 'None'}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center"><CardTitle className="text-sm">Priorities</CardTitle><AlertTriangle className="h-4 w-4 ml-auto text-orange-500"/></CardHeader><CardContent><div className="text-2xl font-bold">{new Set(policies.map(p=>p.priority)).size}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>SLA Policies</CardTitle></CardHeader>
        <CardContent>
          {policies.length === 0 ? <p className="text-center py-8 text-muted-foreground">No policies. <Button variant="link" onClick={openCreateModal}>Create one</Button></p> : (
            <div className="grid gap-4">
              {policies.map(policy => (
                <div key={policy.id} className={`flex items-center justify-between p-4 border rounded-lg ${!policy.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${policy.isActive ? 'bg-green-100' : 'bg-gray-100'}`}><Clock className={`h-5 w-5 ${policy.isActive ? 'text-green-600' : 'text-gray-500'}`} /></div>
                    <div><p className="font-medium flex items-center gap-2">{policy.name}{policy.isDefault && <Badge className="text-xs">Default</Badge>}</p><p className="text-sm text-muted-foreground">{policy.description}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getPriorityColor(policy.priority)}>{policy.priority}</Badge>
                    <span className="text-sm">{formatTime(policy.firstResponseTime)} / {formatTime(policy.resolutionTime)}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingPolicy(policy); setShowModal(true); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(policy.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && editingPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <CardHeader><CardTitle>{editingPolicy.id ? 'Edit' : 'Create'} Policy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={editingPolicy.name} onChange={e=>setEditingPolicy({...editingPolicy, name:e.target.value})} /></div>
              <div className="grid gap-2"><Label>Description</Label><Input value={editingPolicy.description||''} onChange={e=>setEditingPolicy({...editingPolicy, description:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Priority</Label><select className="h-10 border rounded px-3" value={editingPolicy.priority} onChange={e=>setEditingPolicy({...editingPolicy, priority:e.target.value})}><option>URGENT</option><option>HIGH</option><option>NORMAL</option><option>LOW</option></select></div>
                <div className="grid gap-2"><Label>Timezone</Label><Input value={editingPolicy.timezone||'UTC'} onChange={e=>setEditingPolicy({...editingPolicy, timezone:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>First Response (min)</Label><Input type="number" value={editingPolicy.firstResponseTime} onChange={e=>setEditingPolicy({...editingPolicy, firstResponseTime:+e.target.value})} /></div>
                <div className="grid gap-2"><Label>Resolution (min)</Label><Input type="number" value={editingPolicy.resolutionTime} onChange={e=>setEditingPolicy({...editingPolicy, resolutionTime:+e.target.value})} /></div>
              </div>
              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2"><Switch checked={editingPolicy.isDefault} onCheckedChange={c=>setEditingPolicy({...editingPolicy, isDefault:c})} /><Label>Default</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editingPolicy.businessHours} onCheckedChange={c=>setEditingPolicy({...editingPolicy, businessHours:c})} /><Label>Business Hours</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editingPolicy.notifyEscalation} onCheckedChange={c=>setEditingPolicy({...editingPolicy, notifyEscalation:c})} /><Label>Escalation</Label></div>
              </div>
              <div className="flex gap-2 pt-4"><Button onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button><Button variant="outline" onClick={()=>{setEditingPolicy(null);setShowModal(false);}}>Cancel</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
