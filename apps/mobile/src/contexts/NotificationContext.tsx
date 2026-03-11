import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/client';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissions: Notifications.PermissionsStatus | null;
  requestPermissions: () => Promise<boolean>;
  scheduleTicketReminder: (ticketId: string, title: string, body: string, date: Date) => Promise<string>;
  cancelReminder: (identifier: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissions, setPermissions] = useState<Notifications.PermissionsStatus | null>(null);

  useEffect(() => {
    registerForPushNotifications();
    
    const subscription = Notifications.addNotificationReceivedListener(setNotification);
    return () => subscription.remove();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    setPermissions(existingStatus);

    if (existingStatus !== 'granted') {
      return;
    }

    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token);

      // Send token to server
      await api.instance.post('/notifications/push/subscribe', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissions(status);
    return status === 'granted';
  };

  const scheduleTicketReminder = async (
    ticketId: string,
    title: string,
    body: string,
    date: Date
  ): Promise<string> => {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ticketId },
        sound: true,
      },
      trigger: { date },
    });
    return identifier;
  };

  const cancelReminder = async (identifier: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        permissions,
        requestPermissions,
        scheduleTicketReminder,
        cancelReminder,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
