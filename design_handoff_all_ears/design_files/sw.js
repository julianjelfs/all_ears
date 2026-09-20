const CACHE = 'allears-v1';
const SHELL = [
  './',
  './All Ears.dc.html',
  './manifest.json',
  './icon.svg',
  './support.js',
  './_ds/modernist-64350e32-bcf5-463d-8ea5-8618cd97f358/styles.css',
  './_ds/modernist-64350e32-bcf5-463d-8ea5-8618cd97f358/_ds_bundle.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for everything, including the sampled guitar notes, so a drill
// that has been run once works with no network at all.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
