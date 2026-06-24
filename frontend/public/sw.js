const CACHE_NAME = 'justenjoy-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and storing default assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que vayan a dominios externos (como Firebase/Google APIs)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ignorar las rutas de la API interna para evitar que el fallback offline devuelva HTML
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Offline fallback solo para navegaciones HTML
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
