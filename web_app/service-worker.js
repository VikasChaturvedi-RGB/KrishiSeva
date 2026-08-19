const CACHE_NAME = "ksh-shell-v1";

const APP_SHELL = [
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/data.js",
  "js/i18n.js",
  "js/api.js",
  "js/app.js",
  "locales/en.json",
  "locales/hi.json",
  "locales/bn.json",
  "locales/mr.json",
  "locales/te.json",
  "locales/ta.json",
  "locales/gu.json",
  "locales/ur.json",
  "locales/kn.json",
  "locales/or.json",
  "locales/ml.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only manage same-origin app-shell requests. Cross-origin API calls (to the backend)
  // pass straight through to the network — offline behaviour for those is handled by
  // app.js's own localStorage caches (reference data + last diagnosis + history).
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
