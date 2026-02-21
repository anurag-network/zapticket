'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Progress } from '@zapticket/ui/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@zapticket/ui/components/ui/table';
import { Alert, AlertDescription } from '@zapticket/ui/components/ui/alert';
import { Heart, AlertTriangle, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthStats {
  totalCustomers: number;
  averageScore: number;
  distribution: {
    healthy: number;
    good: number;
    neutral: number;
    at_risk: number;
    critical: number;
  };
  atRiskCount: number;
}

interface Customer {
  id: string;
  email: string;
  name: string | null;
  healthScore: number;
  healthStatus: string;
  totalTickets: number;
  lastContactAt: string | null;
}

const statusColors: Record<string, string> = {
  healthy: 'bg-green-500',
  good: 'bg-blue-500',
  neutral: 'bg-yellow-500',
  at_risk: 'bg-orange-500',
  critical: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  healthy: 'Healthy',
  good: 'Good',
  neutral: 'Neutral',
  at_risk: 'At Risk',
  critical: 'Critical',
};

export default function CustomerHealthPage() {
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, atRiskRes] = await Promise.all([
        fetch('/api/customer-health/stats', { credentials: 'include' }),
        fetch('/api/customer-health/at-risk', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (atRiskRes.ok) {
        setAtRiskCustomers(await atRiskRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Customer Health</h1>
        <p className="text-muted-foreground">Monitor customer satisfaction and identify at-risk accounts</p>
      </div>

      {stats && stats.atRiskCount > 0 && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-800">
            <strong>{stats.atRiskCount} customers</strong> are at risk. Review and take action to prevent churn.
          </AlertDescription>
        </Alert>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
              <Progress value={stats.averageScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.atRiskCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.distribution.healthy + stats.distribution.good}
              </div>
              <p className="text-xs text-muted-foreground">Doing well</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Distribution</CardTitle>
            <CardDescription>Customer segments by health status</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                {Object.entries(stats.distribution).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                    <span className="flex-1">{statusLabels[status]}</span>
                    <span className="font-medium">{count}</span>
                    <div className="w-32">
                      <Progress
                        value={stats.totalCustomers > 0 ? (count / stats.totalCustomers) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              At Risk Customers
            </CardTitle>
            <CardDescription>Customers that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskCustomers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No at-risk customers</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Last Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskCustomers.slice(0, 10).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name || customer.email}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[customer.healthStatus]} text-white`}
                        >
                          {customer.healthScore.toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.totalTickets}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.lastContactAt
                          ? new Date(customer.lastContactAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
