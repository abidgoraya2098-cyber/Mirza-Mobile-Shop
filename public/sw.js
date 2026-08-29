// Mirza Mobile & Diaper Shop PWA Service Worker (V6 - High-Reliability Offline Engine)
const CACHE_NAME = 'mirza-shop-v6';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn('[PWA SW] Precache item skip:', asset, e.message);
        }
      }
    })
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

  const url = new URL(event.request.url);

  // 1. API & Cloud Sync requests: ALWAYS Network-Only, NEVER cached
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Navigation requests (Page Reload / Refresh / Direct Link): Network first with fallback to Cache
  if (event.request.mode === 'navigate' || (url.origin === location.origin && (url.pathname === '/' || url.pathname === '/index.html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', copy);
            }).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) return cached;
          return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mirza Mobile Shop</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>مرزا موبائل شاپ</h2><p>آف لائن موڈ - برائے مہربانی انٹرنیٹ بحال ہوتے ہی ریفریش کریں۔</p></body></html>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 3. Static Assets, Images, CDN Scripts & Styles (Cache First with Network Fallback)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch(() => {});
        }
        return networkResponse;
      }).catch(async () => {
        if (event.request.destination === 'image') {
          return (await caches.match('/icon-192.png')) || Response.error();
        }
        return Response.error();
      });
    })
  );
});
