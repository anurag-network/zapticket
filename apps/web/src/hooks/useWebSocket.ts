'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  organizationId: string;
  onTicketUpdate?: (ticket: any) => void;
  onNewTicket?: (ticket: any) => void;
  onMetricsUpdate?: (metrics: any) => void;
  onNewMessage?: (message: any) => void;
  onAgentStatus?: (status: any) => void;
  onSLAAlert?: (alert: any) => void;
}

export function useWebSocket({
  organizationId,
  onTicketUpdate,
  onNewTicket,
  onMetricsUpdate,
  onNewMessage,
  onAgentStatus,
  onSLAAlert,
}: UseWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    try {
      const ws = new WebSocket(`${wsUrl}?organizationId=${organizationId}`);

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'ticket:update':
              onTicketUpdate?.(data.payload);
              break;
            case 'ticket:new':
              onNewTicket?.(data.payload);
              break;
            case 'metrics:update':
              onMetricsUpdate?.(data.payload);
              break;
            case 'message:new':
              onNewMessage?.(data.payload);
              break;
            case 'agent:status':
              onAgentStatus?.(data.payload);
              break;
            case 'sla:alert':
              onSLAAlert?.(data.payload);
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
      };

      ws.onerror = (err) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', err);
      };

      socketRef.current = ws;
    } catch (err) {
      setError('Failed to connect to WebSocket');
      console.error('WebSocket connection error:', err);
    }
  }, [organizationId, onTicketUpdate, onNewTicket, onMetricsUpdate, onNewMessage, onAgentStatus, onSLAAlert]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const subscribeToTicket = useCallback((ticketId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'subscribe:ticket',
        ticketId,
      }));
    }
  }, []);

  const unsubscribeFromTicket = useCallback((ticketId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'unsubscribe:ticket',
        ticketId,
      }));
    }
  }, []);

  const requestMetrics = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'request:metrics',
        organizationId,
      }));
    }
  }, [organizationId]);

  return {
    connected,
    error,
    subscribeToTicket,
    unsubscribeFromTicket,
    requestMetrics,
    reconnect: connect,
  };
}
