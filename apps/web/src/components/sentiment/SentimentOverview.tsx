'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { Progress } from '@zapticket/ui/components/ui/progress';

interface SentimentStats {
  averageScore: number;
  totalAnalyzed: number;
  distribution: {
    VERY_NEGATIVE: number;
    NEGATIVE: number;
    NEUTRAL: number;
    POSITIVE: number;
    VERY_POSITIVE: number;
  };
  trend: string;
}

const sentimentColors: Record<string, string> = {
  VERY_NEGATIVE: 'bg-red-500',
  NEGATIVE: 'bg-orange-500',
  NEUTRAL: 'bg-yellow-500',
  POSITIVE: 'bg-green-500',
  VERY_POSITIVE: 'bg-emerald-500',
};

const sentimentLabels: Record<string, string> = {
  VERY_NEGATIVE: 'Very Negative',
  NEGATIVE: 'Negative',
  NEUTRAL: 'Neutral',
  POSITIVE: 'Positive',
  VERY_POSITIVE: 'Very Positive',
};

export function SentimentOverview() {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/sentiment/stats', { credentials: 'include' });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch sentiment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const avgColor = stats.averageScore >= 0.2 ? 'text-green-500' : stats.averageScore <= -0.2 ? 'text-red-500' : 'text-yellow-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Customer Sentiment</CardTitle>
            <CardDescription>AI-powered sentiment analysis</CardDescription>
          </div>
          <Badge variant={stats.trend === 'positive' ? 'default' : stats.trend === 'negative' ? 'destructive' : 'secondary'}>
            {stats.trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <span className={`text-2xl font-bold ${avgColor}`}>
              {(stats.averageScore * 100).toFixed(0)}%
            </span>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">Distribution ({stats.totalAnalyzed} tickets)</p>
            {Object.entries(stats.distribution).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${sentimentColors[type]}`} />
                <span className="text-xs flex-1">{sentimentLabels[type]}</span>
                <span className="text-xs font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
