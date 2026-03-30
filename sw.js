const CACHE_NAME = 'conan-tracker-v8';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/storage.js',
  '/js/ui.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // API 요청은 캐시 안 함 (네트워크 우선)
  if (e.request.url.includes('api.jikan.moe')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
