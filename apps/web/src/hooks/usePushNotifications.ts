'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushSubscriptionState {
  subscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    subscribed: false,
    subscription: null,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState({
        subscribed: !!subscription,
        subscription,
        error: null,
      });
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to check subscription' }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setState({
        subscribed: true,
        subscription,
        error: null,
      });

      return subscription;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to subscribe';
      setState(prev => ({ ...prev, error }));
      return null;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const subscription = state.subscription;
      if (subscription) {
        await subscription.unsubscribe();
        
        await fetch('/api/notifications/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState({
        subscribed: false,
        subscription: null,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setState(prev => ({ ...prev, error }));
    }
  }, [state.subscription]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    checkSubscription,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    });
  }, []);

  const update = useCallback(() => {
    if (registration) {
      registration.update();
    }
  }, [registration]);

  return { registration, updateAvailable, update };
}
