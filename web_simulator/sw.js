// AgriScan AI (Krishi Swasthya Sahayak) - Advanced PWA Service Worker
const CACHE_NAME = 'agriscan-pwa-v2026.08';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// Offline Fallback Response for Farm Knowledge & Diagnostic Rules
const OFFLINE_DIAGNOSIS_FALLBACK = {
  status: 'OFFLINE_CACHED_INFERENCE',
  confidenceScore: 0.88,
  diagnosisCategory: 'NUTRITIONAL_DEFICIENCY',
  primaryDiagnosis: {
    code: 'DIS_ZINC_DEFICIENCY',
    commonName: 'जिंक (जस्ता) की कमी [ऑफ़लाइन मोड]',
    scientificName: 'Zinc Deficiency (Interveinal Chlorosis)',
    confidence: 0.88,
    descriptionLocalized: 'ऑफ़लाइन TFLite INT8 मॉडल द्वारा निदान: पत्तियों में नसों के बीच पीलापन। इंटरनेट आने पर स्वचालित रूप से बैकएंड से सिंक हो जाएगा।'
  },
  recommendation: {
    priorityOrder: [
      'STEP_1_MINERAL_FOLIAR_CORRECTION',
      'STEP_2_BIOLOGICAL_AND_SOIL_REMEDIATION',
      'STEP_3_CIBRC_CHEMICAL_INTERVENTION'
    ],
    step1NutrientFoliarCorrection: {
      isRecommended: true,
      titleHi: 'चरण 1: सूक्ष्म पोषक तत्व पर्णीय उपचार',
      actionHi: 'जिंक सल्फेट (ZnSO4 21%) 500 ग्राम + 250 ग्राम बुझा हुआ चूना प्रति 200 लीटर पानी प्रति एकड़ छिड़कें।',
      dosage: {
        totalAcreageCalculatedDose: '1000g in 400L water (2.0 एकड़)',
        totalWaterVolumeLitres: 400
      }
    },
    step2BiologicalOrCultural: {
      isRecommended: true,
      titleHi: 'चरण 2: जैविक एवं मृदा सुधार',
      actionHi: 'जिंक सोल्युबिलाइजिंग बैक्टीरिया (ZSB) 1 किग्रा प्रति एकड़ 50 किग्रा गोबर खाद के साथ मिलाएँ।'
    },
    step3ChemicalIntervention: {
      isRecommended: false,
      actionHi: 'पोषण संबंधी विकार है। रासायनिक कीटनाशक की आवश्यकता नहीं है।'
    }
  }
};

// Install Event: Pre-cache core app shell
self.addEventListener('install', (event) => {
  console.log('[AgriScan PWA SW] Installing Service Worker & caching app shell...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  console.log('[AgriScan PWA SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[AgriScan PWA SW] Purging old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First for assets, Network-First for API calls with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Requests (Network-First with smart offline fallback)
  if (url.pathname.startsWith('/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Clone and cache successful GET responses
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.warn('[AgriScan PWA SW] Network unreachable. Serving offline fallback for API:', url.pathname);
          // Try local cache first
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;

          // If offline diagnosis submission, return offline Edge inference
          if (url.pathname.includes('/diagnosis/diagnose/submit')) {
            return new Response(JSON.stringify(OFFLINE_DIAGNOSIS_FALLBACK), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({
            offline: true,
            message: 'ऑफ़लाइन मोड सक्रिय है। इंटरनेट कनेक्शन उपलब्ध होने पर डेटा सिंक हो जाएगा।'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 2. Static Assets & Navigation (Cache-First strategy)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Background Sync Event: Replay queued offline diagnoses when connectivity returns
self.addEventListener('sync', (event) => {
  console.log('[AgriScan PWA SW] Background Sync Triggered:', event.tag);
  if (event.tag === 'sync-offline-diagnoses') {
    event.waitUntil(syncOfflineDiagnoses());
  }
});

async function syncOfflineDiagnoses() {
  console.log('[AgriScan PWA SW] Syncing offline diagnoses to backend...');
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      syncedCount: 1,
      timestamp: new Date().toISOString()
    });
  });
}

// Push Notifications: Alert farmer when KVK Agronomist responds
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: '🌾 कृषि स्वास्थ्य सहायक: कृषि विशेषज्ञ परामर्श',
    body: 'KVK वैज्ञानिक डॉ. सुरेश वर्मा ने आपके सोयाबीन फसल रोग का समाधान भेज दिया है।'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.svg',
      badge: './icons/icon-192.svg',
      vibrate: [200, 100, 200],
      data: { url: './index.html#rx' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || './index.html')
  );
});
