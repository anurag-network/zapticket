/// <reference lib="webworker" />

const CACHE_NAME = 'zapticket-v2';
const STATIC_CACHE = 'zapticket-static-v2';
const DYNAMIC_CACHE = 'zapticket-dynamic-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/tickets',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const API_ROUTES = [
  '/api/v1/tickets',
  '/api/v1/customers',
  '/api/v1/knowledge-base',
  '/api/v1/dashboard',
];

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting(),
    ])
  );
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => 
              key !== STATIC_CACHE && 
              key !== DYNAMIC_CACHE &&
              !key.startsWith('zapticket-v1')
            )
            .map((key) => caches.delete(key))
        );
      })
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
      return;
    }

    if (url.origin !== location.origin) {
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request));
      return;
    }

    if (url.pathname.startsWith('/dashboard')) {
      event.respondWith(networkFirst(request));
      return;
    }

    if (url.pathname.startsWith('/tickets/')) {
      event.respondWith(networkFirst(request));
      return;
    }

    event.respondWith(cacheFirst(request));
  });

  async function cacheFirst(request: Request): Promise<Response> {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
    }
  }

  async function networkFirst(request: Request): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      
      if (request.url.includes('/api/')) {
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            cached: true,
            message: 'You are currently offline. Some data may be outdated.' 
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return caches.match(OFFLINE_URL);
    }
  }

  self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'zapticket-notification',
      renotify: true,
      data: {
        url: data.url || '/dashboard',
        dateOfArrival: Date.now(),
        type: data.type,
      },
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ZapTicket', options)
    );
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/dashboard';

    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
    );
  });

  self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }

    if (event.data?.type === 'CACHE_URLS') {
      const urls = event.data.urls || [];
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(urls))
      );
    }

    if (event.data?.type === 'CLEAR_CACHE') {
      event.waitUntil(
        Promise.all([
          caches.delete(STATIC_CACHE),
          caches.delete(DYNAMIC_CACHE),
        ])
      );
    }
  });

  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tickets') {
      event.waitUntil(syncTickets());
    }
    
    if (event.tag === 'sync-messages') {
      event.waitUntil(syncMessages());
    }
  });

  async function syncTickets() {
    const db = await openOfflineDB();
    const tickets = await db.getAll('pending-tickets');
    
    for (const ticket of tickets) {
      try {
        await fetch('/api/v1/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticket),
        });
        await db.delete('pending-tickets', ticket.id);
      } catch (error) {
        console.error('Failed to sync ticket:', error);
      }
    }
  }

  async function syncMessages() {
    const db = await openOfflineDB();
    const messages = await db.getAll('pending-messages');
    
    for (const message of messages) {
      try {
        await fetch(`/api/v1/tickets/${message.ticketId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
        await db.delete('pending-messages', message.id);
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  }

  async function openOfflineDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('zapticket-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('pending-tickets')) {
          db.createObjectStore('pending-tickets', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pending-messages')) {
          db.createObjectStore('pending-messages', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('cached-data')) {
          db.createObjectStore('cached-data', { keyPath: 'key' });
        }
      };
    });
  }
});

export {};
