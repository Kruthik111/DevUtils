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