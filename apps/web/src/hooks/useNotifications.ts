'use client';

import { useEffect, useState, useCallback } from 'react';

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return null;

      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      return notification;
    },
    [isSupported, permission]
  );

  const notifyTicketCreated = useCallback(
    (ticketId: string, subject: string) => {
      return notify(`New Ticket #${ticketId.slice(-6)}`, {
        body: subject,
        tag: `ticket-${ticketId}`,
      });
    },
    [notify]
  );

  const notifyTicketAssigned = useCallback(
    (ticketId: string, subject: string, assignee: string) => {
      return notify(`Ticket Assigned to You`, {
        body: `${subject} - Assigned to ${assignee}`,
        tag: `ticket-${ticketId}`,
        requireInteraction: true,
      });
    },
    [notify]
  );

  const notifyTicketEscalated = useCallback(
    (ticketId: string, subject: string) => {
      return notify(`⚠️ Ticket Escalated`, {
        body: subject,
        tag: `escalated-${ticketId}`,
        requireInteraction: true,
      });
    },
    [notify]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
    notifyTicketCreated,
    notifyTicketAssigned,
    notifyTicketEscalated,
  };
}
