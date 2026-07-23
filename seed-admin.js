// Minimal, conservative service worker: caches only the static app shell
// (HTML/CSS/JS/icons). Never caches /api/* — job data, auth, and bids must
// always be fresh and never served stale or to the wrong signed-in user.
const CACHE = 'tradebid-shell-v1';
const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or non-GET requests — always go to the network.
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Network-first for the app shell, so users always get the latest deploy
  // when online, with a cached fallback when they're offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});
