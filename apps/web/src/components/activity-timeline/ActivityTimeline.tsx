'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { ScrollArea } from '@zapticket/ui/components/ui/scroll-area';
import {
  Ticket,
  ArrowRight,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  FileText,
  GitMerge,
  Clock,
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}

const activityIcons: Record<string, any> = {
  TICKET_CREATED: Ticket,
  STATUS_CHANGED: ArrowRight,
  PRIORITY_CHANGED: AlertCircle,
  ASSIGNED: User,
  UNASSIGNED: User,
  ESCALATED: AlertCircle,
  TAG_ADDED: Tag,
  TAG_REMOVED: Tag,
  MERGED: GitMerge,
  REPLY_ADDED: MessageSquare,
  NOTE_ADDED: FileText,
  CLOSED: CheckCircle,
  RESOLVED: CheckCircle,
};

const activityColors: Record<string, string> = {
  TICKET_CREATED: 'bg-blue-500',
  STATUS_CHANGED: 'bg-yellow-500',
  PRIORITY_CHANGED: 'bg-orange-500',
  ASSIGNED: 'bg-green-500',
  UNASSIGNED: 'bg-gray-500',
  ESCALATED: 'bg-red-500',
  TAG_ADDED: 'bg-purple-500',
  TAG_REMOVED: 'bg-gray-500',
  MERGED: 'bg-indigo-500',
  REPLY_ADDED: 'bg-cyan-500',
  NOTE_ADDED: 'bg-slate-500',
  CLOSED: 'bg-gray-600',
  RESOLVED: 'bg-green-600',
};

interface ActivityTimelineProps {
  ticketId: string;
  limit?: number;
}

export function ActivityTimeline({ ticketId, limit = 50 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [ticketId]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/activity-log/ticket/${ticketId}?limit=${limit}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4 p-4">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.type] || Ticket;
                  const color = activityColors[activity.type] || 'bg-gray-500';

                  return (
                    <div key={activity.id} className="relative pl-10">
                      <div
                        className={`absolute left-2 w-4 h-4 rounded-full ${color} flex items-center justify-center`}
                      >
                        <Icon className="h-2 w-2 text-white" />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {activity.type.replace(/_/g, ' ')}
                              </Badge>
                              {activity.user && (
                                <span className="text-xs text-muted-foreground">
                                  by {activity.user.name || activity.user.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
