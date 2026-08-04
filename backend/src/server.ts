import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import * as fs from 'fs';
import { router } from './routes/apiRoutes';
import { AppDatabase } from './db/database';
import { DatabaseSeeder } from './db/seeder';
import { UserRepository } from './db/repositories';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize Production SQLite Database & Check Seeding
try {
  const dbInstance = AppDatabase.getInstance();
  const existingUsers = UserRepository.listAllFarmers();
  if (existingUsers.length === 0) {
    DatabaseSeeder.seedAll();
  }
} catch (err) {
  console.error('Database initialization warning:', err);
}

function resolveWebSimulatorPath(): string {
  const candidates = [
    path.join(__dirname, '../../web_simulator'),
    path.join(process.cwd(), 'web_simulator'),
    path.join(process.cwd(), '../web_simulator'),
    path.join(__dirname, '../../../web_simulator')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, '../../web_simulator');
}

const webSimulatorPath = resolveWebSimulatorPath();

// Static contracts endpoint
const contractsPath = fs.existsSync(path.join(__dirname, '../../contracts/openapi'))
  ? path.join(__dirname, '../../contracts/openapi')
  : path.join(process.cwd(), '../contracts/openapi');
app.use('/contracts', express.static(contractsPath));

// Static Web Simulator & PWA Serving
app.use(express.static(webSimulatorPath));
app.use('/app', express.static(webSimulatorPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(webSimulatorPath, 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(webSimulatorPath, 'index.html'));
});

// Mount API Gateway /v1
app.use('/v1', router);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = AppDatabase.getInstance().getStats();
  res.json({
    service: 'AgriScan AI Microservices Gateway',
    status: 'HEALTHY',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cibrcRev: '2026.07-CIBRC-REV3',
    dpdpCompliant: true,
    database: {
      engine: 'node:sqlite (Embedded SQLite 3)',
      walMode: stats.walMode,
      filePath: stats.filePath,
      fileSizeBytes: stats.fileSizeBytes,
      fileSizeFormatted: stats.fileSizeFormatted,
      activeTables: stats.activeTables
    },
    pwaCapabilities: {
      manifest: '/manifest.json',
      serviceWorker: '/sw.js',
      offlineCacheEnabled: true
    }
  });
});

function startServer(port: number) {
  const srv = app.listen(port, '0.0.0.0', () => {
    console.log(`🌾 AgriScan AI Backend Services Gateway running at http://localhost:${port}`);
    console.log(`📱 PWA Web Simulator: http://localhost:${port}/index.html`);
    console.log(`📱 PWA Web Simulator (App route): http://localhost:${port}/app`);
    console.log(`💾 Native SQLite Database Active with WAL mode`);
    console.log(`📄 OpenAPI Contracts: http://localhost:${port}/contracts`);
    console.log(`🩺 Health check: http://localhost:${port}/health`);
  });

  srv.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is in use, attempting port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(Number(PORT));
