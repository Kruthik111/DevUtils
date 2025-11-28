const CACHE_NAME = 'devutils-v1';
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (isFileProtocol) {
    return; // Skip service worker for file:// protocol
  }
  
  // Skip service worker for Next.js dev chunks and HMR in development
  const url = new URL(event.request.url);
  const isDevChunk = url.pathname.includes('/_next/static/chunks/') || 
                     url.pathname.includes('/_next/webpack-hmr') ||
                     url.pathname.includes('/_next/turbopack');
  
  // In development, bypass cache for chunks to avoid loading issues
  if (isDevChunk && (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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