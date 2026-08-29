// Mirza Mobile & Diaper Shop PWA Service Worker (V5 - 100% Offline Engine & Background Cloud Sync)
const CACHE_NAME = 'mirza-shop-v5';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).catch((err) => console.warn('[PWA SW] Precache warning:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  // 1. Always bypass API & Cloud Sync requests (Network Only)
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  // 2. HTML page navigations (Cache First with Background Network Update for Instant Offline Load)
  if (event.request.mode === 'navigate' || (requestUrl.origin === location.origin && (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html'))) {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        const fetchPromise = fetch(event.request).then((networkRes) => {
          if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkRes;
        }).catch(() => {
          return cached || caches.match('/index.html');
        });

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Static Assets, Images, Manifest & CDN Resources (Tailwind, Fonts, html2canvas)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkRes) => {
        if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkRes;
      }).catch(() => {
        // Fallback for image requests
        if (event.request.destination === 'image') {
          return caches.match('/icon-192.png');
        }
        return caches.match('/index.html');
      });
    })
  );
});
