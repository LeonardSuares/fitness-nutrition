// Offline support. Network first, so edits you deploy show up straight away;
// the cached copy is used whenever the phone is offline.
const CACHE = 'steady-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'data/seed.js', 'data/motivation.js',
  'js/app.js', 'js/core.js', 'js/store.js', 'js/logic.js', 'js/ics.js',
  'js/ui-today.js', 'js/ui-workout.js', 'js/ui-progress.js', 'js/ui-plan.js', 'js/ui-settings.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('index.html'))),
  );
});
