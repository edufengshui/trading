/* sw.js — Trading Calculator service worker.
 * Scope: /trading/ (registered with a relative path, so it never touches /xkdg/).
 * Strategy: network-first with cache: 'no-store', falling back to the offline cache.
 * Bump CACHE only for a deliberate global wipe after a serious bug — not every deploy.
 */
'use strict';

var CACHE = 'trading-app-v11';

// Core files precached at install so the app opens offline. Relative paths only.
var CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lunar.js',
  './solar-time.js',
  './jieqi-gmt.js',
  './daliuren.js',
  './trend.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
