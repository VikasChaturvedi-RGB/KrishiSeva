// Krishi Sahayak - Offline-First Google-First PWA Service Worker
// CACHE_NAME is re-stamped by scripts/build_pwa.mjs with a content hash on every
// build, so installed apps pick up new code and the monthly datasets automatically.
const CACHE_NAME = 'krishi-sahayak-pwa-139938449b';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './locales22.js',
  './guidance-modules.js',
  './google-cloud-client.js',
  './b2c-consumer.js',
  './ga4-analytics.js',
  './leaf-vision-engine.js',
  './ai-diagnosis-pipeline.js',
  './area-intelligence-engine.js',
  './area-intelligence.js',
  './app.js',
  './data/crop-variety-almanac.json',
  './data/soil-zone-atlas.json',
  './data/crop-variety-almanac.js',
  './data/soil-zone-atlas.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// NOTE: diagnosis no longer needs a canned offline answer — the on-device
// KrishiLeafVision engine analyses the real photo without any network.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (event.request.method === 'GET' && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          // 503 (not a fake 200) so the app knows to use its on-device engines/data
          return new Response(JSON.stringify({
            offline: true,
            zeroCostOfflineMode: true,
            message: 'ऑफ़लाइन मोड सक्रिय है — आपके फोन पर सुरक्षित कृषि मार्गदर्शन दिखाया जा रहा है।'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Monthly-refreshed datasets: network-first so a new month's advice shows at once
  if (url.pathname.includes('/data/') && /\.(json|js)$/.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return networkRes;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return cached;
        });
      return cached || fetchPromise;
    })
  );
});

// Background Sync: when connectivity returns, ask open app windows to upload the
// diagnoses that were completed on-device while offline (queue lives in the page).
self.addEventListener('sync', (event) => {
  if (event.tag !== 'krishi-diagnosis-sync') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: 'KRISHI_SYNC_DIAGNOSES' }));
    })
  );
});
