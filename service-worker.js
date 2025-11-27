const CACHE_NAME = 'kiblat-mpi-2026-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/absensi.html',
  '/css/style.css',
  '/js/script.js',
  '/js/landing.js',
  '/js/firebase-config.js',
  '/data/members.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // PERBAIKAN: Hanya cache GET requests
  // POST, PUT, DELETE tidak bisa di-cache
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching untuk Firebase API requests
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Hanya cache response yang sukses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
