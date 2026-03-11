'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketIOOptions {
  organizationId: string;
  userId?: string;
  onTicketUpdate?: (ticket: any) => void;
  onNewTicket?: (ticket: any) => void;
  onMetricsUpdate?: (metrics: any) => void;
  onNewMessage?: (message: any) => void;
  onAgentStatus?: (status: any) => void;
  onSLAAlert?: (alert: any) => void;
  onNotification?: (notification: any) => void;
  onCSATUpdate?: (data: any) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  autoConnect?: boolean;
}

export function useSocketIO({
  organizationId,
  userId,
  onTicketUpdate,
  onNewTicket,
  onMetricsUpdate,
  onNewMessage,
  onAgentStatus,
  onSLAAlert,
  onNotification,
  onCSATUpdate,
  onTyping,
  autoConnect = true,
}: UseSocketIOOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    try {
      const socket = io(wsUrl, {
        query: { organizationId, userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setConnected(true);
        setError(null);
        console.log('Socket.IO connected');
        
        socket.emit('join:organization', { organizationId });
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket.IO disconnected');
      });

      socket.on('connect_error', (err) => {
        setError(err.message);
        console.error('Socket.IO connection error:', err);
      });

      socket.on('ticket:update', (data) => onTicketUpdate?.(data));
      socket.on('ticket:new', (data) => onNewTicket?.(data));
      socket.on('ticket:resolved', (data) => onTicketUpdate?.(data));
      socket.on('metrics:update', (data) => onMetricsUpdate?.(data));
      socket.on('message:new', (data) => onNewMessage?.(data));
      socket.on('agent:status', (data) => onAgentStatus?.(data));
      socket.on('sla:alert', (data) => onSLAAlert?.(data));
      socket.on('notification:new', (data) => onNotification?.(data));
      socket.on('csat:update', (data) => onCSATUpdate?.(data));
      socket.on('typing', (data) => onTyping?.(data));

      socketRef.current = socket;
    } catch (err) {
      setError('Failed to connect to Socket.IO');
      console.error('Socket.IO connection error:', err);
    }
  }, [
    organizationId,
    userId,
    onTicketUpdate,
    onNewTicket,
    onMetricsUpdate,
    onNewMessage,
    onAgentStatus,
    onSLAAlert,
    onNotification,
    onCSATUpdate,
    onTyping,
  ]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect, autoConnect]);

  const subscribeToTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('subscribe:ticket', { ticketId });
  }, []);

  const unsubscribeFromTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('unsubscribe:ticket', { ticketId });
  }, []);

  const requestMetrics = useCallback(() => {
    socketRef.current?.emit('request:metrics', { organizationId });
  }, [organizationId]);

  const sendTyping = useCallback((ticketId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { ticketId, isTyping });
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  return {
    connected,
    error,
    socket: socketRef.current,
    subscribeToTicket,
    unsubscribeFromTicket,
    requestMetrics,
    sendTyping,
    disconnect,
    reconnect,
  };
}

export function useTicketSubscription(
  ticketId: string,
  onMessage?: (message: any) => void,
  onTyping?: (data: { userId: string; isTyping: boolean }) => void
) {
  const { subscribeToTicket, unsubscribeFromTicket, sendTyping } = useSocketIO({
    organizationId: '',
    onNewMessage: onMessage,
    onTyping,
  });

  useEffect(() => {
    if (ticketId) {
      subscribeToTicket(ticketId);
    }
    return () => {
      if (ticketId) {
        unsubscribeFromTicket(ticketId);
      }
    };
  }, [ticketId, subscribeToTicket, unsubscribeFromTicket]);

  return { sendTyping };
}
