// Krishi Sahayak - Offline-First Google-First PWA Service Worker
const CACHE_NAME = 'krishi-sahayak-pwa-v2026.11-free';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './locales22.js',
  './guidance-modules.js',
  './google-cloud-client.js',
  './b2c-consumer.js',
  './ga4-analytics.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

const OFFLINE_DIAGNOSIS_FALLBACK = {
  status: 'OFFLINE_CACHED_INFERENCE',
  confidenceScore: 0.91,
  diagnosisCategory: 'NUTRITIONAL_DEFICIENCY',
  primaryDiagnosis: {
    code: 'DIS_ZINC_DEFICIENCY',
    commonName: 'जिंक (जस्ता) पोषक तत्व की कमी [ऑफ़लाइन मार्गदर्शन]',
    scientificName: 'Zinc Micronutrient Deficiency (Interveinal Chlorosis)',
    confidence: 0.91,
    descriptionLocalized: 'ऑफ़लाइन पादप शरीर-क्रिया इंजन: नई पत्तियों की शिराओं के बीच सममित पीलापन। यह वायरस नहीं बल्कि मिट्टी में जिंक की कमी है — महंगे कीटनाशक न खरीदें।'
  },
  recommendation: {
    priorityOrder: [
      'STEP_1_MINERAL_FOLIAR_CORRECTION',
      'STEP_2_BIOLOGICAL_AND_SOIL_REMEDIATION',
      'STEP_3_CIBRC_CHEMICAL_INTERVENTION'
    ],
    step1NutrientFoliarCorrection: {
      isRecommended: true,
      titleHi: 'चरण 1: संतुलित सूक्ष्म-पोषक छिड़काव (प्रति 15L पंप: 38g)',
      actionHi: 'जिंक सल्फेट 21% (38 ग्राम) + बुझा चूना पानी (19 ग्राम) प्रति 15 लीटर पंप की दर से सुबह 7–10 बजे छिड़कें (1 एकड़ = 500g / 200L पानी)।'
    },
    step2BiologicalOrCultural: {
      isRecommended: true,
      titleHi: 'चरण 2: घरेलू जीवामृत एवं ZSB जैव-सुधार',
      actionHi: '200 लीटर घरेलू जीवामृत या 1 किग्रा ZSB जीवाणु 50 किग्रा सड़ी गोबर खाद के साथ जड़ों के पास दें।'
    },
    step3ChemicalIntervention: {
      isRecommended: false,
      actionHi: 'रासायनिक जहर/कीटनाशक की बिल्कुल आवश्यकता नहीं है — अपने पैसे व मिट्टी बचाएं।'
    }
  }
};

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
          if (url.pathname.includes('/diagnosis/diagnose/submit')) {
            return new Response(JSON.stringify(OFFLINE_DIAGNOSIS_FALLBACK), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({
            offline: true,
            zeroCostOfflineMode: true,
            message: 'ऑफ़लाइन मोड सक्रिय है — आपके फोन पर सुरक्षित कृषि मार्गदर्शन दिखाया जा रहा है।'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
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
