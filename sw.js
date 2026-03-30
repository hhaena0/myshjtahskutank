const CACHE_NAME = 'conan-tracker-v8';
const ASSETS = [
  '/conan-tracker/',
  '/conan-tracker/index.html',
  '/conan-tracker/css/style.css',
  '/conan-tracker/js/app.js',
  '/conan-tracker/js/api.js',
  '/conan-tracker/js/storage.js',
  '/conan-tracker/js/ui.js',
  '/conan-tracker/manifest.json',
  '/conan-tracker/icon-192.png',
  '/conan-tracker/icon-512.png'
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
