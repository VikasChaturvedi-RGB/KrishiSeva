import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import * as fs from 'fs';
import { router } from './routes/apiRoutes';
import { AppDatabase } from './db/database';
import { DatabaseSeeder } from './db/seeder';
import { UserRepository, MandiPriceRepository } from './db/repositories';

const app = express();
const PORT = Number(process.env.PORT || 8080);

// Production reverse-proxy trust & header hardening (Cloud Run / Firebase Hosting CDN)
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors());
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Zero-dependency sliding-window IP rate limiter protecting Always-Free Cloud quotas
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function freeTierRateGuard(maxPerMinute: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'anon';
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > maxPerMinute) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'कृपया 1 मिनट प्रतीक्षा करें — निःशुल्क सेवा सुरक्षा सीमा सक्रिय है। (Please retry in a minute.)'
      });
      return;
    }
    next();
  };
}

app.use('/v1/translate', freeTierRateGuard(60));
app.use('/v1/gemini', freeTierRateGuard(30));

// Initialize Database & Seed Reference Agronomy Datasets
try {
  AppDatabase.getInstance();
  const existingUsers = UserRepository.listAllFarmers();
  if (existingUsers.length === 0) {
    DatabaseSeeder.seedAll();
  } else if (MandiPriceRepository.listAll().length === 0) {
    DatabaseSeeder.seedEcosystemData(existingUsers[0].id);
  }
} catch (err) {
  console.error('Database initialization warning:', err);
}

function resolveWebSimulatorPath(): string {
  const candidates = [
    path.join(__dirname, '../../web_app'),
    path.join(__dirname, '../../web_simulator'),
    path.join(process.cwd(), 'web_app'),
    path.join(process.cwd(), 'web_simulator'),
    path.join(process.cwd(), '../web_app'),
    path.join(process.cwd(), '../web_simulator')
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, 'index.html'))) return p;
  }
  return path.join(__dirname, '../../web_simulator');
}

const webRootPath = resolveWebSimulatorPath();

// Explicit TWA Digital Asset Links endpoint (/.well-known/assetlinks.json)
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const assetLinksFile = path.join(webRootPath, '.well-known', 'assetlinks.json');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (fs.existsSync(assetLinksFile)) {
    res.sendFile(assetLinksFile);
    return;
  }
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'in.gov.krishisahayak.guide',
        sha256_cert_fingerprints: (process.env.ANDROID_SHA256_FINGERPRINTS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }
  ]);
});

// Static OpenAPI contracts
const contractsPath = fs.existsSync(path.join(__dirname, '../../contracts/openapi'))
  ? path.join(__dirname, '../../contracts/openapi')
  : path.join(process.cwd(), '../contracts/openapi');
if (fs.existsSync(contractsPath)) {
  app.use('/contracts', express.static(contractsPath));
}

// Static B2C PWA Serving (with no-cache on sw.js so updates propagate immediately)
app.use(
  express.static(webRootPath, {
    dotfiles: 'allow',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.endsWith('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      } else if (filePath.endsWith('.apk')) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="krishi-sahayak.apk"');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  })
);
app.use('/app', express.static(webRootPath));

app.get('/', (_req, res) => {
  res.sendFile(path.join(webRootPath, 'index.html'));
});

app.get('/app', (_req, res) => {
  res.sendFile(path.join(webRootPath, 'index.html'));
});

app.get('/download', (_req, res) => {
  res.sendFile(path.join(webRootPath, 'download.html'));
});

app.get('/krishi-sahayak.apk', (_req, res) => {
  const directApk = path.join(webRootPath, 'krishi-sahayak.apk');
  const downloadsApk = path.join(webRootPath, 'downloads', 'krishi-sahayak.apk');
  if (fs.existsSync(directApk)) {
    res.download(directApk, 'krishi-sahayak.apk');
    return;
  }
  if (fs.existsSync(downloadsApk)) {
    res.download(downloadsApk, 'krishi-sahayak.apk');
    return;
  }
  res.redirect('https://github.com/VikasChaturvedi-RGB/KrishiSeva/releases/latest/download/krishi-sahayak-mlkit-release.apk');
});

app.get('/privacy', (_req, res) => {
  res.sendFile(path.join(webRootPath, 'privacy.html'));
});

// Mount API Gateway /v1
app.use('/v1', router);

// Cloud Run Liveness & Readiness Probes
app.get('/readyz', (_req, res) => {
  res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  const stats = AppDatabase.getInstance().getStats();
  res.json({
    service: 'Krishi Sahayak — Zero-Selling B2C Farmer Guidance Gateway',
    status: 'HEALTHY',
    version: '2.0.0-india-b2c',
    region: process.env.CLOUD_RUN_REGION || 'asia-south1',
    timestamp: new Date().toISOString(),
    cibrcRev: '2026.07-CIBRC-REV3',
    dpdpCompliant: true,
    zeroSellingPolicy: true,
    database: {
      engine: stats.databaseEngine,
      walMode: stats.walMode,
      fileSizeBytes: stats.fileSizeBytes,
      fileSizeFormatted: stats.fileSizeFormatted,
      activeTablesCount: stats.activeTables.length
    },
    pwaAndTwaCapabilities: {
      manifest: '/manifest.json',
      serviceWorker: '/sw.js',
      privacyPolicy: '/privacy.html',
      digitalAssetLinks: '/.well-known/assetlinks.json',
      offlineCacheEnabled: true
    }
  });
});

// Central JSON error handler (never leak stack traces in production)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err?.message || err);
  res.status(err?.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'सेवा में अस्थायी व्यवधान है, कृपया पुनः प्रयास करें।'
  });
});

let activeServer: ReturnType<typeof app.listen> | null = null;

function startServer(port: number) {
  const srv = app.listen(port, '0.0.0.0', () => {
    console.log(`🌾 Krishi Sahayak — Production B2C Farmer Guidance Server running at http://localhost:${port}`);
    console.log(`📱 Multilingual B2C PWA (22 Indian Languages): http://localhost:${port}`);
    console.log(`🔒 Privacy Policy (DPDP & Play Store): http://localhost:${port}/privacy.html`);
    console.log(`🔗 TWA Digital Asset Links: http://localhost:${port}/.well-known/assetlinks.json`);
    console.log(`🩺 Health & Readiness: http://localhost:${port}/health | http://localhost:${port}/readyz`);
  });

  activeServer = srv;

  srv.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ Port ${port} is in use, attempting port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}; closing Krishi Sahayak server gracefully...`);
  if (activeServer) {
    activeServer.close(() => {
      AppDatabase.getInstance().close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer(PORT);
