/* TripPack service worker (hand-written, no libraries).
 *
 * VERSION and ASSETS are injected at build time by the Vite plugin in vite.config.ts.
 * Strategy: precache the whole app shell on install, then serve it cache-first, so the app
 * loads instantly and works with no network. Each build gets a new VERSION, which installs a
 * fresh worker and removes the previous version's cache on activate.
 */
const VERSION = '__VERSION__';
const PRECACHE = 'trippack-precache-' + VERSION;
const RUNTIME = 'trippack-runtime';
const ASSETS = __ASSETS__;

const resolve = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(ASSETS.map(resolve)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('trippack-precache-') && k !== PRECACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const precache = await caches.open(PRECACHE);

      // Page loads: serve the cached app shell (works offline, and deep links like #/trip/ID).
      if (request.mode === 'navigate') {
        return (
          (await precache.match(resolve('./index.html'))) ||
          (await precache.match(resolve('./'))) ||
          fetch(request)
        );
      }

      // Everything else: cache first, then network (and remember what we fetched).
      const hit = (await precache.match(request)) || (await caches.match(request));
      if (hit) return hit;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const runtime = await caches.open(RUNTIME);
          runtime.put(request, response.clone());
        }
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
