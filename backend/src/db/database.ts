import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private db: DatabaseSync;
  private dbPath: string;

  private constructor() {
    // Resolve database storage directory
    const dataDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'agriscan_production.db');

    // Initialize native SQLite database
    this.db = new DatabaseSync(this.dbPath);

    // Enable high-performance Write-Ahead Logging (WAL) and foreign key enforcement
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    this.db.exec('PRAGMA temp_store = MEMORY;');
    this.db.exec('PRAGMA busy_timeout = 5000;');

    this.initializeSchema();
  }

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  public static resetForTesting(): AppDatabase {
    if (AppDatabase.instance) {
      try {
        AppDatabase.instance.db.close();
      } catch (e) {}
      AppDatabase.instance = null;
    }
    const dataDir = path.resolve(__dirname, '../../data');
    const dbPath = path.join(dataDir, 'agriscan_production.db');
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      } catch (e) {}
    }
    return AppDatabase.getInstance();
  }

  public getRawDb(): DatabaseSync {
    return this.db;
  }

  public getDb(): DatabaseSync {
    return this.db;
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  private initializeSchema(): void {
    const candidateSchemaPaths = [
      path.resolve(__dirname, 'schema.sql'),
      path.resolve(__dirname, '../src/db/schema.sql'),
      path.resolve(process.cwd(), 'src/db/schema.sql'),
      path.resolve(process.cwd(), 'backend/src/db/schema.sql'),
      path.resolve(process.cwd(), 'dist/db/schema.sql')
    ];

    let schemaContent = '';
    for (const p of candidateSchemaPaths) {
      if (fs.existsSync(p)) {
        schemaContent = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (schemaContent) {
      this.db.exec(schemaContent);
    } else {
      console.warn('⚠️ Warning: schema.sql file not located, skipping DDL execution');
    }
  }

  /**
   * Run a function within an ACID transaction
   */
  public transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Safe read-only query execution for live inspection / analytics
   */
  public executeReadOnlyQuery(sql: string, params: any[] = []): any[] {
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select') && !trimmed.startsWith('pragma') && !trimmed.startsWith('explain')) {
      throw new Error('SECURITY_ERROR: Only SELECT, PRAGMA, and EXPLAIN queries are permitted in read-only mode.');
    }
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Diagnostic statistics for database health checks
   */
  public getDatabaseStats() {
    let fileSize = 0;
    try {
      const stats = fs.statSync(this.dbPath);
      fileSize = stats.size;
    } catch {
      fileSize = 0;
    }

    const tables = [
      'users',
      'dpdp_consents',
      'otp_sessions',
      'farms',
      'soil_health_cards',
      'crop_cycles',
      'diagnoses',
      'adaptive_questionnaires',
      'recommendations',
      'escalations',
      'clinic_inventory',
      'inventory_batches',
      'audit_trail_logs',
      'farmer_login_activity_logs'
    ];

    const tableCounts: Record<string, number> = {};
    for (const tbl of tables) {
      try {
        const row: any = this.db.prepare(`SELECT COUNT(*) as count FROM ${tbl}`).get();
        tableCounts[tbl] = row ? row.count : 0;
      } catch {
        tableCounts[tbl] = 0;
      }
    }

    // Get journal mode
    const journalModeRow: any = this.db.prepare('PRAGMA journal_mode;').get();

    return {
      databaseEngine: 'node:sqlite (Embedded Production Engine)',
      databaseFile: this.dbPath,
      fileSizeBytes: fileSize,
      fileSizeFormatted: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      journalMode: journalModeRow ? journalModeRow.journal_mode : 'wal',
      tableCounts,
      timestamp: new Date().toISOString()
    };
  }

  public getStats() {
    const s = this.getDatabaseStats();
    return {
      walMode: (s.journalMode || '').toLowerCase() === 'wal',
      journalMode: s.journalMode,
      filePath: s.databaseFile,
      fileSizeBytes: s.fileSizeBytes,
      fileSizeFormatted: s.fileSizeFormatted,
      databaseEngine: s.databaseEngine,
      activeTables: Object.keys(s.tableCounts),
      tableCounts: s.tableCounts,
      timestamp: s.timestamp
    };
  }

  public close(): void {
    try {
      this.db.close();
    } catch (e) {
      console.error('Error closing database:', e);
    }
  }
}

export const getDb = () => AppDatabase.getInstance().getRawDb();
