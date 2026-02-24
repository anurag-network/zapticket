'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import {
  Clock,
  Users,
  FileText,
  Download,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface TimeReport {
  user?: { id: string; name: string | null; email: string };
  ticket?: { id: string; subject: string };
  totalSeconds: number;
  billableSeconds: number;
  totalHours: number;
  billableHours: number;
  entries: any[];
}

export default function TimeTrackingReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<TimeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<'user' | 'ticket'>('user');

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, groupBy]);

  const fetchReport = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/time-tracking/report?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        setReport(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = groupBy === 'user'
      ? ['User', 'Email', 'Total Hours', 'Billable Hours', 'Entries']
      : ['Ticket ID', 'Subject', 'Total Hours', 'Billable Hours', 'Entries'];

    const rows = report.map((r) => {
      if (groupBy === 'user') {
        return [
          r.user?.name || 'Unknown',
          r.user?.email || '',
          r.totalHours.toFixed(2),
          r.billableHours.toFixed(2),
          r.entries.length,
        ];
      } else {
        return [
          r.ticket?.id || '',
          r.ticket?.subject || '',
          r.totalHours.toFixed(2),
          r.billableHours.toFixed(2),
          r.entries.length,
        ];
      }
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const totalHours = report.reduce((sum, r) => sum + r.totalHours, 0);
  const billableHours = report.reduce((sum, r) => sum + r.billableHours, 0);
  const totalEntries = report.reduce((sum, r) => sum + r.entries.length, 0);

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
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Time Tracking Reports</h2>
          <p className="text-muted-foreground">Analyze time spent on tickets</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'user' | 'ticket')}
              className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="user">By User</option>
              <option value="ticket">By Ticket</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billable Hours</p>
                  <p className="text-2xl font-bold">{billableHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Entries</p>
                  <p className="text-2xl font-bold">{totalEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {groupBy === 'user' ? 'Time by User' : 'Time by Ticket'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : report.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time entries found for this period
              </div>
            ) : (
              <div className="space-y-3">
                {report.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {groupBy === 'user' ? (
                          <Users className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {groupBy === 'user' ? r.user?.name || r.user?.email : r.ticket?.subject}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {r.entries.length} entries • {r.billableHours.toFixed(1)}h billable
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{r.totalHours.toFixed(1)}h</p>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(r.totalHours / (totalHours || 1)) * 100}%`,
                          }}
                        />
                      </div>
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
