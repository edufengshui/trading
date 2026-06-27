/* Service worker for the /trading PWA.
   Separate cache name so it never collides with the /xkdg app.
   Network-first: always try the network, fall back to cache when offline. */
const CACHE = 'trading-app-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () { /* ignore a missing asset */ });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);   // wipe old versions
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(function (resp) {
      const copy = resp.clone();
      caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      return resp;
    }).catch(function () {
      return caches.match(event.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
