'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Avatar, AvatarFallback } from '@zapticket/ui';

interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string;
  role: string;
  teamId?: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  AGENT: 'Agent',
  MEMBER: 'Member',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  AGENT: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-gray-100 text-gray-800',
};

export default function UsersSettingsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data || []);

      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUserId(me.id);
        setCurrentUserRole(me.role);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${roleLabels[newRole]}?`)) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to update role');
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this user from the organization?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/users/${userId}/organization`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const canManageUser = (user: User) => {
    if (!currentUserRole) return false;
    if (currentUserRole === 'OWNER') return user.role !== 'OWNER';
    if (currentUserRole === 'ADMIN') return user.role === 'MEMBER' || user.role === 'AGENT';
    return false;
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
        <h2 className="text-2xl font-semibold mb-6">Users</h2>

        <Card>
          <CardContent className="py-4">
            {users.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <div key={user.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {canManageUser(user) ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-3 py-1 text-sm rounded-full border-0 ${roleColors[user.role]}`}
                        >
                          <option value="MEMBER">Member</option>
                          <option value="AGENT">Agent</option>
                          {currentUserRole === 'OWNER' && <option value="ADMIN">Admin</option>}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-sm rounded-full ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      )}

                      {canManageUser(user) && user.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
