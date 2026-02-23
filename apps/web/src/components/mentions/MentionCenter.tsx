'use client';

import { useState, useEffect } from 'react';
import { Button } from '@zapticket/ui/components/ui/button';
import { Badge } from '@zapticket/ui/components/ui/badge';
import { ScrollArea } from '@zapticket/ui/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@zapticket/ui/components/ui/popover';
import { AtSign, CheckCheck } from 'lucide-react';

interface Mention {
  id: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  mentionedBy: { id: string; name: string | null; email: string; avatarUrl?: string };
  ticket: { id: string; subject: string; status: string; priority: string };
  message: { id: string; content: string; createdAt: string };
}

export function MentionCenter() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentions();
    const interval = setInterval(fetchMentions, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMentions = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [mentionsRes, countRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/mentions?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/mentions/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (mentionsRes.ok) {
        setMentions(await mentionsRes.json());
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (mentionId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/mentions/${mentionId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMentions();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/mentions/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMentions();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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

  const truncate = (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <AtSign className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Mentions</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {mentions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No mentions yet
            </div>
          ) : (
            <div className="divide-y">
              {mentions.map((mention) => (
                <div
                  key={mention.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer ${
                    !mention.read ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => !mention.read && markAsRead(mention.id)}
                >
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {mention.mentionedBy.name?.[0] || mention.mentionedBy.email[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {mention.mentionedBy.name || mention.mentionedBy.email}
                        </p>
                        {!mention.read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        mentioned you in ticket
                      </p>
                      <p className="text-sm font-medium mt-1 truncate">
                        {mention.ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        "{truncate(mention.message.content, 80)}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(mention.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
