const CACHE_NAME = 'devutils-v2';
const isFileProtocol = self.location.protocol === 'file:';
const urlsToCache = [
  '/',
  '/notes',
  '/test-tool',
  '/handle-server',
  '/db-check',
  '/extension',
  '/sign-in',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  if (isFileProtocol) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - network first for navigation, cache first for assets
self.addEventListener('fetch', (event) => {
  if (isFileProtocol) {
    return; // Skip service worker for file:// protocol
  }
  
  const url = new URL(event.request.url);
  
  // Skip service worker for Next.js dev chunks and HMR in development
  const isDevChunk = url.pathname.includes('/_next/static/chunks/') || 
                     url.pathname.includes('/_next/webpack-hmr') ||
                     url.pathname.includes('/_next/turbopack');
  
  // In development, bypass cache for chunks to avoid loading issues
  if (isDevChunk && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Skip service worker for API routes - always fetch from network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Network-first strategy for navigation requests (HTML pages)
  // This ensures users always get fresh content
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Cache the response for future use
          if (fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (isFileProtocol) {
    return;
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});