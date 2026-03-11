import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinOrganization: (organizationId: string) => void;
  subscribeToTicket: (ticketId: string) => void;
  unsubscribeFromTicket: (ticketId: string) => void;
  onTicketUpdate: (callback: (ticket: any) => void) => void;
  onNewTicket: (callback: (ticket: any) => void) => void;
  onMetricsUpdate: (callback: (metrics: any) => void) => void;
  onNewMessage: (callback: (message: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.organizationId) {
      return;
    }

    const wsUrl = Constants.expoConfig?.extra?.wsUrl || 'http://localhost:3001';
    
    const newSocket = io(wsUrl, {
      query: { 
        organizationId: user.organizationId,
        userId: user.id,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected');
      newSocket.emit('join:organization', { organizationId: user.organizationId });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.organizationId]);

  const joinOrganization = (organizationId: string) => {
    socket?.emit('join:organization', { organizationId });
  };

  const subscribeToTicket = (ticketId: string) => {
    socket?.emit('subscribe:ticket', { ticketId });
  };

  const unsubscribeFromTicket = (ticketId: string) => {
    socket?.emit('unsubscribe:ticket', { ticketId });
  };

  const onTicketUpdate = (callback: (ticket: any) => void) => {
    socket?.on('ticket:update', callback);
  };

  const onNewTicket = (callback: (ticket: any) => void) => {
    socket?.on('ticket:new', callback);
  };

  const onMetricsUpdate = (callback: (metrics: any) => void) => {
    socket?.on('metrics:update', callback);
  };

  const onNewMessage = (callback: (message: any) => void) => {
    socket?.on('message:new', callback);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinOrganization,
        subscribeToTicket,
        unsubscribeFromTicket,
        onTicketUpdate,
        onNewTicket,
        onMetricsUpdate,
        onNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
